import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://smart-attendance-voj2.onrender.com/api'
).replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token rotation
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.accessToken;
          localStorage.setItem('token', newAccessToken);
          if (res.data.refreshToken) {
            localStorage.setItem('refreshToken', res.data.refreshToken);
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Service Endpoints
export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  refreshToken: (data) => apiClient.post('/auth/refresh', data),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me')
};

export const dashboardApi = {
  getAdminStats: () => apiClient.get('/dashboard/admin'),
  getTeacherStats: () => apiClient.get('/dashboard/teacher'),
  getStudentStats: () => apiClient.get('/dashboard/student')
};

export const studentApi = {
  getAll: () => apiClient.get('/students'),
  getById: (id) => apiClient.get(`/students/${id}`),
  getActivity: (id) => apiClient.get(`/students/${id}/activity`),
  getClasses: (id) => apiClient.get(`/students/${id}/classes`),
  getCapacity: () => apiClient.get('/students/capacity'),
  create: (data) => apiClient.post('/students', data),
  update: (id, data) => apiClient.put(`/students/${id}`, data),
  delete: (id) => apiClient.delete(`/students/${id}`),
  enrollFace: (id, data) => apiClient.post(`/students/${id}/enroll-face`, data),
  submitRegisterRequest: (data) => apiClient.post('/students/register-request', data),
  getPending: () => apiClient.get('/students/pending'),
  approvePending: (id) => apiClient.post(`/students/pending/${id}/approve`),
  rejectPending: (id) => apiClient.post(`/students/pending/${id}/reject`)
};

export const teacherApi = {
  getAll: () => apiClient.get('/teachers'),
  getById: (id) => apiClient.get(`/teachers/${id}`),
  getClasses: (id) => apiClient.get(`/teachers/${id}/classes`),
  create: (data) => apiClient.post('/teachers', data),
  update: (id, data) => apiClient.put(`/teachers/${id}`, data),
  delete: (id) => apiClient.delete(`/teachers/${id}`)
};

export const courseApi = {
  getAll: () => apiClient.get('/courses'),
  getById: (id) => apiClient.get(`/courses/${id}`),
  create: (data) => apiClient.post('/courses', data),
  update: (id, data) => apiClient.put(`/courses/${id}`, data),
  delete: (id) => apiClient.delete(`/courses/${id}`)
};

export const classApi = {
  getAll: () => apiClient.get('/classes'),
  getById: (id) => apiClient.get(`/classes/${id}`),
  create: (data) => apiClient.post('/classes', data),
  update: (id, data) => apiClient.put(`/classes/${id}`, data),
  delete: (id) => apiClient.delete(`/classes/${id}`),
  getEnrolledStudents: (id) => apiClient.get(`/classes/${id}/students`),
  enrollStudent: (classId, studentId) => apiClient.post(`/classes/${classId}/enroll`, { studentId, classId }),
  unenrollStudent: (classId, studentId) => apiClient.delete(`/classes/${classId}/students/${studentId}`)
};

export const sessionApi = {
  getAll: () => apiClient.get('/attendance/sessions'),
  getActive: () => apiClient.get('/attendance/sessions/active'),
  getById: (id) => apiClient.get(`/attendance/sessions/${id}`),
  getRecipients: (id) => apiClient.get(`/attendance/sessions/${id}/recipients`),
  create: (data) => apiClient.post('/attendance/sessions', data),
  start: (id) => apiClient.put(`/attendance/sessions/${id}/start`),
  stop: (id) => apiClient.put(`/attendance/sessions/${id}/stop`),
  updateLocation: (id, data) => apiClient.put(`/attendance/sessions/${id}/location`, data),
  sendEmails: (id) => apiClient.post(`/attendance/sessions/${id}/send-emails`),
  downloadExcel: (id) => apiClient.get(`/attendance/sessions/${id}/export-excel`, { responseType: 'blob' })
};

export const timetableApi = {
  getWeekly: () => apiClient.get('/timetable/weekly'),
  getToday: () => apiClient.get('/timetable/today'),
  createClass: (data) => apiClient.post('/timetable/classes', data),
  updateClass: (id, data) => apiClient.put(`/timetable/classes/${id}`, data),
  deleteClass: (id) => apiClient.delete(`/timetable/classes/${id}`)
};

export const attendanceApi = {
  mark: (data) => apiClient.post('/attendance/mark', data),
  verifyToken: (token) => apiClient.get(`/attendance/token/${token}`),
  verifyLocation: (data) => apiClient.post('/attendance/location-verify', data),
  verifyFace: (data) => apiClient.post('/attendance/face-verify', data),
  getStudentToday: () => apiClient.get('/attendance/student/today'),
  downloadTodayExcel: () => apiClient.get('/attendance/student/today/export-excel', { responseType: 'blob' }),
  getByStudent: (studentId) => apiClient.get(`/attendance/student/${studentId}`),
  getByClass: (classId) => apiClient.get(`/attendance/class/${classId}`),
  getBySession: (sessionId) => apiClient.get(`/attendance/session/${sessionId}`),
  update: (id, data) => apiClient.put(`/attendance/${id}`, data),
  delete: (id) => apiClient.delete(`/attendance/${id}`),
  enrollFace: (data) => apiClient.post('/attendance/enroll-face', data),
  verify: (id, verificationStatus) => apiClient.put(`/attendance/${id}/verify`, { verificationStatus })
};

export const reportApi = {
  getReport: (params) => apiClient.get('/reports/attendance', { params }),
  exportReport: (params) => apiClient.get('/reports/attendance/export', {
    params,
    responseType: 'blob'
  }),
  getStudentReport: (studentId) => apiClient.get(`/reports/attendance/student/${studentId}`),
  getClassReport: (classId) => apiClient.get(`/reports/attendance/class/${classId}`)
};

export const locationApi = {
  getAll: () => apiClient.get('/locations'),
  getById: (id) => apiClient.get(`/locations/${id}`),
  create: (data) => apiClient.post('/locations', data),
  update: (id, data) => apiClient.put(`/locations/${id}`, data),
  delete: (id) => apiClient.delete(`/locations/${id}`)
};

export const emailApi = {
  getStatus: () => apiClient.get('/email/status')
};

export default apiClient;

