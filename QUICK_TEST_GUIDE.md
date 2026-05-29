# Quick Start & Testing Guide

## ⚡ Current Status

```
Backend Server:   http://localhost:5000 ✅ RUNNING
Frontend Server:  http://localhost:3000 ✅ RUNNING
MongoDB:          Connected ✅
API Integration:  Complete ✅
```

---

## 🔗 Access Points

### Frontend
- **Home/Login**: http://localhost:3000
- **Signup**: http://localhost:3000/signup
- **Dashboard**: http://localhost:3000/dashboard (after login)

### Backend API
- **Base URL**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health

---

## 🧪 Browser Console Tests

### Test Backend Connectivity
```javascript
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend alive:', d))
  .catch(e => console.log('❌ Backend error:', e))
```

### Test Token Storage
```javascript
console.log('Token:', localStorage.getItem('accessToken') ? '✅ Stored' : '❌ Missing')
console.log('User:', localStorage.getItem('user') ? '✅ Stored' : '❌ Missing')
```

### Test API Call with Token
```javascript
const token = localStorage.getItem('accessToken')
fetch('http://localhost:5000/api/v1/auth/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(d => console.log('✅ Profile:', d))
  .catch(e => console.log('❌ Error:', e))
```

### Clear All Auth Data
```javascript
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')
localStorage.removeItem('user')
console.log('✅ Auth data cleared - refresh page')
```

---

## 📋 Test Scenarios

### Scenario 1: Fresh Registration
1. **Open**: http://localhost:3000/signup
2. **Fill Form**:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm: `password123`
   - Check: Terms checkbox
3. **Submit**: Click "Create Account"
4. **Expected**: Redirect to dashboard
5. **Verify**: 
   - Check localStorage for accessToken
   - Check console for successful registration

### Scenario 2: Login with Credentials
1. **Open**: http://localhost:3000/login
2. **Fill Form**:
   - Email: `test@example.com` (from registration)
   - Password: `password123`
3. **Submit**: Click "Login"
4. **Expected**: Redirect to dashboard
5. **Verify**:
   - Token updated in localStorage
   - User object stored

### Scenario 3: Token Persistence
1. **Login** successfully
2. **Refresh Page**: Press F5 or Cmd+R
3. **Expected**: Still logged in, no redirect
4. **Verify**: User data still available from storage

### Scenario 4: 401 Auto-Redirect
1. **Login** successfully
2. **Open DevTools**: F12
3. **Delete Token**:
   - Go to Application tab
   - Local Storage
   - Find and delete `accessToken`
4. **Refresh Page**: F5
5. **Expected**: Redirected to login (because token missing)

### Scenario 5: Invalid Credentials
1. **Open**: http://localhost:3000/login
2. **Fill Form**:
   - Email: `test@example.com`
   - Password: `wrongpassword`
3. **Submit**: Click "Login"
4. **Expected**: 
   - Error message displayed
   - Form still visible
   - No redirect
5. **Verify**: Error comes from backend

### Scenario 6: Validation Errors
1. **Open**: http://localhost:3000/signup
2. **Try Submit** with:
   - Empty name → Error: "Full name is required"
   - Password < 8 chars → Error: "Password must be at least 8 characters"
   - Mismatched passwords → Error: "Passwords do not match"
   - No terms checked → Error: "Please agree to the terms"

---

## 🛠️ Terminal Commands

### Start Backend (if not running)
```bash
cd d:\ResumeBuilderDevOps\Backend
npm start
```

### Start Frontend (if not running)
```bash
cd d:\ResumeBuilderDevOps\FrontEnd
npm run dev
```

### Check Backend Health
```bash
curl http://localhost:5000/health
```

### View Backend Logs
```bash
# Windows
type Backend\logs\latest.log
# or tail in real-time with PowerShell
Get-Content Backend\logs\latest.log -Tail 50 -Wait
```

### Kill Port 3000 (if needed)
```bash
# Find process on port 3000
netstat -ano | findstr :3000
# Kill it
taskkill /PID <PID> /F
```

### Build Frontend for Production
```bash
cd d:\ResumeBuilderDevOps\FrontEnd
npm run build
npm start  # Runs production server on port 3000
```

---

## 🐛 Debugging Tips

### Login Not Working?
1. Check backend running: `http://localhost:5000/health`
2. Check console for API error
3. View backend logs in `Backend/logs/`
4. Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`

### Token Not Persisting?
1. Open DevTools → Application → Storage → Local Storage
2. Check if `accessToken` exists
3. If empty, token not saved on login
4. Check API response for token in login response

### 401 After Logout?
**Expected behavior** - All API calls should return 401 because no token

To test:
1. Logout (browser redirects to login)
2. Open DevTools → Network tab
3. Try to navigate to `/dashboard`
4. Should see 401 response
5. Should redirect to `/login`

### Page Load Slow?
1. Check Next.js compilation time (should be <500ms)
2. Check browser network requests (DevTools → Network)
3. Check backend response time (should be <100ms)
4. Disable browser extensions that might interfere

---

## 📊 Network Monitoring

### In DevTools Network Tab, Expect:
```
Login Request:
  POST http://localhost:5000/api/v1/auth/login
  Status: 200
  Response: { accessToken, refreshToken, user }

Profile Request (auto):
  GET http://localhost:5000/api/v1/auth/profile
  Status: 200
  Response: { user profile data }

Resume Request (dashboard):
  GET http://localhost:5000/api/v1/resumes
  Status: 200
  Response: [ array of resumes ]
```

### Token in Request Header:
All requests after login should have:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Login page loads without errors
- [ ] Can create account with signup
- [ ] Can login with registered credentials
- [ ] Dashboard loads after login
- [ ] Page refresh keeps user logged in
- [ ] Token visible in localStorage after login
- [ ] Error messages display properly
- [ ] Loading states work during requests
- [ ] Invalid credentials show error
- [ ] Validation errors work on signup

---

## 🚀 Next Phase: Dashboard Integration

Once login/signup verified, next integration steps:

### 1. Dashboard Page
```typescript
// pages/dashboard/page.tsx
import { useAuth } from '@/hooks/use-auth'
import { resumeService } from '@/lib/services/resume-service'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [resumes, setResumes] = useState([])

  useEffect(() => {
    // Protect page
    if (!loading && !user) router.push('/login')
    
    // Fetch resumes
    if (user) {
      resumeService.getUserResumes(1, 10)
        .then(setResumes)
    }
  }, [user])
}
```

### 2. Resume List
```typescript
// Use resumeService.getUserResumes(page, limit)
// Display resumes with edit/delete/pdf buttons
```

### 3. Resume Editor
```typescript
// Use resumeService.createResume() and updateResume()
// Form with all sections
```

### 4. Resume Detail
```typescript
// Use resumeService.getResume(id)
// Display formatted resume
// Add PDF download button
// Add AI score button
```

---

## 📝 Example API Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Resume
```bash
curl -X POST http://localhost:5000/api/v1/resumes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Resume",
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john@example.com"
    }
  }'
```

---

## 🎯 Important Notes

1. **CORS Enabled**: Backend allows requests from localhost:3000
2. **Environment Vars**: Frontend uses .env.local, Backend uses .env
3. **Token Storage**: Uses browser localStorage (not secure for production)
4. **Auto Redirect**: 401 responses auto-redirect to /login
5. **Token Injection**: Automatic in all API calls via api-client
6. **Session Duration**: Access token valid for 7 days

---

**Last Updated**: Latest
**Status**: ✅ Ready for Testing
**Next Step**: Test registration → login → dashboard
