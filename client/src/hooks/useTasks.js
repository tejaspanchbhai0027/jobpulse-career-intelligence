import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData) => {
    try {
      const res = await api.post('/tasks', taskData);
      setTasks((prev) => [res.data.data, ...prev]);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create task' };
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const res = await api.patch(`/tasks/${id}`, taskData);
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update task' };
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete task' };
    }
  };

  return { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask };
};

export default useTasks;
