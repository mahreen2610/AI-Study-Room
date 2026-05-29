const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Mount me endpoint protected by token check
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
