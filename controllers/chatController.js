const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const aiEngine = require('../services/aiEngine');

const getChatHistory = async (req, res) => {
    try {
        let history = await ChatHistory.findOne({ userId: req.user._id });
        if (!history) {
            history = await ChatHistory.create({ userId: req.user._id, messages: [] });
        }
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve chat history' });
    }
};

const chatWithAI = async (req, res) => {
    const { prompt } = req.body;
    try {
        let history = await ChatHistory.findOne({ userId: req.user._id });
        if (!history) {
            history = new ChatHistory({ userId: req.user._id, messages: [] });
        }

        // Add user message
        history.messages.push({ role: 'user', content: prompt });

        // Try to provide some context by prepending recent messages
        const recentMessages = history.messages.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

        const aiReplyJSON = await aiEngine.askStudyAssistant(recentMessages, prompt);

        // Track usage
        const user = await User.findById(req.user._id);
        if (user) {
            user.usage.aiTokensUsed += 150; // estimated tokens
            await user.save();
        }

        // Add AI message
        history.messages.push({ role: 'ai', content: aiReplyJSON.reply });
        await history.save();

        res.json({ reply: aiReplyJSON.reply, messages: history.messages });
    } catch (error) {
        res.status(500).json({ message: 'Error generating AI response' });
    }
};

module.exports = { getChatHistory, chatWithAI };
