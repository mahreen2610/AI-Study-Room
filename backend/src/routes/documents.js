const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Guard routes with auth
router.use(authMiddleware);

// Routes
// Note: routes are nested under /rooms/:roomId/documents for cleaner API design
router.post('/rooms/:roomId/documents', upload.single('file'), documentController.uploadDocument);
router.get('/rooms/:roomId/documents', documentController.listDocuments);

module.exports = router;
