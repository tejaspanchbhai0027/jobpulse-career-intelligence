import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor (if needed later) ─────────────────────────────────────
// Cookies are automatically sent with `withCredentials: true`

// ── Response interceptor: auto-logout on 401 ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let the AuthContext handle redirect via state.
      // (Optionally emit an event or call logout if needed, but context handles me route failing)
    }
    return Promise.reject(error)
  }
)

export default api
