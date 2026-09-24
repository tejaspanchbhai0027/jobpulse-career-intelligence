import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const useReadiness = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/readiness');
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load readiness metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  return { data, loading, error, refetch: fetchReadiness };
};

export default useReadiness;
