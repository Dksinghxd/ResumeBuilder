# Implementation Fix Guide: Resume Builder DevOps

**Status:** Action Items to Make System Production-Ready  
**Est. Time:** 2-3 hours  
**Priority:** Critical - Must complete before any deployment

---

## ✅ ALREADY IMPLEMENTED (No Action Needed)

These files already exist and are correctly configured:

- ✅ `Backend/src/services/AuthService.ts` - User registration & login logic
- ✅ `Backend/src/utils/jwt.ts` - Token generation & verification
- ✅ `Backend/src/utils/response.ts` - API response formatting
- ✅ `Backend/src/utils/bcrypt.ts` - Password hashing utilities
- ✅ `Backend/src/constants/index.ts` - Constants and error messages
- ✅ `Backend/src/models/User.ts` - User schema with proper fields
- ✅ `Backend/src/middleware/auth.ts` - JWT verification middleware
- ✅ `Backend/src/middleware/error.ts` - Error handling
- ✅ `Backend/src/config/environment.ts` - Configuration management
- ✅ `FrontEnd/lib/api-client.ts` - Fetch-based API client
- ✅ `FrontEnd/lib/services/auth-service.ts` - Frontend auth service
- ✅ `FrontEnd/hooks/use-auth.ts` - React auth hook

**Nothing to do for these - they're production-ready!**

---

## 🔴 CRITICAL: Issue #1 - Frontend Missing Dependencies

### ❌ Problem
```
npm run build fails with:
Module not found: react-hook-form
```

### ✅ Fix (2 minutes)

```bash
cd FrontEnd
npm install react-hook-form zod class-merge
npm run build
```

**Verification:**
```bash
npm run build  # Should complete without errors
```

---

## 🔴 CRITICAL: Issue #2 - Signup Form Data Mismatch

### ❌ Problem
Frontend sends `{name, email, password}` but backend expects `{firstName, lastName, email, password}`.

**File:** `FrontEnd/app/signup/page.tsx` (lines 71-84)

**Current Code:**
```tsx
try {
  await register({
    name: formData.name,  // ❌ WRONG - backend expects firstName/lastName
    email: formData.email,
    password: formData.password,
  })
}
```

### ✅ Fix (3 minutes)

**Replace lines 71-84 in `FrontEnd/app/signup/page.tsx`:**

```tsx
try {
  // Split full name into first and last name
  const nameParts = formData.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || nameParts[0];

  await register({
    firstName,
    lastName,
    email: formData.email,
    password: formData.password,
  })
  // Redirect happens automatically in useAuth on successful registration
} catch (err: any) {
  setValidationError(err.message || 'Signup failed')
}
```

**Verification:**
```bash
# Test signup flow
# 1. Go to http://localhost:3000/signup
# 2. Enter: "John Doe", "john@example.com", "Password123!"
# 3. Should successfully register and redirect to /dashboard
```

---

## 🔴 CRITICAL: Issue #3 - API URL for Docker Environment

### ❌ Problem
`.env.local` overrides the Docker build arg, causing frontend to try connecting to `localhost:5000` inside Docker container (which doesn't work).

**File:** `FrontEnd/.env.local`

**Current:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1  # ❌ Breaks in Docker
```

### ✅ Fix (1 minute)

**Option A: Delete for Docker compatibility (Recommended)**
```bash
rm FrontEnd/.env.local
```

The docker-compose build arg already has the correct config:
```yaml
frontend:
  build:
    args:
      NEXT_PUBLIC_API_URL: /api/v1  # ✅ Correct for Nginx proxy
```

**Option B: Keep for local development only**
```bash
# Create .gitignore entry to prevent committing
echo ".env.local" >> FrontEnd/.gitignore

# For local dev:
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > FrontEnd/.env.local

# For Docker: file is ignored during build
```

**Verification:**
```bash
# Test local dev
cd FrontEnd
npm run dev
# Frontend should be at http://localhost:3000
# Backend API should be at http://localhost:5000/api/v1

# Test Docker
docker compose build frontend
docker compose up frontend
# Frontend should work through Nginx proxy
# API calls go to /api/v1 (Nginx routes to backend:5000)
```

---

## 🔴 CRITICAL: Issue #4 - User Model Missing comparePassword Method

### ❌ Problem
`AuthService.ts` calls `user.comparePassword(password)` method that doesn't exist on User model.

**File:** `Backend/src/models/User.ts`

### ✅ Fix (5 minutes)

**Add to `Backend/src/models/User.ts` after the `toJSON` method (around line 68):**

```typescript
import { comparePassword } from '../utils/bcrypt.js';

// ... existing schema code ...

// Add this method to the schema
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

// Add this to the interface
export interface IUser extends Document {
  // ... existing fields ...
  comparePassword(password: string): Promise<boolean>;
}

export default model<IUser>('User', userSchema);
```

**Verification:**
```bash
cd Backend
npm run build  # Should compile without errors
```

---

## 🔴 CRITICAL: Issue #5 - Authentication Routes Missing Refresh Endpoint

### ❌ Problem
No refresh token endpoint exists. When JWT expires, users must re-login.

**File:** `Backend/src/routes/authRoutes.ts`

### ✅ Fix (10 minutes)

**Add to `Backend/src/routes/authRoutes.ts` after the logout route (around line 40):**

```typescript
// Add refresh endpoint
router.post('/refresh', (req, res) =>
  AuthController.refreshToken(req, res)
);
```

**Add to `Backend/src/controllers/AuthController.ts` after logout method:**

```typescript
async refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: user.role,
    });

    sendSuccess(res, HTTP_STATUS.OK, 'Token refreshed', {
      accessToken: newAccessToken,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    sendError(res, HTTP_STATUS.UNAUTHORIZED, message);
  }
}
```

**Add to frontend `FrontEnd/lib/services/auth-service.ts`:**

```typescript
async refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await apiClient.post<{ accessToken: string }>(
    '/auth/refresh',
    { refreshToken }
  );
  if (response.accessToken) {
    this.storeTokens(response.accessToken, refreshToken);
  }
  return response.accessToken;
}
```

**Verification:**
```bash
# Backend test
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN_HERE"}'
# Should return: { success: true, data: { accessToken: "..." } }
```

---

## 🟡 MAJOR: Issue #6 - Frontend Package.json Incomplete

### ❌ Problem
`package.json` missing some dependencies used in code.

**File:** `FrontEnd/package.json`

### ✅ Fix (5 minutes)

```bash
cd FrontEnd

# Add missing dependencies
npm install react-hook-form zod

# Optional but recommended for form handling
npm install @hookform/resolvers

# Verify all dependencies installed
npm install  # Run again to ensure consistency

# Verify build works
npm run build
```

---

## 🟡 MAJOR: Issue #7 - Docker Health Checks (docker-compose.yml)

### ❌ Problem
Backend health check uses complex shell command that fails silently.

**File:** `docker-compose.yml` (lines 30-35)

**Current:**
```yaml
backend:
  healthcheck:
    test: ["CMD-SHELL", "node -e \"const req=require('http').get(...)\""]
    # ❌ Too complex, fails in Alpine
```

### ✅ Fix (10 minutes)

**Replace the health check sections in `docker-compose.yml`:**

```yaml
# docker-compose.yml

services:
  mongo:
    # ... existing config ...
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand({ping: 1})"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s

  backend:
    # ... existing config ...
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 15s

  frontend:
    # ... existing config ...
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s

  nginx:
    # ... existing config ...
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/healthz"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 10s
```

**Verification:**
```bash
docker compose up -d
sleep 30
docker compose ps

# Should show:
# resume-mongo        healthy
# resume-backend      healthy
# resume-frontend     healthy
# resume-nginx        healthy
```

---

## 🟡 MAJOR: Issue #8 - Frontend Dockerfile pnpm Corepack Ordering

### ❌ Problem
`corepack enable` happens after files are copied, causing potential issues.

**File:** `FrontEnd/Dockerfile`

### ✅ Fix (5 minutes)

**Replace `FrontEnd/Dockerfile`:**

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# ✅ Enable corepack in base stage
RUN corepack enable && \
    corepack prepare pnpm@10.17.1 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN corepack enable

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

**Verification:**
```bash
docker build -t resume-frontend:test FrontEnd/
# Should complete successfully without corepack warnings
```

---

## 🟡 MAJOR: Issue #9 - CI/CD GitHub Actions Secrets

### ❌ Problem
Workflow references GitHub secrets that haven't been created.

**Required Secrets:**
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_PASSWORD` (or token)

### ✅ Fix (5 minutes)

**In GitHub.com UI:**

1. Go to your repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add:
   - Name: `DOCKERHUB_USERNAME` | Value: `your-docker-username`
   - Name: `DOCKERHUB_PASSWORD` | Value: `your-docker-token`

**Or via CLI:**
```bash
gh secret set DOCKERHUB_USERNAME --body "your-docker-username"
gh secret set DOCKERHUB_PASSWORD --body "your-docker-token"
```

**Verification:**
```bash
# Push to main branch
git push origin main

# Check GitHub Actions tab to verify workflow runs
# Should see: build-test-backend, build-test-frontend, build-push-docker jobs
```

---

## 🟡 MAJOR: Issue #10 - Jenkins Credentials Setup

### ❌ Problem
Jenkinsfile references credentials not configured in Jenkins.

### ✅ Fix (15 minutes)

**In Jenkins UI (http://your-jenkins:8080):**

1. **Manage Credentials**
   - Jenkins > Manage Credentials > System > Global credentials

2. **Add Docker Registry Credential**
   - Click "+ Add Credentials"
   - Kind: "Username with password"
   - Username: `your-docker-username`
   - Password: `your-docker-password`
   - ID: `docker-registry`
   - Save

3. **Add SSH Deploy Credentials (for each environment)**
   - Click "+ Add Credentials"
   - Kind: "SSH Username with private key"
   - Username: `deploy`
   - Private Key: (paste your SSH private key)
   - ID: `ssh-deploy-dev`
   - Save
   
   - Repeat for `ssh-deploy-staging` and `ssh-deploy-prod`

4. **Optional: Add GitHub Token**
   - Kind: "Secret text"
   - Secret: (your GitHub personal access token)
   - ID: `github-token`
   - Save

**Verification:**
```bash
# Trigger Jenkins job
# Jenkins should not fail with "Credentials not found"
```

---

## VERIFICATION CHECKLIST

After implementing all fixes, verify step by step:

### Backend
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts server and listens on port 5000
- [ ] `curl http://localhost:5000/health` returns `{status: "OK"}`

### Frontend
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts Next.js on port 3000

### Integration
- [ ] Docker Compose builds successfully: `docker compose build`
- [ ] Docker Compose starts: `docker compose up -d`
- [ ] All containers healthy: `docker compose ps` shows all "healthy"
- [ ] Frontend loads: `curl http://localhost`
- [ ] Backend API accessible: `curl http://localhost/api/v1/auth/health`

### Authentication Flow
```bash
# 1. Register new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
# Should return: {success: true, data: {user: {...}, accessToken: "...", refreshToken: "..."}}

# 2. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
# Should return: {success: true, data: {user: {...}, accessToken: "...", refreshToken: "..."}}

# 3. Verify token
curl -X GET http://localhost:5000/api/v1/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Should return: {success: true, data: {user: {...}}}
```

### Frontend UI
- [ ] http://localhost:3000 loads home page
- [ ] http://localhost:3000/login page loads
- [ ] http://localhost:3000/signup page loads
- [ ] Can fill signup form and submit
- [ ] After signup, redirects to /dashboard
- [ ] Dashboard page loads with user data

---

## FINAL DEPLOYMENT CHECKLIST

Before pushing to production:

- [ ] All unit tests pass: `npm run test`
- [ ] No TypeScript errors: `npm run build`
- [ ] All Docker health checks pass: `docker compose ps`
- [ ] Authentication flow works end-to-end
- [ ] Secrets are in environment (not in code)
- [ ] CORS configured for your domain
- [ ] Database backups tested
- [ ] Monitoring/logging configured
- [ ] SSL certificates installed (if HTTPS)

---

**Status:** Follow checklist order for ~2-3 hours of implementation  
**Success Criteria:** All checks pass, system ready for production deployment

