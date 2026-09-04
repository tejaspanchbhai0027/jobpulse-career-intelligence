const { GoogleGenAI } = require('@google/genai');
const User = require('../../models/User');
const Application = require('../../models/Application');
const Interview = require('../../models/Interview');
const mongoose = require('mongoose');

let aiClient = null;

const initializeAI = () => {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (err) {
    console.error('Failed to initialize Google GenAI for Copilot:', err.message);
    return null;
  }
};

const getModel = () => {
  const client = initializeAI();
  return client ? { client, modelName: 'gemini-3.6-flash' } : null;
};

/**
 * Builds deterministic response or routes to Gemini, restricted to mentor's students.
 */
const queryCopilot = async (message, institutionId, mentorId) => {
  const q = message.toLowerCase();
  let responseTemplate = {
    summary: '',
    keyMetrics: [],
    students: [],
    recommendations: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };

  // Restrict all lookups to students assigned to THIS mentor
  const mentorStudents = await User.find({ institutionId, mentorId, role: 'STUDENT' }).select('_id name privacySettings').lean();
  const mentorStudentIds = mentorStudents.map(s => s._id);

  // 1. DETERMINISTIC ROUTING (No Gemini)

  // "How many students..."
  if (q.includes('how many students')) {
    const total = mentorStudents.length;
    const active = mentorStudents.filter(s => s.privacySettings?.applicationProgress !== false).length;
    
    responseTemplate.summary = `You have ${total} assigned students, with ${active} actively sharing their application progress.`;
    responseTemplate.keyMetrics = [{ label: 'Assigned Students', value: total }, { label: 'Active Progress', value: active }];
    return responseTemplate;
  }

  // "How many applications..."
  if (q.includes('how many applications') || q.includes('application trends')) {
    const count = await Application.countDocuments({ user: { $in: mentorStudentIds } });
    
    responseTemplate.summary = `Your students have submitted a total of ${count} applications.`;
    responseTemplate.keyMetrics = [{ label: 'Total Applications', value: count }];
    return responseTemplate;
  }

  // "How many interviews..." or "Upcoming interviews"
  if (q.includes('how many interviews') || q.includes('upcoming interviews')) {
    const now = new Date();
    const upcoming = await Interview.find({ 
      student: { $in: mentorStudentIds },
      date: { $gte: now }
    }).populate('student', 'name').populate('application', 'company').sort({ date: 1 }).limit(10);
    
    const count = await Interview.countDocuments({ student: { $in: mentorStudentIds } });
    
    responseTemplate.summary = `There are ${upcoming.length} upcoming interviews scheduled for your students. A total of ${count} interviews have been logged historically.`;
    responseTemplate.keyMetrics = [{ label: 'Upcoming', value: upcoming.length }, { label: 'Total Logs', value: count }];
    
    if (upcoming.length > 0) {
      responseTemplate.students = upcoming.map(i => ({
        _id: i.student._id,
        name: i.student.name,
        note: `Interview with ${i.application ? i.application.company : 'Company'} on ${new Date(i.date).toLocaleDateString()}`
      }));
    }
    return responseTemplate;
  }

  // "Which students need attention?" or "who needs attention"
  if (q.includes('need attention') || q.includes('needs attention') || q.includes('risk')) {
    let attentionStudents = [];
    let highPriority = 0;
    
    const applications = await Application.find({ user: { $in: mentorStudentIds } }).lean();
    const interviews = await Interview.find({ student: { $in: mentorStudentIds } }).lean();
    
    for (let student of mentorStudents) {
      if (student.privacySettings?.applicationProgress !== false) {
        const studentApps = applications.filter(a => a.user.toString() === student._id.toString());
        const studentInterviews = interviews.filter(i => i.student.toString() === student._id.toString());
        
        if (studentApps.length === 0) {
          attentionStudents.push({ _id: student._id, name: student.name, note: 'No application activity', priority: 'MEDIUM' });
        } else if (studentApps.length >= 10 && studentInterviews.length === 0) {
          attentionStudents.push({ _id: student._id, name: student.name, note: 'High apps, 0 interviews (Skill Gap)', priority: 'HIGH' });
          highPriority++;
        }
      }
    }
    
    responseTemplate.summary = `${attentionStudents.length} of your students currently require attention based on operational signals.`;
    responseTemplate.keyMetrics = [{ label: 'Total Interventions', value: attentionStudents.length }, { label: 'High Priority', value: highPriority }];
    
    attentionStudents.sort((a, b) => a.priority === 'HIGH' ? -1 : 1);
    responseTemplate.students = attentionStudents.slice(0, 5);
    
    if (highPriority > 0) {
      responseTemplate.warnings.push('Some students have submitted 10+ applications with zero interview conversions.');
      responseTemplate.recommendations.push('Schedule 1-on-1 resume or interview prep sessions with high-priority students.');
    }
    return responseTemplate;
  }
  
  // 2. AI SUMMARIZATION FALLBACK
  
  const modelConfig = getModel();
  if (!modelConfig) {
    responseTemplate.summary = "Placement data is available, but AI insights are temporarily offline. Try asking a deterministic question like 'How many students?'";
    responseTemplate.warnings.push("AI service unavailable (Check API Key).");
    return responseTemplate;
  }

  // Build secure operational context restricted to mentor
  const sharingAppIds = mentorStudents.filter(s => s.privacySettings?.applicationProgress !== false).map(s => s._id);
  const totalApps = await Application.countDocuments({ user: { $in: sharingAppIds } });
  const totalInterviews = await Interview.countDocuments({ student: { $in: sharingAppIds } });
  
  const context = {
    mentorScope: {
      totalAssignedStudents: mentorStudents.length,
      activeStudentsSharingData: sharingAppIds.length,
      totalApplications: totalApps,
      totalInterviews: totalInterviews
    }
  };

  const prompt = `
    You are the Placement Intelligence Copilot for a mentor at a university.
    You must answer the mentor's question using ONLY the verified data provided.
    
    Verified Data Context:
    ${JSON.stringify(context, null, 2)}
    
    Mentor's Question: "${message}"
    
    RULES:
    1. NEVER invent or hallucinate students, companies, statistics, or names.
    2. If the data is insufficient to answer completely, explicitly state "Not enough verified placement data is available to answer this in detail."
    3. Keep it professional, concise, and focused on mentorship and guiding students.
    4. Provide the output strictly as a JSON object matching this schema:
    {
      "summary": "String (1-2 sentences answering the prompt)",
      "keyMetrics": [{"label": "String", "value": "Number/String"}],
      "recommendations": ["String"],
      "warnings": ["String"]
    }
    
    Return ONLY valid JSON. No markdown code blocks like \`\`\`json.
  `;

  try {
    const { client, modelName } = modelConfig;
    const result = await client.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    
    let text = result.text.trim();
    if (text.startsWith('\`\`\`json')) text = text.replace('\`\`\`json', '');
    if (text.startsWith('\`\`\`')) text = text.replace('\`\`\`', '');
    if (text.endsWith('\`\`\`')) text = text.replace(/\`\`\`$/, '');
    
    const aiResponse = JSON.parse(text);
    
    responseTemplate.summary = aiResponse.summary || "Analysis complete.";
    responseTemplate.keyMetrics = aiResponse.keyMetrics || [];
    responseTemplate.recommendations = aiResponse.recommendations || [];
    responseTemplate.warnings = aiResponse.warnings || [];
    
  } catch (error) {
    console.error("Gemini Copilot Error:", error);
    responseTemplate.summary = "I encountered an error analyzing the placement context.";
  }

  return responseTemplate;
};

module.exports = {
  queryCopilot
};
