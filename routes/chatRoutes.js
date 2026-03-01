const express = require('express');
const { getChatHistory, chatWithAI } = require('../controllers/chatController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getChatHistory)
    .post(protect, chatWithAI);

module.exports = router;
