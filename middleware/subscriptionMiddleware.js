const checkPlanAccess = (requiredTier = 'pro') => {
    return async (req, res, next) => {
        try {
            if (req.user.subscription.plan === 'pro') {
                return next();
            }

            if (requiredTier === 'pro') {
                return res.status(403).json({ message: "This feature requires a Pro subscription." });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: "Subscription validation failed" });
        }
    }
}

const checkRateLimit = (limit = 3) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const today = new Date().toDateString();
            const resetDate = new Date(user.usage.lastResetDate).toDateString();

            if (today !== resetDate) {
                user.usage.quizzesGeneratedToday = 0;
                user.usage.lastResetDate = new Date();
            }

            if (user.subscription.plan === 'free' && user.usage.quizzesGeneratedToday >= limit) {
                return res.status(429).json({ message: `Daily free limit of ${limit} reached. Upgrade to Pro for unlimited access.` });
            }

            // Let the controller increment this if successful
            next();
        } catch (err) {
            res.status(500).json({ message: "Rate limit validation failed" });
        }
    }
}

const checkInterviewLimit = (dailyQ = 5, weeklyMock = 1) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const today = new Date().toDateString();
            const resetDate = new Date(user.usage.lastResetDate).toDateString();

            // Check daily reset
            if (today !== resetDate) {
                user.usage.interviewQuestionsToday = 0;
            }

            // Check weekly reset (approx 7 days)
            const weekResetDate = new Date(user.usage.lastWeeklyResetDate);
            const now = new Date();
            const diffTime = Math.abs(now - weekResetDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 7) {
                user.usage.mockInterviewsThisWeek = 0;
                user.usage.lastWeeklyResetDate = now;
            }

            if (user.subscription.plan === 'free') {
                if (req.originalUrl.includes('/ask') && user.usage.interviewQuestionsToday >= dailyQ) {
                    return res.status(429).json({ message: `Daily free limit of ${dailyQ} questions reached. Upgrade to Pro.` });
                }

                if (req.originalUrl.includes('/mock') && user.usage.mockInterviewsThisWeek >= weeklyMock) {
                    return res.status(429).json({ message: `Weekly free limit of ${weeklyMock} mock interview reached. Upgrade to Pro.` });
                }
            }

            next();
        } catch (err) {
            res.status(500).json({ message: "Rate limit validation failed" });
        }
    }
}

module.exports = { checkPlanAccess, checkRateLimit, checkInterviewLimit };
