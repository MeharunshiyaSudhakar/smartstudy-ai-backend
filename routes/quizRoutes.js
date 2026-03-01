const express = require('express');
const { generateQuiz, submitQuizResults, getQuizHistory } = require('../controllers/quizController');
const protect = require('../middleware/authMiddleware');
const { checkRateLimit } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.post('/generate', protect, checkRateLimit(3), generateQuiz);
router.route('/')
    .post(protect, submitQuizResults)
    .get(protect, getQuizHistory);

module.exports = router;
