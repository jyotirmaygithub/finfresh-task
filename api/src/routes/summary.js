const express = require('express');
const { getSummary, getHealthScore } = require('../controllers/summaryController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/health-score', getHealthScore);

module.exports = router;
