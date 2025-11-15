# Medical Portal API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All authenticated endpoints require an HTTP-only cookie token obtained through login/register.

---

## Health & Status Endpoints

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "message": "Medical Portal API is running",
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

---

## Authentication Endpoints

### Register
```http
POST /auth/register
```
**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient"  // or "doctor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Login
```http
POST /auth/login
```
**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Logout
```http
POST /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Current User
```http
GET /auth/me
```
**Headers:** Requires authentication cookie

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

---

## Doctor Endpoints

### Get All Doctors
```http
GET /api/doctors
```
**Public endpoint - no authentication required**

**Response:**
```json
{
  "success": true,
  "count": 5,
  "doctors": [
    {
      "id": "doctor_id",
      "fullName": "Dr. Smith",
      "email": "smith@example.com",
      "role": "doctor",
      "createdAt": "2025-11-15T10:30:00.000Z"
    }
  ]
}
```

### Get Doctor by ID
```http
GET /api/doctors/:id
```

**Response:**
```json
{
  "success": true,
  "doctor": {
    "id": "doctor_id",
    "fullName": "Dr. Smith",
    "email": "smith@example.com",
    "role": "doctor"
  }
}
```

### Get Doctor's Appointments
```http
GET /api/doctors/:id/appointments
```
**Requires:** Doctor authentication

**Response:**
```json
{
  "success": true,
  "count": 3,
  "appointments": [
    {
      "id": "appointment_id",
      "patientId": "patient_id",
      "patientName": "John Doe",
      "doctorName": "Dr. Smith",
      "appointmentDate": "2025-11-20",
      "appointmentTime": "10:00 AM",
      "reason": "Annual checkup",
      "status": "confirmed",
      "notes": ""
    }
  ]
}
```

### Get Doctor's Patients
```http
GET /api/doctors/:id/patients
```
**Requires:** Doctor authentication

**Response:**
```json
{
  "success": true,
  "count": 10,
  "patients": [
    {
      "id": "patient_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-15T10:30:00.000Z"
    }
  ]
}
```

### Update Appointment Status
```http
PUT /api/doctors/appointments/:appointmentId
```
**Requires:** Doctor authentication

**Body:**
```json
{
  "status": "confirmed",  // pending, confirmed, completed, cancelled
  "notes": "Patient confirmed attendance"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "appointment": { /* updated appointment */ }
}
```

### Update Doctor Profile
```http
PUT /api/doctors/profile
```
**Requires:** Doctor authentication

**Body:**
```json
{
  "fullName": "Dr. John Smith",
  "email": "newmail@example.com"
}
```

---

## Patient Endpoints

### Get All Patients
```http
GET /api/patients
```
**Requires:** Doctor authentication

**Response:**
```json
{
  "success": true,
  "count": 15,
  "patients": [
    {
      "id": "patient_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "patient",
      "createdAt": "2025-11-15T10:30:00.000Z"
    }
  ]
}
```

### Get Patient by ID
```http
GET /api/patients/:id
```
**Requires:** Authentication (Doctor or own patient)

**Response:**
```json
{
  "success": true,
  "patient": {
    "id": "patient_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Get Patient's Appointments
```http
GET /api/patients/:id/appointments
```
**Requires:** Authentication (Doctor or own patient)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "appointments": [
    {
      "id": "appointment_id",
      "doctorId": "doctor_id",
      "patientName": "John Doe",
      "doctorName": "Dr. Smith",
      "appointmentDate": "2025-11-20",
      "appointmentTime": "10:00 AM",
      "reason": "Annual checkup",
      "status": "pending"
    }
  ]
}
```

### Book Appointment
```http
POST /api/patients/appointments
```
**Requires:** Patient authentication

**Body:**
```json
{
  "doctorId": "doctor_id",
  "appointmentDate": "2025-11-20",
  "appointmentTime": "10:00 AM",
  "reason": "Annual checkup",
  "notes": "First visit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointment": { /* new appointment */ }
}
```

### Update Patient Profile
```http
PUT /api/patients/profile
```
**Requires:** Patient authentication

**Body:**
```json
{
  "fullName": "John Smith",
  "email": "newmail@example.com"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required role: doctor"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Testing with cURL

### Register a Patient
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "patient"
  }' \
  -c cookies.txt
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

### Get Current User (with auth)
```bash
curl -X GET http://localhost:3000/auth/me \
  -b cookies.txt
```

### Get All Doctors
```bash
curl -X GET http://localhost:3000/api/doctors
```

### Book Appointment (with patient auth)
```bash
curl -X POST http://localhost:3000/api/patients/appointments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "doctorId": "doctor_id_here",
    "appointmentDate": "2025-11-20",
    "appointmentTime": "10:00 AM",
    "reason": "Annual checkup"
  }'
```
