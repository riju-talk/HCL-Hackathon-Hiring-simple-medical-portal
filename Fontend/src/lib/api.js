import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true, // Important for sending cookies
    headers: {
        'Content-Type': 'application/json',
        'X-Shared-Secret': import.meta.env.VITE_SHARED_SECRET || ''
    }
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Silently handle 401 errors (expected when not logged in)
        // Other errors will be caught by individual API calls
        return Promise.reject(error);
    }
);

// ============================================
// Authentication APIs
// ============================================

/**
 * Register a new user (patient or doctor)
 */
export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

/**
 * Login user
 */
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

/**
 * Logout user
 */
export const logout = async () => {
    const response = await api.post('/auth/logout');
    return response.data;
};

/**
 * Get current user information
 */
export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

// ============================================
// Health Check API
// ============================================

/**
 * Check API health status
 */
export const checkHealth = async () => {
    const response = await api.get('/health');
    return response.data;
};

// ============================================
// Doctor APIs
// ============================================

/**
 * Get all doctors
 */
export const getAllDoctors = async () => {
    const response = await api.get('/api/doctors');
    return response.data;
};

/**
 * Get doctor by ID
 */
export const getDoctorById = async (doctorId) => {
    const response = await api.get(`/api/doctors/${doctorId}`);
    return response.data;
};

/**
 * Get all appointments for a doctor
 */
export const getDoctorAppointments = async (doctorId) => {
    const response = await api.get(`/api/doctors/${doctorId}/appointments`);
    return response.data;
};

/**
 * Get all patients for a doctor
 */
export const getDoctorPatients = async (doctorId) => {
    const response = await api.get(`/api/doctors/${doctorId}/patients`);
    return response.data;
};

/**
 * Update appointment status (doctor only)
 */
export const updateAppointmentStatus = async (appointmentId, data) => {
    const response = await api.put(`/api/doctors/appointments/${appointmentId}`, data);
    return response.data;
};

/**
 * Update doctor profile
 */
export const updateDoctorProfile = async (profileData) => {
    const response = await api.put('/api/doctors/profile', profileData);
    return response.data;
};

// ============================================
// Patient APIs
// ============================================

/**
 * Get all patients (doctor only)
 */
export const getAllPatients = async () => {
    const response = await api.get('/api/patients');
    return response.data;
};

/**
 * Get patient by ID
 */
export const getPatientById = async (patientId) => {
    const response = await api.get(`/api/patients/${patientId}`);
    return response.data;
};

/**
 * Get all appointments for a patient
 */
export const getPatientAppointments = async (patientId) => {
    const response = await api.get(`/api/patients/${patientId}/appointments`);
    return response.data;
};

/**
 * Book a new appointment (patient only)
 */
export const bookAppointment = async (appointmentData) => {
    const response = await api.post('/api/patients/appointments', appointmentData);
    return response.data;
};

/**
 * Update patient profile
 */
export const updatePatientProfile = async (profileData) => {
    const response = await api.put('/api/patients/profile', profileData);
    return response.data;
};

/**
 * Cancel appointment (patient only)
 */
export const cancelAppointment = async (appointmentId) => {
    const response = await api.delete(`/api/patients/appointments/${appointmentId}`);
    return response.data;
};

/**
 * Get patient profile with health information
 */
export const getPatientProfile = async (patientId) => {
    const response = await api.get(`/api/patients/${patientId}`);
    return response.data;
};

// ============================================
// Export api instance for custom requests
// ============================================
export default api;
