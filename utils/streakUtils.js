const calculateStreak = (currentStreak, lastDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastDate) {
        return { newStreak: 1, newDate: today };
    }

    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return { newStreak: currentStreak, newDate: lastDate };
    } else if (diffDays === 1) {
        return { newStreak: currentStreak + 1, newDate: today };
    } else {
        return { newStreak: 1, newDate: today };
    }
};

module.exports = { calculateStreak };
