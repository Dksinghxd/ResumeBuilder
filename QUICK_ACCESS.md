# 🔗 Quick Access & URLs

## 🌐 Live Servers

| Service | URL | Status | Port |
|---------|-----|--------|------|
| Frontend | http://localhost:3000 | ✅ Running | 3000 |
| Backend API | http://localhost:5000/api/v1 | ✅ Running | 5000 |
| Health Check | http://localhost:5000/health | ✅ Responding | 5000 |

---

## 📱 Frontend Pages

### Authentication
- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup

### Main Application
- **Home**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **My Resumes**: http://localhost:3000/resumes
- **Resume Editor**: http://localhost:3000/resumes/editor
- **ATS Score**: http://localhost:3000/ats-score
- **Templates**: http://localhost:3000/templates
- **Settings**: http://localhost:3000/settings

---

## 🔌 Backend API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints
```
POST   /auth/register          - Create new account
POST   /auth/login             - Login with credentials
POST   /auth/refresh           - Refresh access token
POST   /auth/logout            - Logout user
GET    /auth/profile           - Get current user profile
PUT    /auth/profile           - Update profile
PUT    /auth/password          - Change password
GET    /auth/verify            - Verify token validity
```

### Resume Endpoints
```
GET    /resumes                - List user's resumes (paginated)
POST   /resumes                - Create new resume
GET    /resumes/:id            - Get resume by ID
PUT    /resumes/:id            - Update resume
DELETE /resumes/:id            - Delete resume
GET    /resumes/:id/pdf        - Download resume as PDF
POST   /resumes/:id/score      - Get AI ATS score (0-100)
```

### Analytics Endpoints
```
GET    /analytics/dashboard    - Dashboard metrics
GET    /analytics/resumes/:id  - Resume-specific metrics
POST   /analytics/events       - Track custom event
POST   /analytics/page-view    - Track page view
```

### Health Endpoints
```
GET    /health                 - API health check
GET    /api/v1/health          - Full API health check
```

---

## 📚 Documentation Files

| File | Purpose | Access |
|------|---------|--------|
| `FULL_STACK_INTEGRATION.md` | Complete architecture guide | VS Code |
| `FRONTEND_INTEGRATION_SUMMARY.md` | Integration details and features | VS Code |
| `QUICK_TEST_GUIDE.md` | Step-by-step testing instructions | VS Code |
| `FINAL_SESSION_SUMMARY.md` | Session achievements and summary | VS Code |
| `QUICK_ACCESS.md` | This file - URLs and quick reference | VS Code |

---

## 🛠️ Developer Tools

### Browser DevTools
- **F12** - Open DevTools
- **Ctrl+Shift+K** - Open Console
- **Ctrl+Shift+J** - Jump to Console
- **Ctrl+Shift+I** - Inspect Element

### Debug Console Commands
```javascript
// Check if logged in
localStorage.getItem('accessToken') ? 'Logged in' : 'Not logged in'

// View stored user data
JSON.parse(localStorage.getItem('user'))

// Clear all auth data
['accessToken', 'refreshToken', 'user'].forEach(k => localStorage.removeItem(k))

// Test API connection
fetch('http://localhost:5000/health').then(r => r.json()).then(console.log)

// Test authenticated request
fetch('http://localhost:5000/api/v1/auth/profile', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
}).then(r => r.json()).then(console.log)
```

---

## 💻 Terminal Shortcuts

### Start Services
```bash
# Start Backend
cd d:\ResumeBuilderDevOps\Backend && npm start

# Start Frontend
cd d:\ResumeBuilderDevOps\FrontEnd && npm run dev

# Build Frontend
cd d:\ResumeBuilderDevOps\FrontEnd && npm run build

# Run Production Frontend
cd d:\ResumeBuilderDevOps\FrontEnd && npm start
```

### Check Ports
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process on port 3000
taskkill /PID <PID> /F

# Kill process on port 5000
taskkill /PID <PID> /F
```

### View Logs
```bash
# View backend logs (live)
Get-Content Backend\logs\latest.log -Tail 50 -Wait

# View last 100 lines
Get-Content Backend\logs\latest.log -Tail 100

# List all log files
Get-ChildItem Backend\logs\
```

---

## 🧪 Quick Test Commands

### Registration Test
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test@1234"}'
```

### Login Test
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'
```

### Profile Test (replace TOKEN)
```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Health Check
```bash
curl http://localhost:5000/health
```

---

## 🔐 Authentication Flow

### 1. Register
```
POST /auth/register
Body: { name, email, password }
Response: { accessToken, refreshToken, user }
Storage: localStorage.setItem('accessToken', token)
```

### 2. Login
```
POST /auth/login
Body: { email, password }
Response: { accessToken, refreshToken, user }
Storage: localStorage.setItem('accessToken', token)
```

### 3. Authenticated Request
```
GET /api/endpoint
Header: Authorization: Bearer {accessToken}
```

### 4. Auto Redirect on 401
```
If Response.status === 401
  Then: localStorage.clear()
  Then: router.push('/login')
```

---

## 📊 System Status

### Backend Status
- **Server**: Node.js Express
- **Port**: 5000
- **Database**: MongoDB (Connected)
- **Health**: http://localhost:5000/health

### Frontend Status
- **Framework**: Next.js 16.2.6
- **Port**: 3000
- **Build Tool**: Turbopack
- **Environment**: .env.local loaded

### Development Environment
- **OS**: Windows
- **Shell**: PowerShell
- **Node Version**: 22.21.1
- **npm Version**: 10.x

---

## 🎯 Test Scenarios

### Scenario 1: Register New User
```
1. Open http://localhost:3000/signup
2. Fill form with test data
3. Click "Create Account"
4. Expect: Redirect to /dashboard
5. Verify: Token in localStorage
```

### Scenario 2: Login Existing User
```
1. Open http://localhost:3000/login
2. Enter credentials
3. Click "Login"
4. Expect: Redirect to /dashboard
5. Verify: Token stored, user data available
```

### Scenario 3: Token Persistence
```
1. After login, refresh page (F5)
2. Expect: Still logged in
3. Verify: Token still in localStorage
```

### Scenario 4: Invalid Credentials
```
1. Enter wrong password
2. Expect: Error message displayed
3. Verify: No redirect, form remains
```

### Scenario 5: Token Expiration
```
1. Delete token from localStorage
2. Try to access protected page
3. Expect: Redirect to /login
4. Verify: Clean redirect, no errors
```

---

## 🔄 API Response Examples

### Successful Login
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "message": "Invalid credentials",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

### Resume Response
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Resume",
  "userId": "507f1f77bcf86cd799439012",
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "experience": [...],
  "education": [...],
  "skills": [...],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 🎨 Component Usage

### Using useAuth Hook
```typescript
import { useAuth } from '@/hooks/use-auth'

export default function MyComponent() {
  const { user, loading, error, login, logout, isAuthenticated } = useAuth()
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.name}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  )
}
```

### Using Resume Service
```typescript
import { resumeService } from '@/lib/services/resume-service'

// Get user's resumes
const resumes = await resumeService.getUserResumes(1, 10)

// Create resume
const resume = await resumeService.createResume({
  title: 'My Resume',
  personalInfo: { fullName: 'John Doe', email: 'john@example.com' }
})

// Update resume
await resumeService.updateResume(resumeId, updatedData)

// Download PDF
await resumeService.downloadPDF(resumeId, 'resume.pdf')

// Get ATS score
const score = await resumeService.scoreResume(resumeId)
```

---

## 🌍 Network Configuration

### Frontend to Backend
```
Client: http://localhost:3000
Server: http://localhost:5000/api/v1
Connection: HTTP/REST with JSON
Auth: Bearer token in Authorization header
```

### Local Machine Testing
```
Localhost: 127.0.0.1
IPv4: 169.254.83.107
Frontend: Accessible at both
Backend: Accessible at both
```

---

## 📖 File Organization

```
d:\ResumeBuilderDevOps\
├── Backend/                           [Backend Server]
│   ├── src/
│   ├── dist/
│   ├── logs/
│   └── package.json
│
├── FrontEnd/                          [Frontend Server]
│   ├── app/
│   │   ├── login/page.tsx            [Login page - integrated]
│   │   ├── signup/page.tsx           [Signup page - integrated]
│   │   ├── dashboard/                [Ready for integration]
│   │   ├── resumes/                  [Ready for integration]
│   │   ├── settings/                 [Ready for integration]
│   │   └── templates/                [Ready for integration]
│   ├── lib/
│   │   ├── api-client.ts             [HTTP client]
│   │   └── services/
│   │       ├── auth-service.ts       [Auth logic]
│   │       ├── resume-service.ts     [Resume operations]
│   │       └── analytics-service.ts  [Analytics]
│   ├── hooks/
│   │   └── use-auth.ts               [Auth hook]
│   ├── components/
│   ├── .env.local                    [Environment config]
│   └── package.json
│
└── Documentation/                     [This session]
    ├── FULL_STACK_INTEGRATION.md
    ├── FRONTEND_INTEGRATION_SUMMARY.md
    ├── QUICK_TEST_GUIDE.md
    ├── FINAL_SESSION_SUMMARY.md
    └── QUICK_ACCESS.md               [This file]
```

---

## ✅ Checklist for Next Developer

- [ ] Start backend: `npm start` in Backend/
- [ ] Start frontend: `npm run dev` in FrontEnd/
- [ ] Test registration at http://localhost:3000/signup
- [ ] Test login at http://localhost:3000/login
- [ ] Check localStorage for tokens
- [ ] View backend logs in Backend/logs/
- [ ] Test API endpoints with curl or Postman
- [ ] Read QUICK_TEST_GUIDE.md for detailed steps
- [ ] Integrate remaining pages (dashboard, etc.)
- [ ] Deploy to production when ready

---

**Last Updated**: Latest
**Status**: ✅ All Systems Operational
**Next Step**: Test the authentication flow
