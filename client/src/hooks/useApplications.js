import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const useApplications = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  // ── Fetch all applications ────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/applications')
      setApplications(data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  // ── Create ────────────────────────────────────────────────────────────────
  const createApplication = useCallback(async (formData) => {
    const { data } = await api.post('/applications', formData)
    setApplications(prev => [data.data, ...prev])
    return data.data
  }, [])

  // ── Update (optimistic) ───────────────────────────────────────────────────
  const updateApplication = useCallback(async (id, formData) => {
    // Optimistic: update UI immediately so DnD feels instant
    setApplications(prev =>
      prev.map(app => app._id === id ? { ...app, ...formData } : app)
    )
    try {
      const { data } = await api.put(`/applications/${id}`, formData)
      // Reconcile with server response
      setApplications(prev =>
        prev.map(app => app._id === id ? data.data : app)
      )
      return data.data
    } catch (err) {
      // Revert on error
      fetchApplications()
      throw err
    }
  }, [fetchApplications])

  // ── Delete (optimistic) ───────────────────────────────────────────────────
  const deleteApplication = useCallback(async (id) => {
    setApplications(prev => prev.filter(app => app._id !== id))
    try {
      await api.delete(`/applications/${id}`)
    } catch (err) {
      fetchApplications()
      throw err
    }
  }, [fetchApplications])

  return {
    applications,
    loading,
    error,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
  }
}

export default useApplications
