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
 * Get current doctor's appointments (from JWT)
 */
export const getMyDoctorAppointments = async () => {
    const response = await api.get('/api/doctors/appointments/me');
    return response.data;
};

/**
 * Get current doctor's patients (from JWT)
 */
export const getMyDoctorPatients = async () => {
    const response = await api.get('/api/doctors/patients/me');
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

/**
 * Get doctor availability
 */
export const getDoctorAvailability = async (doctorId) => {
    const response = await api.get(`/api/doctors/${doctorId}/availability`);
    return response.data;
};

/**
 * Get current doctor's availability (from JWT)
 */
export const getMyDoctorAvailability = async () => {
    const response = await api.get('/api/doctors/availability/me');
    return response.data;
};

/**
 * Set doctor availability (doctor only)
 */
export const setDoctorAvailability = async (slots) => {
    const response = await api.post('/api/doctors/availability', { slots });
    return response.data;
};

/**
 * Get available time slots for a doctor on a specific date
 */
export const getAvailableSlots = async (doctorId, date) => {
    const response = await api.get(`/api/doctors/${doctorId}/available-slots`, {
        params: { date }
    });
    return response.data;
};

/**
 * Create a new goal (doctor only)
 */
export const createGoal = async (goalData) => {
    const response = await api.post('/api/doctors/goals', goalData);
    return response.data;
};

/**
 * Get all goals (doctor only)
 */
export const getAllGoals = async () => {
    const response = await api.get('/api/doctors/goals/all');
    return response.data;
};

/**
 * Get today's goals (doctor only)
 */
export const getTodaysGoals = async () => {
    const response = await api.get('/api/doctors/goals/today');
    return response.data;
};

/**
 * Update a goal (doctor only)
 */
export const updateGoal = async (goalId, goalData) => {
    const response = await api.put(`/api/doctors/goals/${goalId}`, goalData);
    return response.data;
};

/**
 * Mark goal as completed (doctor only)
 */
export const completeGoal = async (goalId) => {
    const response = await api.put(`/api/doctors/goals/${goalId}/complete`);
    return response.data;
};

/**
 * Delete a goal (doctor only)
 */
export const deleteGoal = async (goalId) => {
    const response = await api.delete(`/api/doctors/goals/${goalId}`);
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
 * Get current patient's appointments (from JWT)
 */
export const getMyAppointments = async () => {
    const response = await api.get('/api/patients/appointments/me');
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
// Patient Goals APIs
// ============================================

/**
 * Create a new patient goal
 */
export const createPatientGoal = async (goalData) => {
    const response = await api.post('/api/patients/goals', goalData);
    return response.data;
};

/**
 * Get all patient goals
 */
export const getAllPatientGoals = async () => {
    const response = await api.get('/api/patients/goals/all');
    return response.data;
};

/**
 * Get today's patient goals
 */
export const getTodaysPatientGoals = async () => {
    const response = await api.get('/api/patients/goals/today');
    return response.data;
};

/**
 * Update a patient goal
 */
export const updatePatientGoal = async (goalId, goalData) => {
    const response = await api.put(`/api/patients/goals/${goalId}`, goalData);
    return response.data;
};

/**
 * Mark patient goal as completed
 */
export const completePatientGoal = async (goalId) => {
    const response = await api.put(`/api/patients/goals/${goalId}/complete`);
    return response.data;
};

/**
 * Delete a patient goal
 */
export const deletePatientGoal = async (goalId) => {
    const response = await api.delete(`/api/patients/goals/${goalId}`);
    return response.data;
};

// ============================================
// Export api instance for custom requests
// ============================================
export default api;
