const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Scheduler = require('../models/Scheduler');

class AnalyticsEngine {

    async generateSummary(userId) {
        const user = await User.findById(userId);
        const quizzes = await Quiz.find({ userId });
        const scheduledTasks = await Scheduler.find({ userId, completed: true });

        // 1. Mastery Score = (Avg Quiz Score * Completion Rate) / 100
        let totalScore = 0;
        let totalQuestions = 0;

        quizzes.forEach(q => {
            totalScore += q.score;
            totalQuestions += q.total;
        });

        const avgQuizScore = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
        const completionRate = user.progressStats.completionRate || 50; // default 50%
        const masteryScore = (avgQuizScore * completionRate) / 100;

        // 2. Consistency Index = (Days Studied / Total Days) * 100
        // Simplified: Look at unique days in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const recentTasks = await Scheduler.find({
            userId,
            date: { $gte: thirtyDaysAgoStr },
            completed: true
        });

        const uniqueDays = new Set(recentTasks.map(p => p.date));
        const consistencyIndex = (uniqueDays.size / 30) * 100;

        // 3. Burnout Risk (If study time drops 40% week-over-week)
        // Simplified logic: Compare last 7 days vs previous 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

        const thisWeek = await Scheduler.find({ userId, date: { $gte: sevenDaysAgoStr }, completed: true });
        const lastWeek = await Scheduler.find({ userId, date: { $gte: fourteenDaysAgoStr, $lt: sevenDaysAgoStr }, completed: true });

        const thisWeekDuration = thisWeek.reduce((acc, p) => acc + p.duration, 0);
        const lastWeekDuration = lastWeek.reduce((acc, p) => acc + p.duration, 0);

        // Improvement calculation
        let improvementRate = 0;
        if (lastWeekDuration > 0) {
            improvementRate = ((thisWeekDuration - lastWeekDuration) / lastWeekDuration) * 100;
        }

        let burnoutRisk = false;
        if (lastWeekDuration > 120 && improvementRate < -40) { // arbitrary threshold 2 hours last week
            burnoutRisk = true;
        }

        return {
            masteryScore: Math.round(masteryScore),
            consistencyIndex: Math.round(consistencyIndex),
            improvementRate: Math.round(improvementRate),
            burnoutRisk,
            avgQuizScore: Math.round(avgQuizScore),
            totalStudyHours: Math.round((thisWeekDuration + lastWeekDuration) / 60)
        };
    }

    async getPrediction(userId) {
        const summary = await this.generateSummary(userId);
        const user = await User.findById(userId);

        let recommendedAction = "Keep up the consistent work!";

        if (summary.burnoutRisk) {
            recommendedAction = "High burnout risk detected. Focus on shorter micro-quizzes or take 48h rest.";
        } else if (summary.consistencyIndex < 30) {
            recommendedAction = "Increase study consistency. Try scheduling 25-minute Pomodoro sessions daily.";
        } else if (summary.masteryScore < 50 && user.progressStats.weakSubjects.length > 0) {
            recommendedAction = `Focus heavily on revising ${user.progressStats.weakSubjects[0]}. Generated a focused quiz today.`;
        }

        return {
            examReadinessScore: Math.min(100, Math.round(summary.masteryScore + (summary.consistencyIndex * 0.2))),
            weakestSubject: user.progressStats.weakSubjects.length > 0 ? user.progressStats.weakSubjects[0] : "None detected",
            burnoutRisk: summary.burnoutRisk,
            recommendedAction
        };
    }
}

module.exports = new AnalyticsEngine();
