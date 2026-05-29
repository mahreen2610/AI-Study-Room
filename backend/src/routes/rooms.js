const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// All room routes are protected
router.use(authMiddleware);

router.post('/', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.get('/', roomController.listRooms);
router.get('/:roomId', roomController.getRoomDetails);

module.exports = router;
