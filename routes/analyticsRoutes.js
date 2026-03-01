const express = require('express');
const { getSummary, getPrediction } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/summary', getSummary);
router.get('/prediction', getPrediction);

module.exports = router;
