import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ── Domain Types ────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'login'
  | 'registration'
  | 'password_changed'
  | 'profile_updated'
  | 'email_updated'
  | 'course_enrolled'
  | 'course_completed'
  | 'order_placed'
  | 'review_submitted';

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType | string; // allow future types without breaking
  description: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  status: 'active' | 'completed' | 'expired';
  enrolledAt: string;
  expiresAt?: string;
  completedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  content?: string;
  status: 'published' | 'pending' | 'rejected';
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  device: string;
  browser?: string;
  ipAddress?: string;
  location?: string;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ListParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
}

// ── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  },
);

// ── API Client ──────────────────────────────────────────────────────────────

export const apiClient = {
  auth: {
    register: (data: RegisterData) => api.post('/auth/register', data),
    login:    (data: LoginData)    => api.post('/auth/login',    data),
    getProfile:    ()                       => api.get('/auth/profile'),
    updateProfile: (data: UpdateProfileData) => api.put('/auth/profile', data),
  },

  courses: {
    getAll:  (params?: ListParams)                        => api.get('/courses',           { params }),
    getById: (id: string)                                 => api.get(`/courses/${id}`),
    create:  (data: Partial<Course>)                      => api.post('/courses',           data),
    update:  (id: string, data: Partial<Course>)          => api.put(`/courses/${id}`,      data),
    delete:  (id: string)                                 => api.delete(`/courses/${id}`),
    getStats: ()                                          => api.get('/courses/stats'),
  },

  enrollments: {
    getAll:         (params?: ListParams)                           => api.get('/enrollments',            { params }),
    enroll:         (data: { courseId: string; expiresAt?: string }) => api.post('/enrollments',           data),
    updateProgress: (data: { enrollmentId: string; progress: number }) => api.patch('/enrollments/progress', data),
    getProgress:    (enrollmentId: string)                          => api.get(`/enrollments/${enrollmentId}`),
  },

  orders: {
    getAll:  (params?: ListParams) => api.get('/orders',          { params }),
    create:  (data: unknown)       => api.post('/orders',         data),
    getById: (orderId: string)     => api.get(`/orders/${orderId}`),
  },

  reviews: {
    getByCourse: (courseId: string, params?: ListParams) => api.get(`/reviews/course/${courseId}`, { params }),
    getAll:  (params?: ListParams)                       => api.get('/reviews',              { params }),
    create:  (data: Partial<Review>)                     => api.post('/reviews',              data),
    update:  (reviewId: string, data: Partial<Review>)   => api.put(`/reviews/${reviewId}`,   data),
    delete:  (reviewId: string)                          => api.delete(`/reviews/${reviewId}`),
  },

  activities: {
    getAll:       (params?: ListParams) => api.get('/activities',                  { params }),
    getUnreadCount: ()                  => api.get('/activities/unread/count'),
    markAsRead:   (activityId: string)  => api.patch(`/activities/${activityId}/read`),
    markAllAsRead: ()                   => api.patch('/activities/read/all'),
  },

  sessions: {
    getActive:      ()                    => api.get('/sessions'),
    getAll:         (params?: ListParams) => api.get('/sessions/all', { params }),
    endSession:     (sessionId: string)   => api.delete(`/sessions/${sessionId}`),
    endAllSessions: ()                    => api.post('/sessions/logout-all'),
  },
};

export default api;
