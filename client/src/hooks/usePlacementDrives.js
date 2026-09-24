import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const usePlacementDrives = (role = 'STUDENT') => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '/placement-drives';
      if (role === 'STUDENT') {
        endpoint = '/placement-drives/available';
      }

      const res = await api.get(endpoint);
      setDrives(res.data.data);
    } catch (err) {
      console.error('Error fetching placement drives:', err);
      setError(err.response?.data?.message || 'Failed to load placement drives');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const registerForDrive = async (driveId) => {
    try {
      setError(null);
      const res = await api.post(`/placement-drives/${driveId}/register`);
      
      // Update local state to mark as registered
      setDrives(prevDrives => prevDrives.map(drive => {
        if (drive._id === driveId) {
          return { ...drive, isRegistered: true };
        }
        return drive;
      }));
      
      return { success: true, data: res.data.data };
    } catch (err) {
      console.error('Error registering for drive:', err);
      const message = err.response?.data?.message || 'Failed to register';
      setError(message);
      return { success: false, message };
    }
  };

  const createDrive = async (driveData) => {
    try {
      const res = await api.post('/placement-drives', driveData);
      setDrives(prev => [...prev, res.data.data]);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to create drive' };
    }
  };

  const updateDrive = async (driveId, driveData) => {
    try {
      const res = await api.patch(`/placement-drives/${driveId}`, driveData);
      setDrives(prev => prev.map(d => d._id === driveId ? res.data.data : d));
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update drive' };
    }
  };

  const updateDriveStatus = async (driveId, status) => {
    try {
      const res = await api.patch(`/placement-drives/${driveId}/status`, { status });
      setDrives(prev => prev.map(d => d._id === driveId ? { ...d, status: res.data.data.status } : d));
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update status' };
    }
  };

  const deleteDrive = async (driveId) => {
    try {
      const res = await api.delete(`/placement-drives/${driveId}`);
      setDrives(prev => prev.filter(d => d._id !== driveId));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete drive' };
    }
  };

  return {
    drives,
    loading,
    error,
    refetch: fetchDrives,
    registerForDrive,
    createDrive,
    updateDrive,
    updateDriveStatus,
    deleteDrive
  };
};

export default usePlacementDrives;
