const express = require('express');
const { getHistory, getHistoryByType } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getHistory);
router.get('/:type', getHistoryByType);

module.exports = router;
