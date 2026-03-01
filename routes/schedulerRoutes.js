const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/schedulerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, schedulerController.addTask);
router.get('/', protect, schedulerController.getTasks);
router.put('/:id', protect, schedulerController.updateTask);
router.delete('/:id', protect, schedulerController.deleteTask);

module.exports = router;
