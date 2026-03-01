const Scheduler = require('../models/Scheduler');

// Get all tasks for user
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Scheduler.find({ userId: req.user._id }).sort({ date: 1, time: 1 });
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching tasks' });
    }
};

// Add new task
exports.addTask = async (req, res) => {
    try {
        const { subject, topic, date, time, duration } = req.body;
        const task = await Scheduler.create({
            userId: req.user._id,
            subject,
            topic,
            date,
            time,
            duration
        });
        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error adding task' });
    }
};

// Update task (Edit / Mark Completed)
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const task = await Scheduler.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            updates,
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error updating task' });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Scheduler.findOneAndDelete({ _id: id, userId: req.user._id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error deleting task' });
    }
};
