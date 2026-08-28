# CampusBridge - Backend REST API Specification & Data Reference

This document provides a comprehensive reference for all **11 backend feature modules** in CampusBridge, detailing endpoint paths, authorization roles, function purposes, sample request payloads, and positive/negative JSON responses.

---

## Base URL & Headers

```
Base URL: http://localhost:5001/api/v1
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Module (`/api/v1/auth`)

### 1.1 Register Student
- **Method & Path**: `POST /auth/register/student`
- **Function**: `AuthService.registerStudent`
- **Auth**: Public
- **Content-Type**: `multipart/form-data` or `application/json`

**Sample Request Payload**:
```json
{
  "name": "Alex Rivera",
  "email": "alex.rivera@student.edu",
  "password": "password123",
  "regNumber": "REG2024-8921",
  "academicYear": "3rd Year",
  "department": "Computer Science & Engineering",
  "careerGoals": "Aspiring Full Stack Engineer aiming for top product tech roles."
}
```

**Positive Response (201 Created)**:
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Student registered successfully. Account pending administrative verification.",
  "data": {
    "user": {
      "id": "u-1722780000000",
      "name": "Alex Rivera",
      "email": "alex.rivera@student.edu",
      "role": "STUDENT",
      "verification_status": "PENDING"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Negative Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "success": false,
  "message": "An account with this email address already exists",
  "errors": []
}
```

---

### 1.2 Register Alumni Mentor
- **Method & Path**: `POST /auth/register/alumni`
- **Function**: `AuthService.registerAlumni`
- **Auth**: Public

**Sample Request Payload**:
```json
{
  "name": "David Vance",
  "email": "david.vance@techcorp.com",
  "password": "password123",
  "company": "Google",
  "designation": "Senior Software Engineer",
  "experienceYears": 7,
  "graduationYear": 2019,
  "linkedinUrl": "https://linkedin.com/in/david-vance",
  "maxCapacity": 5,
  "bio": "Senior Engineer guiding on distributed systems."
}
```

**Positive Response (201 Created)**:
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Alumni registered successfully.",
  "data": {
    "user": {
      "id": "u-1722780000001",
      "name": "David Vance",
      "role": "ALUMNI",
      "verification_status": "PENDING"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Negative Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Missing required validation field: company",
  "errors": []
}
```

---

### 1.3 Account Login
- **Method & Path**: `POST /auth/login`
- **Function**: `AuthService.login`
- **Auth**: Public

**Sample Request Payload**:
```json
{
  "email": "admin@university.edu",
  "password": "password123"
}
```

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "u-admin-1",
      "name": "Dr. Sarah Jenkins",
      "email": "admin@university.edu",
      "role": "ADMIN",
      "verification_status": "VERIFIED"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Negative Response (401 Unauthorized)**:
```json
{
  "statusCode": 401,
  "success": false,
  "message": "Invalid credentials",
  "errors": []
}
```

---

## 2. Verification Module (`/api/v1/verification`)

### 2.1 Get Pending Verifications
- **Method & Path**: `GET /verification/pending`
- **Function**: `VerificationService.getPendingVerifications`
- **Auth**: `ADMIN`

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Pending and rejected user accounts retrieved",
  "data": [
    {
      "id": "u-student-2",
      "name": "Priya Sharma",
      "email": "priya.sharma@student.edu",
      "role": "STUDENT",
      "verification_status": "PENDING",
      "profile": {
        "reg_number": "REG2025-1042",
        "student_id_card_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
      }
    }
  ]
}
```

---

### 2.2 Update Verification Status
- **Method & Path**: `PATCH /verification/users/:userId/status`
- **Function**: `VerificationService.updateVerificationStatus`
- **Auth**: `ADMIN`

**Sample Request Payload**:
```json
{
  "status": "VERIFIED",
  "reason": "Student ID card matched university registrar records"
}
```

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Verification status updated successfully",
  "data": {
    "id": "u-student-2",
    "verification_status": "VERIFIED"
  }
}
```

---

## 3. Users Module (`/api/v1/users`)

### 3.1 Update Student Profile
- **Method & Path**: `PATCH /users/student/profile`
- **Function**: `UsersService.updateStudentProfile`
- **Auth**: `STUDENT`

**Sample Request Payload**:
```json
{
  "careerGoals": "Full Stack & Cloud Architecture focus.",
  "interests": ["d-1", "d-3", "d-5"]
}
```

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Student profile updated successfully",
  "data": {
    "user_id": "u-student-1",
    "interests": ["d-1", "d-3", "d-5"]
  }
}
```

---

### 3.2 Update User by Admin
- **Method & Path**: `PATCH /users/admin/users/:userId`
- **Function**: `UsersService.updateUserByAdmin`
- **Auth**: `ADMIN`

**Sample Request Payload**:
```json
{
  "maxCapacity": 5,
  "verification_status": "VERIFIED"
}
```

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User details updated by administrator successfully",
  "data": {
    "id": "u-alumni-1",
    "verification_status": "VERIFIED",
    "profile": { "max_capacity": 5 }
  }
}
```

---

## 4. Technical Domains Module (`/api/v1/domains`)

### 4.1 Get All Technical Domains
- **Method & Path**: `GET /domains`
- **Function**: `DomainsService.getDomains`
- **Auth**: Public

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Technical career domains retrieved successfully",
  "data": [
    {
      "id": "d-1",
      "name": "Software Engineering & Architecture",
      "category": "Core Engineering",
      "description": "Object Oriented Design, Microservices & Architecture",
      "icon": "Code",
      "is_archived": false,
      "stats": {
        "interested_students": 5,
        "available_mentors": 4,
        "active_mentorships": 2,
        "milestone_completion_rate": 67,
        "growth_trend": "High Demand"
      }
    }
  ]
}
```

---

### 4.2 Create Technical Domain
- **Method & Path**: `POST /domains`
- **Function**: `DomainsService.createDomain`
- **Auth**: `ADMIN`

**Sample Request Payload**:
```json
{
  "name": "Embedded Systems & Edge AI",
  "category": "Core Engineering",
  "description": "Firmware, Microcontrollers, and Edge Intelligence",
  "icon": "Cpu"
}
```

**Positive Response (201 Created)**:
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Domain created successfully",
  "data": {
    "id": "d-1722780005",
    "name": "Embedded Systems & Edge AI",
    "category": "Core Engineering"
  }
}
```

---

## 5. Recommendation Module (`/api/v1/recommendation`)

### 5.1 Get Intelligent Mentor Recommendations
- **Method & Path**: `GET /recommendation`
- **Function**: `RecommendationService.getRecommendedMentors`
- **Auth**: `STUDENT` (Requires `VERIFIED` status)

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Mentor recommendations generated successfully",
  "data": [
    {
      "id": "u-alumni-1",
      "name": "David Vance",
      "email": "david.vance@techcorp.com",
      "profile": {
        "company": "Google / TechCorp",
        "designation": "Senior Software Engineer",
        "available_slots": 4,
        "max_capacity": 5
      },
      "match_score": 88
    }
  ]
}
```

**Negative Response (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Verification Required: Your Student ID is pending administrative review",
  "errors": []
}
```

---

## 6. Mentorship Management Module (`/api/v1/mentorship`)

### 6.1 Submit Mentorship Request
- **Method & Path**: `POST /mentorship/requests`
- **Function**: `MentorshipService.createRequest`
- **Auth**: `STUDENT`

**Sample Request Payload**:
```json
{
  "mentorId": "u-alumni-1",
  "domainId": "d-1",
  "message": "Hi David, I would love your guidance on backend system design."
}
```

**Positive Response (201 Created)**:
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Mentorship request submitted successfully",
  "data": {
    "id": "mr-1722780010",
    "student_id": "u-student-1",
    "mentor_id": "u-alumni-1",
    "status": "PENDING"
  }
}
```

---

### 6.2 Respond to Mentorship Request
- **Method & Path**: `PATCH /mentorship/requests/:requestId/respond`
- **Function**: `MentorshipService.respondToRequest`
- **Auth**: `ALUMNI`

**Sample Request Payload**:
```json
{
  "action": "ACCEPT"
}
```

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Mentorship request accepted and relationship activated",
  "data": {
    "id": "am-1722780015",
    "student_id": "u-student-1",
    "mentor_id": "u-alumni-1",
    "status": "ACTIVE"
  }
}
```

---

### 6.3 Complete Active Mentorship
- **Method & Path**: `PATCH /mentorship/active/:mentorshipId/complete`
- **Function**: `MentorshipService.completeMentorship`
- **Auth**: `ALUMNI` or `ADMIN` or `STUDENT`

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Mentorship marked as COMPLETED successfully",
  "data": {
    "id": "am-1",
    "status": "COMPLETED"
  }
}
```

---

## 7. Sessions & Milestones Module (`/api/v1/sessions`)

### 7.1 Schedule 1-on-1 Session
- **Method & Path**: `POST /sessions`
- **Function**: `SessionsService.createSession`
- **Auth**: Authenticated (`STUDENT` or `ALUMNI`)

**Sample Request Payload**:
```json
{
  "mentorshipId": "am-1",
  "scheduledAt": "2026-08-10T14:00:00Z",
  "durationMins": 45,
  "topic": "System Design Mock Interview & Resume Review",
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

**Positive Response (201 Created)**:
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Session scheduled successfully",
  "data": {
    "id": "s-1722780020",
    "mentorship_id": "am-1",
    "topic": "System Design Mock Interview & Resume Review",
    "status": "SCHEDULED"
  }
}
```

---

## 8. Analytics Overview Module (`/api/v1/analytics`)

### 8.1 Get Operations Center Analytics
- **Method & Path**: `GET /analytics/overview`
- **Function**: `AnalyticsService.getOperationsCenterAnalytics`
- **Auth**: `ADMIN`

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Operations Center analytics retrieved",
  "data": {
    "kpi": {
      "total_students": 12,
      "verified_students": 10,
      "total_alumni": 12,
      "verified_alumni": 12,
      "pending_verifications": 2,
      "active_mentorships": 3,
      "session_completion_rate": 50,
      "milestone_completion_rate": 50
    }
  }
}
```

---

## 9. Security Audit Logs Module (`/api/v1/audit`)

### 9.1 Get Administrative Audit Logs
- **Method & Path**: `GET /audit`
- **Function**: `AuditService.getAuditLogs`
- **Auth**: `ADMIN`

**Positive Response (200 OK)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Audit logs retrieved",
  "data": [
    {
      "id": "al-1",
      "admin_id": "u-admin-1",
      "action": "USER_VERIFICATION_APPROVED",
      "details": "Verified Student ID Card for Alex Rivera",
      "timestamp": "2026-08-04T10:00:00.000Z"
    }
  ]
}
```
