
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { User, Job, Alum, NetworkContact, Pin } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateContent = async (prompt: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
        });
        return response.text || "";
    } catch (error) {
        console.error("Error generating content:", error);
        return "I'm having a bit of trouble connecting right now. Please try again later.";
    }
};

const generateJsonContent = async <T,>(prompt: string, schema: any): Promise<T> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (error) {
        console.error("Error generating JSON content:", error);
        throw new Error("Failed to generate JSON content from Gemini API.");
    }
}

// --- Shared Job Schema for AI generation ---
const jobProperties = {
    title: { type: Type.STRING },
    company: { type: Type.STRING },
    location: { type: Type.STRING },
    description: { type: Type.STRING, description: "A brief 2-3 sentence description of the role." },
    industry: { type: Type.STRING, description: "Primary industry of the company." },
    mode: { type: Type.STRING, description: "Work mode: 'On-site', 'Hybrid', or 'Remote'." },
    visa: { type: Type.STRING, description: "Visa sponsorship status: 'Yes', 'No', or 'Not Specified'." },
    status: { type: Type.STRING, description: "Application status: 'Open' or 'Closed'." },
    url: { type: Type.STRING, description: "The direct URL to the job application page." },
    deadline: { type: Type.STRING, description: "The application deadline in 'YYYY-MM-DD' format. Pick a random date in the next 30 days." },
};

const requiredJobProperties = ["title", "company", "location", "description", "industry", "mode", "visa", "status", "url", "deadline"];

const jobSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: jobProperties,
        required: requiredJobProperties,
    },
};

type GeneratedJob = {
    title: string;
    company: string;
    location: string;
    description: string;
    industry: string;
    mode: 'On-site' | 'Hybrid' | 'Remote';
    visa: 'Yes' | 'No' | 'Not Specified';
    status: 'Open' | 'Closed';
    url: string;
    deadline: string;
};


export const findCuratedJobsWithAI = async (user: User): Promise<Job[]> => {
    const prompt = `
    You are an elite career advisor for London Business School students. 
    
    First, analyze the candidate's CV content to understand their true depth, experience, and seniority level:
    "${user.cv.slice(0, 12000)}" 

    Then, consider their specific profile preferences:
    - Personal Narrative: ${user.personalNarrative}
    - Career Aspirations: ${user.aspirations}
    - Core Competencies: ${user.coreCompetencies.join(', ')}
    - Soft Skills: ${user.softSkills.join(', ')}
    - Work Style Preference: ${user.workStyle}

    Your task is to find 4 job opportunities that are not just a keyword match, but a deep match for their narrative and potential.
    Prioritize roles where their specific Key Achievements (from the CV) would be highly valued.
    For each job, provide all required details including a direct application URL and an application deadline in 'YYYY-MM-DD' format (set it to a random date in the next 30 days).
    `;
    
    const results = await generateJsonContent<GeneratedJob[]>(prompt, jobSchema);
    
    return results.map((job, index) => ({
        id: `c-ai-job-${Date.now()}-${index}`,
        ...job,
        skills: [],
        tenure: "Full-time",
    }));
};

export const findJobsWithAI = async (): Promise<Job[]> => {
    const prompt = `Find 12 recent, diverse job postings suitable for MBA graduates from top companies (e.g., in tech, finance, consulting). For each job, provide all required details, including a direct application URL and an application deadline in 'YYYY-MM-DD' format (set it to a random date in the next 30 days).`;
    
    const results = await generateJsonContent<GeneratedJob[]>(prompt, jobSchema);
    
    return results.map((job, index) => ({
        id: `ai-job-${Date.now()}-${index}`,
        ...job,
        skills: [],
        tenure: "Full-time",
    }));
};

export const enrichJobDetails = async (job: Job): Promise<Partial<Job>> => {
    const companyInfoPrompt = `Provide a concise overview of ${job.company}, including its mission and recent strategic direction.`;
    const companyNewsPrompt = `What are the top 3 most significant news headlines for ${job.company} in the last 6 months? Summarize each briefly.`;
    const industryNewsPrompt = `Summarize the current trends and major news in the ${job.company}'s primary industry.`;
    const recruiterPrompt = `Provide a plausible contact email for the recruitment team or a hiring manager at ${job.company}. If a specific person is not found, provide the general careers email address or the typical email format for ${job.company}. Return ONLY the email address string.`;
    
    const [companyInfo, companyNews, industryNews, recruiterContact] = await Promise.all([
        generateContent(companyInfoPrompt),
        generateContent(companyNewsPrompt),
        generateContent(industryNewsPrompt),
        generateContent(recruiterPrompt)
    ]);
    
    return { companyInfo, companyNews, industryNews, recruiterContact };
};

export const findAlumni = async (job: Job): Promise<Alum[]> => {
    const prompt = `Based on the company "${job.company}", find 2 hypothetical London Business School alumni who could work there in relevant roles (e.g., hiring manager for a ${job.title}, senior team member). For each alum, provide their name and current role.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
            },
            required: ["name", "role"],
        },
    };
    const results = await generateJsonContent<{ name: string; role: string; }[]>(prompt, schema);
    return results.map((alum, index) => ({
        id: `alum-${Date.now()}-${index}`,
        company: job.company,
        ...alum,
    }));
};


export const generateOutreachMessage = async (user: User, alum: Alum): Promise<string> => {
    const prompt = `
    Draft a professional and concise LinkedIn connection request message (under 200 characters) from ${user.name}, 
    a student at London Business School interested in ${user.interests.join(", ")}, 
    to ${alum.name}, a ${alum.role} at ${alum.company}. Mention their shared LBS connection and a genuine interest in their work.
    `;
    return generateContent(prompt);
};

export const tailorCV = async (cv: string, job: Job): Promise<string> => {
    const prompt = `
    Analyze the user's CV against the job description for ${job.title} at ${job.company}.
    
    Identify strictly the **Top 5 High-Impact Changes** required to pass the Applicant Tracking System (ATS) and impress the hiring manager.
    Do NOT provide a general review. Be extremely specific, concise, and actionable.
    
    Format the output as a clean Markdown list. 
    Start each bullet point with a **Bold Action Phrase** (e.g., "**Quantify your Impact**", "**Add Keywords: Python, SQL**").
    
    **Job Description:**
    ${job.description}
    Skills mentioned: ${job.skills.join(', ')}

    **Current CV:**
    ${cv.slice(0, 12000)}
    `;
    return generateContent(prompt);
};

export const tailorCoverLetter = async (coverLetter: string, user: User, job: Job): Promise<string> => {
    const contactsAtCompany = user.networkContacts?.filter(c => c.company.toLowerCase() === job.company.toLowerCase());

    let networkingContext = '';
    if (contactsAtCompany && contactsAtCompany.length > 0) {
        const contactNames = contactsAtCompany.map(c => c.name).join(' or ');
        networkingContext = `The user has networked with people at ${job.company}, including ${contactNames}. Subtly weave this in.`;
    }
    
    const prompt = `
    Rewrite the user's cover letter to be a perfect match for the ${job.title} role at ${job.company}.
    
    Rules:
    1. Keep it under 300 words.
    2. Be highly specific to the company's mission and the role's requirements.
    3. Use **Bold Text** for the company name, specific role, and key achievements to make it skimmable.
    4. ${networkingContext}
    5. Ensure the tone is professional, confident, and authentic to an MBA candidate.

    **User Profile:**
    Name: ${user.name}
    Aspirations: ${user.aspirations}

    **Job Description:**
    ${job.description}

    **Base Cover Letter:**
    ${coverLetter}
    `;
    return generateContent(prompt);
};

export const generateInterviewTips = async (user: User, job: Job): Promise<string> => {
    const prompt = `
    Generate a concise Interview Prep Cheat Sheet for ${job.title} at ${job.company}.
    
    Format as Markdown. Use the following headers (###) and use **bold** for key takeaways within the text. Keep sections brief.
    
    Structure:
    1.  ### The Hook
        *   One sentence on "Why ${job.company}?" linking to their recent news or mission.
    2.  ### Your Story
        *   2 bullet points connecting ${user.name}'s background to this specific role.
    3.  ### STAR Stories to Prep
        *   List 2 specific behavioral questions they will likely ask, and suggest which CV experience to use for each.
    4.  ### Smart Questions
        *   3 high-level strategic questions to ask the interviewer (e.g., about growth, culture, or strategy).
    `;
    return generateContent(prompt);
};

export const generateFollowUpEmail = async (user: User, job: Job): Promise<string> => {
    const prompt = `
    Draft a polite and professional follow-up email from ${user.name} to the hiring team at ${job.company} regarding their application for the ${job.title} position.
    The email should be concise.
    Provide only the body of the email.
    `;
    return generateContent(prompt);
};

export const generateComfortMessage = async (user: User, companyName: string): Promise<string> => {
    const prompt = `
    The user, ${user.name}, was just rejected from a job application at ${companyName}. 
    Please generate a short, empathetic comfort message acknowledging their effort. 
    Then, explicitly include the phrase "Here's a joke to brighten up your day:" followed by a completely random, funny, clean joke to cheer them up. 
    Ensure the joke is different and creative. 
    Format: "Comfort Message \n\n Here's a joke to brighten up your day: \n Joke Content"
    `;
    return generateContent(prompt);
};

export const generateNetworkingTools = async (user: User, contact: NetworkContact): Promise<{ message: string; topics: string[] }> => {
    const prompt = `
    You are assisting ${user.name}, an aspiring professional interested in ${user.interests.join(', ')}, in networking with ${contact.name}, a ${contact.role} at ${contact.company}.
    
    User's Context about Contact: "${contact.notes}"
    User's Aspirations: "${user.aspirations}"

    Task 1: Draft a concise, warm, and personalized connection message (LinkedIn/Email) referencing how they met (if mentioned in context) or their shared background, and why the user wants to connect.
    Task 2: Provide 3 "Quick-fire" coffee chat topics or questions that ${user.name} can ask ${contact.name} that bridge the user's interests with the contact's role.

    Output JSON format:
    {
        "message": "The draft message string...",
        "topics": ["Topic 1...", "Topic 2...", "Topic 3..."]
    }
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            message: { type: Type.STRING },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["message", "topics"]
    };

    return await generateJsonContent<{ message: string; topics: string[] }>(prompt, schema);
};


// --- New Function for Onboarding CV Analysis ---
export const analyzeProfileFromCV = async (cvText: string): Promise<{ name: string; interests: string[]; skills: string[]; workStyle: string; }> => {
    const prompt = `
    Analyze the following CV text and extract the candidate's key profile information.
    
    CV Content:
    "${cvText.slice(0, 15000)}"

    Extract:
    1. Full Name (if available, otherwise return empty string).
    2. Top 5 Professional Interests (industries or roles they seem targeted towards).
    3. Core Skills (Top 5 hard or soft skills mentioned).
    4. Work Style (Infer their likely work style based on adjectives used like 'collaborative', 'leader', 'analytical', 'driven').
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            workStyle: { type: Type.STRING }
        },
        required: ["name", "interests", "skills", "workStyle"]
    };

    try {
        return await generateJsonContent<{ name: string; interests: string[]; skills: string[]; workStyle: string; }>(prompt, schema);
    } catch (e) {
        console.error("Failed to analyze CV", e);
        return { name: "", interests: [], skills: [], workStyle: "" };
    }
};

// --- New Function for Starter Pins ---
export const generateStarterPins = async (user: User): Promise<Pin[]> => {
    const prompt = `
    Based on the user's CV and Aspirations, generate 3 highly effective "STAR Method" (Situation, Task, Action, Result) interview answer snippets.
    These should be based on real experience inferred from their CV or typical scenarios for their aspiration: "${user.aspirations}".
    
    CV Context: "${user.cv.slice(0, 10000)}"

    Return a list of 3 items.
    Format JSON:
    [
      { "title": "Leadership Example", "content": "Situation: ... Task: ... Action: ... Result: ..." },
      ...
    ]
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
            },
            required: ["title", "content"]
        }
    };

    try {
        const pins = await generateJsonContent<{title: string, content: string}[]>(prompt, schema);
        return pins.map((p, i) => ({
            id: `starter-pin-${Date.now()}-${i}`,
            title: p.title,
            content: p.content
        }));
    } catch (e) {
        console.error("Failed to generate starter pins", e);
        return [];
    }
};
