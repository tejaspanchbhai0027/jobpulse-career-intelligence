const { GoogleGenAI } = require('@google/genai');

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
    console.error('Failed to initialize Google GenAI:', err.message);
    return null;
  }
};

const getModel = () => {
  const client = initializeAI();
  return client ? { client, modelName: 'gemini-3.6-flash' } : null;
};

/**
 * Extracts key information from a Job Description.
 */
const analyzeJD = async (jobDescription) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    // Return mock data for testing if API key is not set
    await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
    return {
      role: "Software Engineer (Mock Data)",
      skills: ["React", "Node.js", "MongoDB", "Mocking API"],
      experience: "2-4 years",
      concerns: ["Salary not mentioned", "Mock data generated because GEMINI_API_KEY is missing"]
    };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert technical recruiter and AI assistant.
    Analyze the following job description and extract key information in JSON format.
    Return ONLY a JSON object with the following schema:
    {
      "role": "String (the exact or inferred job title)",
      "skills": ["String (list of technical or soft skills required)"],
      "experience": "String (required years of experience, e.g., '3-5 years', or 'Entry level')",
      "concerns": ["String (list of potential red flags or missing info like 'Salary not listed', 'Extremely broad requirements')"]
    }
    
    Job Description:
    """
    ${jobDescription}
    """
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (analyzeJD):', error.message);
    throw new Error('AI analysis is currently unavailable. Please try again later.');
  }
};

/**
 * Matches a user's resume against a Job Description.
 */
const matchResume = async (jobDescription, resumeText) => {
  const modelConfig = getModel();

  if (!modelConfig) {
    // Return mock data for testing
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      matchScore: 78,
      strong: ["React", "Node.js", "Problem Solving"],
      missing: ["AWS", "Docker", "GraphQL"],
      suggestedKeywords: ["Cloud Architecture", "CI/CD pipelines"]
    };
  }
  
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error('Please add a detailed resume in Settings before using Resume Match.');
  }


  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert technical recruiter and AI assistant.
    Compare the provided Resume against the Job Description.
    Return ONLY a JSON object with the following schema:
    {
      "matchScore": Number (0 to 100 representing how well the resume fits the job),
      "strong": ["String (list of matching skills/qualifications the candidate possesses)"],
      "missing": ["String (list of important skills/qualifications requested in the JD but missing from the resume)"],
      "suggestedKeywords": ["String (keywords to add to the resume or emphasize in an interview)"]
    }
    
    Job Description:
    """
    ${jobDescription}
    """
    
    Resume:
    """
    ${resumeText}
    """
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (matchResume):', error.message);
    throw new Error('AI resume matching is currently unavailable.');
  }
};

/**
 * Summarizes messy interview/application notes.
 */
const summarizeNotes = async (notes) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    // Return mock data for testing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      summary: "This is a mocked summary of your notes since GEMINI_API_KEY is not configured.",
      nextAction: "Configure your API key in .env for real results.",
      followUpReminder: null
    };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are a highly organized AI assistant.
    The user has provided some raw, possibly messy notes regarding a job application or interview.
    Clean them up and extract a summary and next action.
    Return ONLY a JSON object with the following schema:
    {
      "summary": "String (a clean, well-formatted professional summary of the notes)",
      "nextAction": "String (what the user should do next based on the notes, or 'None')",
      "followUpReminder": "String (if a specific follow-up date is mentioned, format as YYYY-MM-DD, otherwise null)"
    }
    
    Raw Notes:
    """
    ${notes}
    """
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (summarizeNotes):', error.message);
    throw new Error('AI note summarization is currently unavailable.');
  }
};

/**
 * JobPulse Copilot - Conversational Assistant
 */
const chatCopilot = async (userMessage, contextData, history = []) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      reply: "This is a mocked Copilot response. Please add a valid GEMINI_API_KEY in the `.env` file to use the full JobPulse Copilot capabilities."
    };
  }

  const { client, modelName } = modelConfig;
  
  const systemPrompt = `
    You are the "JobPulse Copilot", an elite career coach and AI assistant embedded inside the user's job search dashboard.
    Your goal is to answer the user's question, provide actionable advice, and help them strategize.
    
    Here is the user's live database context (in JSON). Use this to inform your answers, but do not recite raw JSON back to the user:
    ${JSON.stringify(contextData, null, 2)}
    
    Instructions:
    - Base your advice ONLY on the provided context. If they ask about applications, look at the JSON.
    - If the user asks for advice or priorities, present the highest priority recommendations first based on their missing skills or tasks.
    - Be concise, direct, and actionable. Do not use filler.
    - Use Markdown for formatting (bolding, bullet points, headers).
    - If the context is empty or missing data, tell them they need to track more applications or update their profile.
    - NEVER invent student data (e.g., if their score is 70, don't say 90).
    - Do NOT provide sensitive system information.
  `;

  try {
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chatSession = client.chats.create({
      model: modelName,
      history: formattedHistory,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      }
    });

    const response = await chatSession.sendMessage({
      message: userMessage
    });

    return { reply: response.text };
  } catch (error) {
    console.error('Copilot AI Error:', error);
    throw new Error('Failed to generate Copilot response');
  }
};

/**
 * Analyzes an interview transcript and extracts questions.
 */
const analyzeInterviewTranscript = async (transcript) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    // Return mock data for testing if API key is not set
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      questions: [
        {
          question: "Can you describe your experience with React?",
          topic: "Technical",
          difficulty: 3,
          myAnswer: "I have used React for 2 years building SPAs.",
          betterAnswer: "It's good to mention specific projects and state management libraries like Redux or Context API you've used."
        }
      ]
    };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert technical interviewer and career coach.
    Analyze the following interview transcript or notes and extract the questions that were asked.
    For each question, extract the candidate's answer (if available), determine the topic (e.g., Technical, Behavioral, System Design, HR), assign a difficulty score (1-5), and generate a "Better Answer" that would impress a top-tier company.
    
    Return ONLY a JSON object with this EXACT schema:
    {
      "questions": [
        {
          "question": "String (the exact or inferred question asked by the interviewer)",
          "topic": "String (e.g. Technical, Behavioral, General)",
          "difficulty": Number (1 to 5),
          "myAnswer": "String (the candidate's answer based on the notes, or empty string if not provided)",
          "betterAnswer": "String (A comprehensive, optimal answer you generate based on best practices)"
        }
      ]
    }
    
    Notes/Transcript to analyze:
    """
    ${transcript}
    """
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Interview Analysis Error:', error);
    throw new Error('Failed to analyze interview transcript');
  }
};

/**
 * Generates an interview preparation kit (questions, topics, checklist).
 */
const generateInterviewPrep = async (jobDescription, role) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    // Return mock data for testing if API key is not set
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      questions: [
        "Can you describe your experience with modern web frameworks?",
        "How do you handle state management in a large application?",
        "Tell me about a time you optimized a slow-performing query."
      ],
      topics: ["React Ecosystem", "State Management", "Performance Optimization", "System Design Basics"],
      checklist: [
        { text: "Research the company's engineering blog", completed: false },
        { text: "Review common behavioral questions", completed: false },
        { text: "Prepare questions for the interviewer", completed: false }
      ]
    };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert technical interviewer and career coach.
    Based on the following job description and role title, generate an interview preparation kit for the candidate.
    
    Return ONLY a JSON object with this EXACT schema:
    {
      "questions": ["String (list of 3-5 high-probability interview questions)"],
      "topics": ["String (list of 3-5 key topics or skills the candidate should review)"],
      "checklist": [
        {
          "text": "String (a specific preparation action item)",
          "completed": false
        }
      ]
    }
    
    Role: ${role}
    Job Description:
    """
    ${jobDescription}
    """
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (generateInterviewPrep):', error.message);
    throw new Error('AI interview prep generation is currently unavailable.');
  }
};

/**
 * Analyzes a resume for ATS compatibility.
 */
const analyzeResumeATS = async (resumeText, targetRole) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
    return {
      score: 75,
      keywordMatch: 70,
      skillsMatch: 80,
      structureScore: 70,
      relevanceScore: 75,
      completenessScore: 80,
      strengths: ["Clear education section", "Good basic skills"],
      missingKeywords: ["Leadership", "Agile", "Cloud deployment"],
      suggestions: ["Add more measurable achievements", "Include relevant keywords for the target role"]
    };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert ATS (Applicant Tracking System) and technical recruiter.
    Analyze the following resume text for general ATS compatibility and structure, especially targeting the role of "${targetRole || 'General'}".
    Return ONLY a JSON object with the following schema, strictly conforming to JSON format without any markdown wrappers or code blocks:
    {
      "score": Number (0-100 overall estimated ATS compatibility score),
      "keywordMatch": Number (0-100),
      "skillsMatch": Number (0-100),
      "structureScore": Number (0-100),
      "relevanceScore": Number (0-100),
      "completenessScore": Number (0-100),
      "strengths": ["String (list of strengths)"],
      "missingKeywords": ["String (list of generally expected keywords for this role missing from resume)"],
      "suggestions": ["String (list of actionable improvements)"]
    }
    
    Resume Text:
    """
    ${resumeText}
    """
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (analyzeResumeATS):', error.message);
    throw new Error('AI resume analysis is currently unavailable.');
  }
};

const generatePracticeQuestions = async (context, mode, difficulty, count = 5) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    return {
      questions: Array(count).fill(0).map((_, i) => ({
        question: `Mock ${mode} Question ${i + 1}`,
        topic: mode,
        difficulty: difficulty,
        relevance: "Highly relevant based on your resume."
      }))
    };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert technical interviewer and career coach.
    Based on the following context, generate ${count} interview questions for a ${difficulty} difficulty level.
    The focus mode for these questions is: ${mode}.
    
    Context:
    ${JSON.stringify(context, null, 2)}
    
    Return ONLY a JSON object with this EXACT schema:
    {
      "questions": [
        {
          "question": "String (the interview question)",
          "topic": "String (the specific skill/topic it covers)",
          "difficulty": "String (${difficulty})",
          "relevance": "String (why this question is being asked based on their profile or JD)"
        }
      ]
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (generatePracticeQuestions):', error.message);
    throw new Error('AI question generation is currently unavailable.');
  }
};

const evaluateInterviewAnswer = async (questionContext, studentAnswer) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    return {
      score: 75,
      technicalAccuracy: 80,
      completeness: 70,
      clarity: 85,
      relevance: 70,
      strengths: ["Clear communication"],
      improvements: ["Add more technical depth"],
      suggestedAnswer: "A better answer would include more details about the underlying concepts."
    };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert technical interviewer. Evaluate the student's answer to the following interview question.
    
    Question Context:
    ${JSON.stringify(questionContext, null, 2)}
    
    Student's Answer:
    "${studentAnswer}"
    
    Return ONLY a JSON object with this EXACT schema (scores out of 100):
    {
      "score": Number (overall score out of 100),
      "technicalAccuracy": Number,
      "completeness": Number,
      "clarity": Number,
      "relevance": Number,
      "strengths": ["String"],
      "improvements": ["String (actionable feedback)"],
      "suggestedAnswer": "String (an optimal answer to learn from)"
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (evaluateInterviewAnswer):', error.message);
    throw new Error('AI answer evaluation is currently unavailable.');
  }
};

const generateIntroduction = async (context) => {
  const modelConfig = getModel();
  
  if (!modelConfig) {
    return { introduction: "Hi, I am a software engineering student..." };
  }

  const { client, modelName } = modelConfig;
  const prompt = `
    You are an expert career coach helping a student structure their "Tell me about yourself" introduction.
    Based on their context, write a compelling, professional, 4-5 paragraph introduction.
    
    Context:
    ${JSON.stringify(context, null, 2)}
    
    Return ONLY a JSON object with this EXACT schema:
    {
      "introduction": "String (the full formatted introduction)"
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('AI Service Error (generateIntroduction):', error.message);
    throw new Error('AI introduction generation is currently unavailable.');
  }
};

module.exports = {
  analyzeJD,
  matchResume,
  summarizeNotes,
  chatCopilot,
  analyzeInterviewTranscript,
  generateInterviewPrep,
  analyzeResumeATS,
  generatePracticeQuestions,
  evaluateInterviewAnswer,
  generateIntroduction
};
