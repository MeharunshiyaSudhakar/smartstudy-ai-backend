const InterviewHistory = require('../models/InterviewHistory');

const getHistory = async (req, res) => {
    try {
        const history = await InterviewHistory.find({ userId: req.user._id, type: { $ne: 'mock' } }).sort({ createdAt: -1 });
        res.json({ history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving history' });
    }
};

const getHistoryByType = async (req, res) => {
    try {
        const history = await InterviewHistory.find({
            userId: req.user._id,
            type: req.params.type
        }).sort({ createdAt: -1 });
        res.json({ history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving history type' });
    }
};

module.exports = { getHistory, getHistoryByType };
