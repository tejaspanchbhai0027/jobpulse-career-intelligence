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
  return client ? { client, modelName: 'gemini-2.5-flash' } : null;
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

  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return JSON.parse(response.text);
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

  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return JSON.parse(response.text);
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

  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return JSON.parse(response.text);
};

/**
 * JobPulse Copilot - Conversational Assistant
 */
const chatCopilot = async (userMessage, contextData) => {
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
    
    Here is the user's live database context (in JSON):
    ${JSON.stringify(contextData, null, 2)}
    
    Instructions:
    - Base your advice ONLY on the provided context. If they ask about applications, look at the JSON.
    - Be concise, direct, and actionable. Do not use filler.
    - Use Markdown for formatting (bolding, bullet points).
    - If the context is empty, tell them they need to track more applications.
  `;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        temperature: 0.3,
      },
    });
    return { reply: response.text };
  } catch (error) {
    console.error('Copilot AI Error:', error);
    throw new Error('Failed to generate Copilot response');
  }
};

module.exports = {
  analyzeJD,
  matchResume,
  summarizeNotes,
  chatCopilot,
};
