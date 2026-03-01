const Quiz = require('../models/Quiz');
const User = require('../models/User');
const aiEngine = require('../services/aiEngine');
const InterviewHistory = require('../models/InterviewHistory');

const generateQuiz = async (req, res) => {
    const { subject, difficulty } = req.body;

    try {
        const quizData = await aiEngine.generateQuiz(subject, difficulty);

        // Track usage
        const user = await User.findById(req.user._id);
        if (user) {
            user.usage.quizzesGeneratedToday += 1;
            user.usage.aiTokensUsed += 500; // estimated mock token
            await user.save();
        }

        res.json({ subject: quizData.subject, questions: quizData.questions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating quiz from AI' });
    }
};

const submitQuizResults = async (req, res) => {
    const { subject, questions, score, total } = req.body;

    try {
        const quiz = new Quiz({
            userId: req.user._id,
            subject,
            questions,
            score,
            total,
        });
        await quiz.save();

        // Update user stats
        const user = await User.findById(req.user._id);
        if (user) {
            user.progressStats.quizzesCompleted += 1;

            const history = await Quiz.find({ userId: req.user._id });

            let subjectsCache = {};
            history.forEach(q => {
                if (!subjectsCache[q.subject]) subjectsCache[q.subject] = { total: 0, score: 0 };
                subjectsCache[q.subject].total += q.total;
                subjectsCache[q.subject].score += q.score;
            });

            const weakSubjects = Object.keys(subjectsCache).filter(sub => {
                return (subjectsCache[sub].score / subjectsCache[sub].total) < 0.6; // Below 60%
            });

            user.progressStats.weakSubjects = weakSubjects;
            await user.save();
        }

        // Add to global InterviewHistory tracker as 'quiz' type.
        // Convert to a 10 point scale score based on Quiz results
        const normalizedScore = (score / total) * 10;
        await InterviewHistory.create({
            userId: req.user._id,
            type: 'quiz',
            category: subject,
            questions: questions.map(q => q.questionText),
            answers: questions.map(q => q.userAnswer),
            feedback: questions.map(q => `Correct Answer: ${q.correctAnswer}`),
            score: normalizedScore
        });

        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz' });
    }
};

const getQuizHistory = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving quiz history' });
    }
}

module.exports = { generateQuiz, submitQuizResults, getQuizHistory };
