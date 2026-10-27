import { useState, useCallback } from 'react';
import api from '../api/axios';

const useCopilot = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/copilot/conversations');
      setConversations(res.data.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversation = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/student/copilot/conversations/${id}`);
      setCurrentConversation(res.data.data);
      return res.data.data;
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await api.delete(`/student/copilot/conversations/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (currentConversation?._id === id) {
        setCurrentConversation(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  }, [currentConversation]);

  const sendMessage = async (message, contextData = null) => {
    try {
      setLoading(true);
      const res = await api.post('/student/copilot/chat', {
        message,
        conversationId: currentConversation?._id,
        contextData
      });
      setCurrentConversation(res.data.data);
      
      // Update conversations list if it's new
      if (!currentConversation) {
        fetchConversations();
      }
      
      return res.data.data;
    } catch (err) {
      console.error('Error sending message to Copilot:', err);
      setError('Copilot is temporarily unavailable. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setError(null);
  };

  return {
    conversations,
    currentConversation,
    loading,
    error,
    fetchConversations,
    fetchConversation,
    deleteConversation,
    sendMessage,
    startNewConversation
  };
};

export default useCopilot;
