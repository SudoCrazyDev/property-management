/**
 * API Client for Laravel Backend
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Create Axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies
})

// Add request interceptor to include auth token and handle FormData
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // If FormData is being sent, remove Content-Type header to let Axios set it automatically
    // with the correct boundary parameter
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data
      const errorMessage = errorData?.message || errorData?.error || `HTTP error! status: ${error.response.status}`
      throw new Error(errorMessage)
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: No response from server')
    } else {
      // Something else happened
      throw new Error(error.message || 'An error occurred')
    }
  }
)

/**
 * Make an API request using Axios
 */
async function apiRequest(endpoint, options = {}) {
  return apiClient.request({
    url: endpoint,
    ...options,
  })
}

/**
 * Create a new inspector form
 */
export async function createInspectorForm(formData) {
  return apiClient.post('/inspector-forms', {
    date: formData.date,
    uploader_id: formData.uploaderId,
    project_address: formData.projectAddress,
    notes: formData.notes || [],
    videos: formData.videos || [],
    images: formData.images || [],
  })
}

/**
 * Get inspector form by ID
 */
export async function getInspectorForm(id) {
  return apiRequest(`/inspector-forms/${id}`)
}

/**
 * Get public inspector form by slug
 */
export async function getPublicInspectorForm(slug) {
  return apiRequest(`/public/inspector-forms/${slug}`)
}

/**
 * Update notes for a public form
 */
export async function updatePublicFormNotes(slug, notes) {
  return apiClient.post(`/public/inspector-forms/${slug}/notes`, { notes })
}

/**
 * Upload videos for a public form
 */
export async function uploadPublicFormVideos(slug, videoFiles) {
  const formData = new FormData()
  videoFiles.forEach((file) => {
    formData.append('videos[]', file)
  })

  // Axios automatically sets Content-Type: multipart/form-data with boundary
  return apiClient.post(`/public/inspector-forms/${slug}/videos`, formData)
}

/**
 * Upload images for a public form
 */
export async function uploadPublicFormImages(slug, imageFiles) {
  const formData = new FormData()
  imageFiles.forEach((file) => {
    formData.append('images[]', file)
  })

  // Axios automatically sets Content-Type: multipart/form-data with boundary
  return apiClient.post(`/public/inspector-forms/${slug}/images`, formData)
}

/**
 * Admin Punchlist API Functions
 */

/**
 * Create a new admin punchlist form
 */
export async function createAdminPunchlist(formData) {
  // Axios automatically sets Content-Type: multipart/form-data with boundary
  // when FormData is passed, so we don't need to set it manually
  return apiClient.post('/admin-punchlists', formData)
}

/**
 * Get public admin punchlist by slug
 */
export async function getPublicAdminPunchlist(slug) {
  return apiRequest(`/public/admin-punchlists/${slug}`)
}

/**
 * Upload proof of completion image for a row
 */
export async function uploadProofOfCompletion(slug, roomId, rowId, imageFile) {
  const formData = new FormData()
  formData.append('image', imageFile)

  // Axios automatically sets Content-Type: multipart/form-data with boundary
  return apiClient.post(
    `/public/admin-punchlists/${slug}/rooms/${roomId}/rows/${rowId}/proof-of-completion`,
    formData
  )
}

