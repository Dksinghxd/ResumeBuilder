# Resume Builder Backend - API Documentation

Base URL: `http://localhost:5000/api/v1`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <accessToken>
```

---

## 1. Authentication Endpoints (`/auth`)

### 1.1 Register User
**POST** `/auth/register`

Request:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

Response (201):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "user": { ...user data... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

---

### 1.2 Login User
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ...user data... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### 1.3 Logout
**POST** `/auth/logout`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logout successful"
}
```

---

### 1.4 Verify Token
**GET** `/auth/verify`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token verified",
  "data": { ...user data... }
}
```

---

### 1.5 Get Profile
**GET** `/auth/profile`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "bio": "Software Engineer",
      "profileImage": "...",
      "role": "user",
      "status": "active"
    }
  }
}
```

---

### 1.6 Update Profile
**PUT** `/auth/profile`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Senior Software Engineer",
  "profileImage": "https://..."
}
```

Response (200): Updated user object

---

### 1.7 Change Password
**POST** `/auth/change-password`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully"
}
```

---

## 2. Resume Endpoints (`/resumes`)

### 2.1 Create Resume
**POST** `/resumes`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "title": "My Resume",
  "templateId": "modern",
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "New York, USA",
    "summary": "Software Engineer with 5 years experience"
  },
  "experience": [
    {
      "jobTitle": "Senior Developer",
      "company": "Tech Corp",
      "startDate": "2020-01-15",
      "endDate": "2023-12-31",
      "currentlyWorking": false,
      "description": "Led development of...",
      "location": "New York"
    }
  ],
  "education": [
    {
      "schoolName": "MIT",
      "degree": "Bachelor",
      "fieldOfStudy": "Computer Science",
      "startDate": "2015-09-01",
      "endDate": "2019-05-31",
      "currentlyStudying": false
    }
  ],
  "skills": [
    {
      "name": "JavaScript",
      "proficiency": "expert",
      "endorsements": 5
    }
  ]
}
```

Response (201):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Resume created successfully",
  "data": {
    "resume": { ...resume data... }
  }
}
```

---

### 2.2 Get All User Resumes
**GET** `/resumes?page=1&limit=20`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resumes retrieved",
  "data": {
    "data": [ ...resume objects... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 2.3 Get Single Resume
**GET** `/resumes/:id`

Headers: `Authorization: Bearer <token>` (optional for public resumes)

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resume retrieved",
  "data": { ...resume data... }
}
```

---

### 2.4 Update Resume
**PUT** `/resumes/:id`

Headers: `Authorization: Bearer <token>`

Request: Partial resume data (all fields optional)
```json
{
  "title": "Updated Resume Title",
  "status": "published"
}
```

Response (200): Updated resume object

---

### 2.5 Delete Resume
**DELETE** `/resumes/:id`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resume deleted successfully"
}
```

---

### 2.6 Score Resume
**POST** `/resumes/:id/score`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resume scored",
  "data": {
    "score": 75
  }
}
```

**Scoring Logic:**
- Summary: +10 points
- Experience: +25 points
- Education: +20 points
- Skills: +20 points
- Certifications: +10 points
- Projects: +10 points
- Social Links: +5 points
- **Max Score: 100**

---

### 2.7 Generate PDF
**POST** `/resumes/:id/pdf`

Headers: `Authorization: Bearer <token>`

Response: PDF file (application/pdf)

---

## 3. Share Links Endpoints (`/share`)

### 3.1 Create Share Link
**POST** `/share/resumes/:resumeId/share`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "expiresIn": "30days",
  "allowDownload": true,
  "allowComments": false
}
```

`expiresIn` options:
- `never` - Never expires
- `7days` - Expires in 7 days
- `30days` - Expires in 30 days
- `60days` - Expires in 60 days
- `90days` - Expires in 90 days

Response (201):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Share link created",
  "data": {
    "shareLink": {
      "token": "a1b2c3d4e5f6...",
      "resumeId": "...",
      "expiresAt": "2024-02-15T10:30:00Z",
      "allowDownload": true,
      "viewCount": 0
    }
  }
}
```

---

### 3.2 Get Shared Resume (Public)
**GET** `/share/share/:token`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resume retrieved",
  "data": {
    "resume": { ...resume data... },
    "shareLink": { ...shareLink data... }
  }
}
```

---

### 3.3 Disable Share Link
**DELETE** `/share/share/:token`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Share link disabled",
  "data": { ...shareLink data... }
}
```

---

## 4. Analytics Endpoints (`/analytics`)

### 4.1 Get Dashboard Analytics
**GET** `/analytics/dashboard`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard analytics retrieved",
  "data": {
    "analytics": [
      {
        "_id": "resume_viewed",
        "count": 45
      },
      {
        "_id": "resume_created",
        "count": 5
      }
    ]
  }
}
```

---

### 4.2 Get Resume Analytics
**GET** `/analytics/resumes/:resumeId`

Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resume analytics retrieved",
  "data": {
    "analytics": [
      {
        "_id": "share_link_accessed",
        "count": 12
      }
    ]
  }
}
```

---

### 4.3 Track Event
**POST** `/analytics/track`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "userId": "...",
  "action": "pdf_generated",
  "metadata": {
    "resumeId": "..."
  }
}
```

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event tracked"
}
```

**Trackable Events:**
- resume_viewed
- resume_created
- resume_updated
- resume_deleted
- pdf_generated
- share_link_created
- share_link_accessed
- resume_downloaded
- ai_suggestion_used
- login
- logout

---

## 5. AI Endpoints (`/ai`)

### 5.1 Get Resume Suggestions
**POST** `/ai/suggestions/resume`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "resumeContent": "..."
}
```

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Suggestions generated",
  "data": {
    "suggestions": {
      "improvements": [
        {
          "type": "keyword",
          "suggestion": "Add more industry-specific keywords",
          "impact": "high"
        }
      ]
    }
  }
}
```

---

### 5.2 Score Resume (AI)
**POST** `/ai/score`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "resumeContent": "..."
}
```

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resume scored",
  "data": {
    "score": 82
  }
}
```

---

### 5.3 Generate Content
**POST** `/ai/generate`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "prompt": "Write a professional summary for a software engineer",
  "context": {...}
}
```

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Content generated",
  "data": {
    "content": "Generated professional summary..."
  }
}
```

---

## 6. Admin Endpoints (`/admin`)

Requires `Authorization: Bearer <adminToken>`

### 6.1 Get All Users
**GET** `/admin/users?page=1&limit=20`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved",
  "data": {
    "data": [ ...user objects... ],
    "pagination": { ...pagination... }
  }
}
```

---

### 6.2 Get System Analytics
**GET** `/admin/analytics?days=30`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "System analytics retrieved",
  "data": {
    "analytics": [ ...analytics data... ]
  }
}
```

---

### 6.3 Update User
**PUT** `/admin/users/:userId`

Request:
```json
{
  "role": "premium_user",
  "status": "active"
}
```

Response (200): Updated user object

---

### 6.4 Delete User
**DELETE** `/admin/users/:userId`

Response (200):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": {
    "fieldName": ["Error details"]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Auth Endpoints**: 5 requests per 15 minutes
- **PDF Generation**: 10 requests per hour
- **AI Endpoints**: 20 requests per hour

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@test.com","password":"Test123!@","confirmPassword":"Test123!@"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Test123!@"}'

# Create Resume (use token from login response)
curl -X POST http://localhost:5000/api/v1/resumes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Resume","templateId":"modern","personalInfo":{"firstName":"John","lastName":"Doe","email":"john@test.com"}}'
```

---

## Useful Postman Variables

```
{{baseUrl}} = http://localhost:5000/api/v1
{{token}} = <accessToken from login>
{{resumeId}} = <resumeId from create resume>
```

---

## Webhook Events (Future)

Coming soon: Resume view notifications, share link expiration alerts, etc.

---

For more information, visit the [Architecture Guide](./ARCHITECTURE.md) or [Quick Start](./QUICK_START.md).
