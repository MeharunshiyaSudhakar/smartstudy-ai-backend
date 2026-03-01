const aiEngine = require('../services/aiEngine');
const InterviewHistory = require('../models/InterviewHistory');
const User = require('../models/User');

exports.askQuestion = async (req, res) => {
    try {
        const { category, question } = req.body;

        if (!category || !question) {
            return res.status(400).json({ message: 'Category and question are required' });
        }

        const answer = await aiEngine.generateQnAResponse(category, question);

        const historyRecord = await InterviewHistory.create({
            userId: req.user._id,
            type: 'qa',
            category: category,
            conversation: [
                { role: 'user', message: question },
                { role: 'assistant', message: answer }
            ]
        });

        // Track usage (optional based on existing InterviewHistory format, but similar to askInterviewQuestion)
        const user = await User.findById(req.user._id);
        if (user) {
            user.usage.interviewQuestionsToday = (user.usage.interviewQuestionsToday || 0) + 1;
            user.usage.aiTokensUsed = (user.usage.aiTokensUsed || 0) + 200;
            await user.save();
        }

        res.json({ answer, historyId: historyRecord._id, conversation: historyRecord.conversation });

    } catch (error) {
        console.error('QA Ask Error:', error);
        res.status(500).json({ message: 'Error generating response' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await InterviewHistory.find({ userId: req.user._id, type: 'qa' }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        console.error('QA getHistory Error:', error);
        res.status(500).json({ message: 'Error fetching history' });
    }
};

exports.getHistoryById = async (req, res) => {
    try {
        const history = await InterviewHistory.findOne({ _id: req.params.id, userId: req.user._id });
        if (!history) return res.status(404).json({ message: 'History not found' });
        res.json(history);
    } catch (error) {
        console.error('QA getHistoryById Error:', error);
        res.status(500).json({ message: 'Error fetching history' });
    }
};
