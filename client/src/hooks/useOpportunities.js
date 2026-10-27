import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const useOpportunities = (filters = {}) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Construct query string
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.workMode) queryParams.append('workMode', filters.workMode);

      const endpoint = filters.recommended ? `/api/opportunities/recommended` : `/api/opportunities?${queryParams.toString()}`;
      const res = await api.get(endpoint);
      setOpportunities(res.data.data);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError(err.response?.data?.error || 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.workMode]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const trackOpportunity = async (id) => {
    try {
      const res = await api.post(`/api/opportunities/${id}/track`);
      
      // Update local state to mark as tracked
      setOpportunities(prev => 
        prev.map(opp => opp._id === id ? { ...opp, isTracked: true } : opp)
      );
      
      return res.data.data; // The newly created application
    } catch (err) {
      console.error('Error tracking opportunity:', err);
      throw new Error(err.response?.data?.error || 'Failed to track opportunity');
    }
  };

  return { opportunities, loading, error, refetch: fetchOpportunities, trackOpportunity };
};

export default useOpportunities;
