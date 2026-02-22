import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth endpoints
  auth: {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data: any) => api.put('/auth/profile', data),
  },

  // Course endpoints
  courses: {
    getAll: (params?: any) => api.get('/courses', { params }),
    getById: (id: string) => api.get(`/courses/${id}`),
    create: (data: any) => api.post('/courses', data),
    update: (id: string, data: any) => api.put(`/courses/${id}`, data),
    delete: (id: string) => api.delete(`/courses/${id}`),
    getStats: () => api.get('/courses/stats'),
  },

  // Enrollment endpoints
  enrollments: {
    getAll: (params?: any) => api.get('/enrollments', { params }),
    enroll: (data: any) => api.post('/enrollments', data),
    updateProgress: (data: any) => api.patch('/enrollments/progress', data),
    getProgress: (enrollmentId: string) => api.get(`/enrollments/${enrollmentId}`),
  },

  // Order endpoints
  orders: {
    getAll: (params?: any) => api.get('/orders', { params }),
    create: (data: any) => api.post('/orders', data),
    getById: (orderId: string) => api.get(`/orders/${orderId}`),
  },

  // Review endpoints
  reviews: {
    getByCourse: (courseId: string, params?: any) =>
      api.get(`/reviews/course/${courseId}`, { params }),
    getAll: (params?: any) => api.get('/reviews', { params }),
    create: (data: any) => api.post('/reviews', data),
    update: (reviewId: string, data: any) => api.put(`/reviews/${reviewId}`, data),
    delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
  },

  // Activity endpoints
  activities: {
    getAll: (params?: any) => api.get('/activities', { params }),
    getUnreadCount: () => api.get('/activities/unread/count'),
    markAsRead: (activityId: string) => api.patch(`/activities/${activityId}/read`),
    markAllAsRead: () => api.patch('/activities/read/all'),
  },

  // Session endpoints
  sessions: {
    getActive: () => api.get('/sessions'),
    getAll: (params?: any) => api.get('/sessions/all', { params }),
    endSession: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
    endAllSessions: () => api.post('/sessions/logout-all'),
  },
};

export default api;
