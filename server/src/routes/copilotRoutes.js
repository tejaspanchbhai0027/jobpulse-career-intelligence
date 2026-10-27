const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const copilotController = require('../controllers/copilotController');

// All Copilot routes are for Students only
router.use(protect);
router.use(requireRole('STUDENT'));

router.route('/conversations')
  .get(copilotController.getConversations);

router.route('/conversations/:id')
  .get(copilotController.getConversationById)
  .delete(copilotController.deleteConversation);

router.route('/chat')
  .post(copilotController.chat);

module.exports = router;
