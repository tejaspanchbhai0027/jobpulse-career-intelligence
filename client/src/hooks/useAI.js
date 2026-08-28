import { useState } from 'react';
import axios from 'axios';

const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeJD = async (jobDescription) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/ai/analyze-jd', { jobDescription }, { withCredentials: true });
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze JD. Ensure AI is configured.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const matchResume = async (jobDescription) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/ai/match-resume', { jobDescription }, { withCredentials: true });
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to match resume. Ensure you have saved your resume in Settings.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const summarizeNotes = async (notes) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/ai/summarize-notes', { notes }, { withCredentials: true });
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to summarize notes. Ensure AI is configured.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeJD,
    matchResume,
    summarizeNotes,
    loading,
    error,
  };
};

export default useAI;
