const interviewEngine = require('../services/interviewEngine');
const aiEngine = require('../services/aiEngine');
const InterviewHistory = require('../models/InterviewHistory');
const User = require('../models/User');

const askInterviewQuestion = async (req, res) => {
    const { category, question } = req.body;
    try {
        const answerMarkdown = await interviewEngine.generateInterviewAnswer(question, category);

        // Track usage
        const user = await User.findById(req.user._id);
        if (user) {
            user.usage.interviewQuestionsToday += 1;
            user.usage.aiTokensUsed += 300;
            await user.save();
        }

        // Save history
        await InterviewHistory.create({
            userId: req.user._id,
            type: 'qa',
            category: category,
            questions: [question],
            answers: [], // user didn't answer, AI answered. Wait, AI response goes in feedback
            feedback: [answerMarkdown]
        });

        res.json({ answer: answerMarkdown });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating interview answer' });
    }
};

const evaluateInterview = async (req, res) => {
    const { role, allQuestionsAndAnswers } = req.body;
    try {
        if (!allQuestionsAndAnswers || allQuestionsAndAnswers.length === 0) {
            return res.status(400).json({ message: "No questions to evaluate" });
        }

        let prompt = `You are a strict senior technical interviewer.

You must evaluate each answer objectively.

For EACH question:
- Score the answer from 0 to 10.
- If incorrect → score must be below 5.
- If partially correct → score between 5-7.
- If strong → score 8-10.

Also provide:
- Correct or Ideal Answer (concise)
- Missing points
- Improvement suggestions

Return structured JSON ONLY (no extra text, no markdown blocks):
{
  "totalScore": 0,
  "maxScore": 0,
  "overallPercentage": 0,
  "questionAnalysis": [
    {
      "question": "",
      "userAnswer": "",
      "score": 0,
      "correctness": "Correct",
      "idealAnswer": "",
      "missingPoints": "",
      "improvementTip": ""
    }
  ],
  "strengths": [],
  "weaknesses": [],
  "finalVerdict": ""
}

Rules:
- No extra text outside JSON.
- Do not hallucinate.
- Evaluate strictly.
\n\n`;
        allQuestionsAndAnswers.forEach((qa, i) => {
            prompt += `Q${i + 1}: ${qa.question}\nA: ${qa.answer}\n\n`;
        });

        const evaluationResponse = await aiEngine.generate(prompt, 0.3, 3, true);
        let evaluation;
        try {
            if (typeof evaluationResponse === 'string') {
                evaluation = JSON.parse(evaluationResponse);
            } else {
                evaluation = evaluationResponse;
            }
        } catch (e) {
            try {
                const jsonString = typeof evaluationResponse === 'string' ? evaluationResponse.replace(/```json/g, "").replace(/```/g, "").trim() : JSON.stringify(evaluationResponse);
                evaluation = JSON.parse(jsonString);
            } catch (err) {
                evaluation = {
                    totalScore: 0,
                    maxScore: allQuestionsAndAnswers.length * 10,
                    overallPercentage: 0,
                    questionAnalysis: [],
                    finalVerdict: "Average performance.",
                    strengths: ["Attempted questions"],
                    weaknesses: ["Lack of detail"],
                    summary: "The interview was completed but encountered parsing errors during detailed feedback generation."
                }
            }
        }

        // Validate and Recalculate
        if (evaluation.questionAnalysis && Array.isArray(evaluation.questionAnalysis)) {
            let calTotal = 0;
            evaluation.questionAnalysis.forEach(q => { calTotal += (q.score || 0); });
            evaluation.totalScore = calTotal;
            evaluation.maxScore = allQuestionsAndAnswers.length * 10;
            evaluation.overallPercentage = evaluation.maxScore > 0 ? (calTotal / evaluation.maxScore) * 100 : 0;
        }

        // Increment total mocks
        const user = await User.findById(req.user._id);
        if (user) {
            user.progressStats.totalMocks = (user.progressStats.totalMocks || 0) + 1;
            await user.save();
        }

        res.json({ evaluation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error evaluating mock interview' });
    }
};

const generateQuestion = async (req, res) => {
    const { role, topic } = req.body;
    try {
        const prompt = `Generate one short crisp interview question about ${topic} for ${role}. Maximum 15 words. ONLY the question string, nothing else.`;
        const aiReply = await aiEngine.askStudyAssistant("", prompt);
        res.json({ question: aiReply.reply.replace(/['"]+/g, '') });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating mock question' });
    }
}

module.exports = { askInterviewQuestion, generateQuestion, evaluateInterview };
