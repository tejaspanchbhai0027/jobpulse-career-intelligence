const CopilotConversation = require('../models/CopilotConversation');
const { buildCareerCopilotContext } = require('../services/copilotContextService');
const { chatCopilot } = require('../services/aiService');

const getConversations = async (req, res) => {
  try {
    const conversations = await CopilotConversation.find({
      student: req.user._id,
      institutionId: req.user.institutionId
    })
    .sort('-updatedAt')
    .select('title updatedAt');
    
    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error('Copilot getConversations error:', err);
    res.status(500).json({ success: false, error: 'Server error retrieving conversations' });
  }
};

const getConversationById = async (req, res) => {
  try {
    const conversation = await CopilotConversation.findOne({
      _id: req.params.id,
      student: req.user._id,
      institutionId: req.user.institutionId
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, data: conversation });
  } catch (err) {
    console.error('Copilot getConversationById error:', err);
    res.status(500).json({ success: false, error: 'Server error retrieving conversation' });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const conversation = await CopilotConversation.findOneAndDelete({
      _id: req.params.id,
      student: req.user._id,
      institutionId: req.user.institutionId
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, data: { _id: req.params.id } });
  } catch (err) {
    console.error('Copilot deleteConversation error:', err);
    res.status(500).json({ success: false, error: 'Server error deleting conversation' });
  }
};

const chat = async (req, res) => {
  try {
    const { message, conversationId, contextData: explicitContext } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    let conversation;
    if (conversationId) {
      conversation = await CopilotConversation.findOne({
        _id: conversationId,
        student: req.user._id,
        institutionId: req.user.institutionId
      });
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
    } else {
      conversation = new CopilotConversation({
        student: req.user._id,
        institutionId: req.user.institutionId,
        title: message.substring(0, 40) + (message.length > 40 ? '...' : ''),
        messages: []
      });
    }

    // Build context
    const studentContext = await buildCareerCopilotContext(req.user._id, req.user.institutionId);
    
    // Merge explicit context if coming from a specific page (e.g. Resume Center)
    const combinedContext = {
      ...studentContext,
      ...(explicitContext ? { specificContext: explicitContext } : {})
    };

    // Chat history (limit to last 10 for context window)
    const history = conversation.messages.slice(-10);

    // Get AI Response
    const response = await chatCopilot(message, combinedContext, history);

    // Save to DB
    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'model', content: response.reply });
    
    await conversation.save();

    res.json({ success: true, data: conversation });
  } catch (err) {
    console.error('Copilot chat error:', err);
    res.status(500).json({ success: false, error: 'Failed to process copilot message. Please try again later.' });
  }
};

module.exports = {
  getConversations,
  getConversationById,
  deleteConversation,
  chat
};
