const axios = require('axios');
const promptTemplates = require('./promptTemplates');

class AIEngine {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.model = 'mistralai/mixtral-8x7b-instruct'; // Default capable of JSON
        this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    }

    async generate(promptText, temperature = 0.5, maxRetries = 3, isJson = true, maxTokens = null) {
        let attempts = 0;

        while (attempts < maxRetries) {
            try {
                const payload = {
                    model: this.model,
                    messages: [{ role: 'user', content: promptText }],
                    temperature: temperature
                };
                if (maxTokens) payload.max_tokens = maxTokens;

                const response = await axios.post(
                    this.endpoint,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
                            'X-Title': 'SmartPrep AI',
                        },
                    }
                );

                const rawContent = response.data.choices[0].message.content;
                if (!isJson) {
                    return rawContent;
                }
                return this._sanitizeAndParseJSON(rawContent);

            } catch (error) {
                attempts++;
                console.error(`AI Generation attempt ${attempts} failed:`, error.message);
                if (attempts >= maxRetries) {
                    throw new Error('AI Engine failed to generate valid structured response.');
                }
            }
        }
    }

    _sanitizeAndParseJSON(rawString) {
        let cleanStr = rawString.trim();
        // Sometimes models wrap in markdown despite strict instructions
        if (cleanStr.startsWith('```json')) {
            cleanStr = cleanStr.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanStr.startsWith('```')) {
            cleanStr = cleanStr.replace(/^```/, '').replace(/```$/, '').trim();
        }

        try {
            return JSON.parse(cleanStr);
        } catch (parseError) {
            console.error('Failed to parse AI output as JSON:', cleanStr);
            throw new Error('Invalid JSON format returned from AI');
        }
    }

    // --- Specific Use Cases ---

    async askStudyAssistant(context, query) {
        const prompt = promptTemplates.studyAssistant(context, query);
        return await this.generate(prompt, 0.7);
    }

    async generateQuiz(subject, difficulty) {
        const prompt = promptTemplates.quizGenerator(subject, difficulty);
        return await this.generate(prompt, 0.4);
    }

    async generateWeeklyReport(stats, weakSubjects) {
        const prompt = promptTemplates.weeklyReport(stats, weakSubjects);
        return await this.generate(prompt, 0.5);
    }

    async generateMotivation(context) {
        const prompt = promptTemplates.motivationalCoach(context);
        return await this.generate(prompt, 0.8);
    }

    async generateQnAResponse(category, question) {
        const promptText = `System: You are a senior technical mentor. Answer clearly and professionally.
Rules:
- Use headings
- Use bullet points
- Include code examples when needed
- Keep answer structured
- Avoid unnecessary verbosity
- Keep it interview-focused

Category: ${category}
Question: ${question}`;

        return await this.generate(promptText, 0.7, 3, false);
    }

    async generateRoleBasedQuestion(role, previousQuestions = []) {
        const roleTopics = {
            "Frontend Developer": ["React", "JavaScript", "Performance", "Hooks", "State Management", "APIs"],
            "Backend Developer": ["Node.js", "Databases", "Authentication", "Scaling", "Caching", "REST"],
            "Full Stack Developer": ["Frontend", "Backend", "Database", "Deployment", "Architecture", "Optimization"],
            "UI/UX Designer": ["User Flow", "Wireframing", "Accessibility", "Design Systems", "Figma", "User Psychology"],
            "Product Designer": ["Strategy", "User Research", "Agile", "Metrics", "Management", "Lifecycle"],
            "Data Engineer": ["SQL", "ETL", "Warehousing", "Python", "Big Data", "Modeling"],
            "SDE-I": ["Data Structures", "Algorithms", "OOD", "Networks", "OS", "Clean Code"]
        };
        const topics = roleTopics[role] || ["General Technical", "Problem Solving"];
        const topicIdx = (previousQuestions && Array.isArray(previousQuestions)) ? previousQuestions.length : 0;
        const currentTopic = topics[topicIdx % topics.length];

        let promptText = `You are a strict technical interviewer.

Generate ONE short interview question for the role: ${role}.

Previously asked questions:
${previousQuestions ? previousQuestions.join("\n") : ""}

RULES:
- The new question MUST be about a different topic.
- It MUST NOT be similar.
- It MUST NOT be reworded.
- It MUST be maximum 15 words.
- If similar, generate a completely different concept.

Generate one short interview question about ${currentTopic}`;

        let question = await this.generate(promptText, 0.8, 3, false, 50);

        if (previousQuestions && previousQuestions.includes(question.trim())) {
            let retryPrompt = promptText + "\n\nCRITICAL: DO NOT REPEAT YOURSELF. MAKE IT A TOTALLY DIFFERENT QUESTION.";
            question = await this.generate(retryPrompt, 0.9, 1, false, 50);
        }

        return question ? question.trim().replace(/^"/, '').replace(/"$/, '') : "";
    }
}

module.exports = new AIEngine();
