const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// Secure all AI routes
router.use(authMiddleware);

// Routes
// Note: nested under /rooms/:roomId/ai for REST consistency
router.post('/rooms/:roomId/ai', aiController.chatWithAI);
router.get('/rooms/:roomId/ai/history', aiController.getAIHistory);

module.exports = router;
