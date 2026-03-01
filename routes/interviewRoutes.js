const express = require('express');
const multer = require('multer');
const {
    askInterviewQuestion,
    generateQuestion,
    evaluateInterview
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const { checkInterviewLimit } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.use(protect);

router.post('/ask', checkInterviewLimit(5, 1), askInterviewQuestion);
router.post('/generate', checkInterviewLimit(5, 1), generateQuestion);
router.post('/evaluate', evaluateInterview);

module.exports = router;
