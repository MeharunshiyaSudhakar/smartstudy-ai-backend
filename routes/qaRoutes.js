const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const auth = require('../middleware/authMiddleware');

router.post('/ask', auth, qaController.askQuestion);
router.get('/history', auth, qaController.getHistory);
router.get('/history/:id', auth, qaController.getHistoryById);

module.exports = router;
