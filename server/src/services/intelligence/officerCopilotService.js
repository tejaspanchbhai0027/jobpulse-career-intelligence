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
 * Builds deterministic response or routes to Gemini.
 */
const queryCopilot = async (message, institutionId, placementOfficerId) => {
  const q = message.toLowerCase();
  let responseTemplate = {
    summary: '',
    keyMetrics: [],
    students: [],
    recommendations: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };

  // 1. DETERMINISTIC ROUTING (No Gemini)

  // "How many students..."
  if (q.includes('how many students')) {
    const total = await User.countDocuments({ institutionId, role: 'STUDENT' });
    const active = await User.countDocuments({ 
      institutionId, 
      role: 'STUDENT', 
      'privacySettings.applicationProgress': { $ne: false } 
    });
    
    responseTemplate.summary = `Your institution currently has ${total} registered students, with ${active} actively sharing their application progress.`;
    responseTemplate.keyMetrics = [{ label: 'Total Students', value: total }, { label: 'Active Progress', value: active }];
    return responseTemplate;
  }

  // "How many applications..."
  if (q.includes('how many applications') || q.includes('application trends')) {
    const students = await User.find({ 
      institutionId, 
      role: 'STUDENT', 
      'privacySettings.applicationProgress': { $ne: false } 
    }).select('_id');
    const studentIds = students.map(s => s._id);
    const count = await Application.countDocuments({ user: { $in: studentIds } });
    
    responseTemplate.summary = `Students have submitted a total of ${count} applications across the institution.`;
    responseTemplate.keyMetrics = [{ label: 'Total Applications', value: count }];
    return responseTemplate;
  }

  // "How many interviews..." or "Upcoming interviews"
  if (q.includes('how many interviews') || q.includes('upcoming interviews')) {
    const students = await User.find({ 
      institutionId, 
      role: 'STUDENT', 
      'privacySettings.applicationProgress': { $ne: false } 
    }).select('_id');
    const studentIds = students.map(s => s._id);
    
    const now = new Date();
    const upcoming = await Interview.find({ 
      student: { $in: studentIds },
      date: { $gte: now }
    }).populate('student', 'name').populate('application', 'company').sort({ date: 1 }).limit(10);
    
    const count = await Interview.countDocuments({ student: { $in: studentIds } });
    
    responseTemplate.summary = `There are ${upcoming.length} upcoming interviews scheduled. A total of ${count} interviews have been logged historically.`;
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
    const students = await User.find({ institutionId, role: 'STUDENT' }).populate('mentorId', 'name').lean();
    
    let attentionStudents = [];
    let highPriority = 0;
    
    // Build context with privacy
    const sharingAppStudents = students.filter(s => s.privacySettings?.applicationProgress !== false);
    const sharingAppIds = sharingAppStudents.map(s => s._id);
    const applications = await Application.find({ user: { $in: sharingAppIds } }).lean();
    const interviews = await Interview.find({ student: { $in: sharingAppIds } }).lean();
    
    for (let student of students) {
      if (!student.mentorId) {
        attentionStudents.push({ _id: student._id, name: student.name, note: 'No mentor assigned', priority: 'HIGH' });
        highPriority++;
        continue;
      }
      
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
    
    responseTemplate.summary = `${attentionStudents.length} students currently require attention based on operational signals.`;
    responseTemplate.keyMetrics = [{ label: 'Total Interventions', value: attentionStudents.length }, { label: 'High Priority', value: highPriority }];
    
    attentionStudents.sort((a, b) => a.priority === 'HIGH' ? -1 : 1);
    responseTemplate.students = attentionStudents.slice(0, 5);
    
    if (highPriority > 0) {
      responseTemplate.warnings.push('Some students have submitted 10+ applications with zero interview conversions.');
      responseTemplate.recommendations.push('Assign mentors to unassigned students immediately.');
    }
    return responseTemplate;
  }
  
  // "Students without mentors" or "no mentor"
  if (q.includes('without mentor') || q.includes('no mentor')) {
    const unassigned = await User.find({ institutionId, role: 'STUDENT', mentorId: { $exists: false } }).select('name _id').limit(10);
    const count = await User.countDocuments({ institutionId, role: 'STUDENT', mentorId: { $exists: false } });
    
    responseTemplate.summary = `${count} students currently do not have a mentor assigned.`;
    responseTemplate.keyMetrics = [{ label: 'Unassigned', value: count }];
    responseTemplate.students = unassigned.map(s => ({ _id: s._id, name: s.name, note: 'Needs mentor assignment' }));
    
    if (count > 0) {
      responseTemplate.warnings.push('Students without mentors have lower placement success rates.');
      responseTemplate.recommendations.push('Review mentor capacity and assign these students ASAP.');
    }
    return responseTemplate;
  }
  
  // "Mentor workload" or "Which mentors have the most students"
  if (q.includes('mentor workload') || q.includes('mentors have the most')) {
    const mentors = await User.find({ institutionId, role: 'MENTOR' }).select('name _id').lean();
    const students = await User.find({ institutionId, role: 'STUDENT', mentorId: { $exists: true } }).select('mentorId').lean();
    
    let workload = mentors.map(m => {
      const assigned = students.filter(s => s.mentorId.toString() === m._id.toString()).length;
      return { name: m.name, assigned };
    });
    
    workload.sort((a, b) => b.assigned - a.assigned);
    const topMentors = workload.slice(0, 3);
    
    responseTemplate.summary = `You have ${mentors.length} active mentors. The highest workload is currently ${topMentors.length > 0 ? topMentors[0].assigned : 0} students per mentor.`;
    responseTemplate.keyMetrics = [{ label: 'Total Mentors', value: mentors.length }];
    
    responseTemplate.recommendations = topMentors.map(m => `${m.name} is managing ${m.assigned} students.`);
    return responseTemplate;
  }

  // 2. AI SUMMARIZATION FALLBACK
  
  const modelConfig = getModel();
  if (!modelConfig) {
    responseTemplate.summary = "Placement data is available, but AI insights are temporarily offline. Try asking a deterministic question like 'How many students?'";
    responseTemplate.warnings.push("AI service unavailable (Check API Key).");
    return responseTemplate;
  }

  // Build secure operational context
  const students = await User.find({ institutionId, role: 'STUDENT' }).select('_id privacySettings').lean();
  const sharingAppIds = students.filter(s => s.privacySettings?.applicationProgress !== false).map(s => s._id);
  
  const totalApps = await Application.countDocuments({ user: { $in: sharingAppIds } });
  const totalInterviews = await Interview.countDocuments({ student: { $in: sharingAppIds } });
  
  const context = {
    institution: {
      totalStudents: students.length,
      activeStudentsSharingData: sharingAppIds.length,
      totalApplications: totalApps,
      totalInterviews: totalInterviews
    }
  };

  const prompt = `
    You are the Placement Intelligence Copilot for a university placement officer.
    You must answer the officer's question using ONLY the verified data provided.
    
    Verified Data Context:
    ${JSON.stringify(context, null, 2)}
    
    Officer's Question: "${message}"
    
    RULES:
    1. NEVER invent or hallucinate students, companies, statistics, or names.
    2. If the data is insufficient to answer completely, explicitly state "Not enough verified placement data is available to answer this in detail."
    3. Keep it professional, concise, and focused on placement operations.
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
    if (text.startsWith('```json')) text = text.replace('```json', '');
    if (text.startsWith('```')) text = text.replace('```', '');
    if (text.endsWith('```')) text = text.replace(/```$/, '');
    
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
