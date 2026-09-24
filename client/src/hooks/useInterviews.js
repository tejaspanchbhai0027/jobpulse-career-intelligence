import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

/**
 * Hook to fetch and manage interviews for a specific application.
 * Pass applicationId to scope to one app, or null/undefined to skip fetching.
 */
const useInterviews = (applicationId) => {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const fetchInterviews = useCallback(async () => {
    if (!applicationId) { setInterviews([]); return }
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/interviews', { params: { applicationId } })
      setInterviews(data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => { fetchInterviews() }, [fetchInterviews])

  const createInterview = useCallback(async (formData) => {
    const { data } = await api.post('/interviews', { ...formData, applicationId })
    setInterviews(prev => [...prev, data.data])
    return data.data
  }, [applicationId])

  const updateInterview = useCallback(async (id, formData) => {
    const { data } = await api.put(`/interviews/${id}`, formData)
    setInterviews(prev => prev.map(i => i._id === id ? data.data : i))
    return data.data
  }, [])

  const deleteInterview = useCallback(async (id) => {
    await api.delete(`/interviews/${id}`)
    setInterviews(prev => prev.filter(i => i._id !== id))
  }, [])

  return { interviews, loading, error, fetchInterviews, createInterview, updateInterview, deleteInterview }
}

/**
 * Hook to fetch upcoming interviews across all applications (for Dashboard).
 */
export const useUpcomingInterviews = () => {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading]       = useState(true)

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/interviews/upcoming')
      setInterviews(data.data)
    } catch {
      // Non-critical — fail silently, dashboard still works
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUpcoming() }, [fetchUpcoming])

  return { interviews, loading, refetch: fetchUpcoming }
}

/**
 * Hook to fetch all interviews across all applications (for Dashboard Command Center).
 */
export const useAllInterviews = () => {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading]       = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/interviews')
      setInterviews(data.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateInterview = useCallback(async (id, formData) => {
    const { data } = await api.put(`/interviews/${id}`, formData)
    setInterviews(prev => prev.map(i => i._id === id ? { ...i, ...data.data } : i))
    return data.data
  }, [])

  const deleteInterview = useCallback(async (id) => {
    await api.delete(`/interviews/${id}`)
    setInterviews(prev => prev.filter(i => i._id !== id))
  }, [])

  return { interviews, loading, refetch: fetchAll, updateInterview, deleteInterview }
}

export default useInterviews
