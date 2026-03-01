const aiEngine = require('./aiEngine');

class InterviewEngine {
    constructor() {
        this.systemPrompt = `You are SmartPrep AI, an expert technical interviewer and career mentor for engineering students.
Rules:
- Provide structured answers
- Use headings
- Use bullet points
- Provide code examples when needed
- Keep explanations clear and professional
- Avoid unnecessary fluff
- Be concise but complete
- If coding question: include optimized solution + explanation + time complexity`;
    }

    async generateInterviewAnswer(question, category) {
        const prompt = `${this.systemPrompt}
        
Category: ${category}
User Question: ${question}

Provide a clean, section-based, and highly professional markdown response. Ensure code blocks are perfectly formatted using markdown. Do not output JSON, output pure markdown.`;

        return await aiEngine.generate(prompt, 0.4, 3, false);
    }

    async evaluateFullInterview(role, interviewSession) {
        let prompt = `You are a senior technical interviewer.

Evaluate the full interview session below.

Role: ${role}

Interview Transcript:`;
        interviewSession.forEach((qa, idx) => {
            prompt += `\nQ${idx + 1}: ${qa.question}\nA${idx + 1}: ${qa.answer}\n`;
        });

        prompt += `
For each question:
- Check if answer is correct
- Identify gaps
- Provide improvements

Return VALID JSON matching exactly this structure:
{
  "overallScore": Number (0-100),
  "questionAnalysis": [
     {
       "question": "string",
       "correctness": "Correct | Partially Correct | Incorrect",
       "feedback": "string",
       "idealAnswer": "string"
     }
  ],
  "strongAreas": ["string"],
  "weakAreas": ["string"],
  "improvementSuggestions": "string",
  "finalVerdict": "Ready | Needs Practice | Not Ready"
}`;

        return await aiEngine.generate(prompt, 0.4, 3, true);
    }
}

module.exports = new InterviewEngine();
