const User = require('../models/User');
const Scheduler = require('../models/Scheduler');
const { generateAIResponse } = require('../utils/openrouter');
const aiEngine = require('../services/aiEngine');

const getDashboardData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        const todayDate = new Date().toISOString().split('T')[0];
        const todaysSchedules = await Scheduler.find({
            userId: req.user._id,
            date: todayDate,
        });

        const recentSchedules = await Scheduler.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(10);

        // AI Zero-Prompt System
        // Generate suggestions based on user stats and recent schedules
        let promptContext = `User ${user.name} has completed ${user.progressStats.studyHours} study hours and ${user.progressStats.quizzesCompleted} quizzes. 
    Their weak subjects are: ${(user.progressStats.weakSubjects || []).join(', ') || 'None yet'}. `;

        if (recentSchedules.length > 0) {
            promptContext += `Recently they studied ${recentSchedules.map(s => s.subject).join(', ')}. `;
        }

        const aiPrompt = `Based on the following user data: ${promptContext}. 
    Please generate 3 very short, actionable study suggestions (like 'Revise your weakest subject, Data Structures, today'). 
    Respond strictly with a JSON object containing a property 'suggestions' which is an array of strings.`;

        let aiSuggestions = [];
        try {
            const aiResponseJSON = await aiEngine.generate(aiPrompt, 0.4);
            aiSuggestions = aiResponseJSON.suggestions || [];
        } catch (err) {
            aiSuggestions = [
                "Take a quick 5-question quiz to test your knowledge.",
                "Take a 10 minute break to consolidate your learning.",
                "Add a new study session for your hardest subject."
            ];
        }

        const totalSchedules = await Scheduler.countDocuments({ userId: req.user._id });

        res.json({
            user,
            todaysSchedules,
            aiSuggestions,
            totalQuizzes: user.progressStats.quizzesCompleted || 0,
            readiness: user.progressStats.interviewReadiness || 0,
            totalMocks: user.progressStats.totalMocks || 0,
            totalSchedules
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving dashboard data' });
    }
};

module.exports = { getDashboardData };
