const analyticsEngine = require('../services/analyticsEngine');

exports.getSummary = async (req, res) => {
    try {
        const summary = await analyticsEngine.generateSummary(req.user._id);
        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
};

exports.getPrediction = async (req, res) => {
    try {
        const prediction = await analyticsEngine.getPrediction(req.user._id);
        res.json(prediction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch prediction' });
    }
};
