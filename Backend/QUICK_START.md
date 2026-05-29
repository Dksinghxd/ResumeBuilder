# Backend Setup & Quick Start Guide

## Prerequisites
- Node.js 18+ (https://nodejs.org/)
- MongoDB (local or Atlas cloud: https://www.mongodb.com/cloud/atlas)
- npm or yarn package manager
- Postman/Insomnia for API testing (optional)

## Step 1: Install Dependencies

```bash
cd Backend
npm install
```

This installs all required packages listed in `package.json`.

## Step 2: Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and update the following key settings:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database - Change to your MongoDB URI
MONGODB_URI=mongodb://localhost:27017/resume-builder
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resume-builder

# JWT Secrets - CHANGE THESE IN PRODUCTION!
JWT_SECRET=change-me-to-a-strong-secret-key
JWT_REFRESH_SECRET=change-me-to-another-strong-secret-key

# CORS - Add your frontend URL
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 3: Database Setup

### Option A: Local MongoDB
```bash
# If you have MongoDB installed locally
mongod  # Start MongoDB daemon

# Verify connection by opening another terminal
mongo
```

### Option B: MongoDB Atlas Cloud
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

## Step 4: Start Development Server

```bash
npm run dev
```

Expected output:
```
Server running in development mode on port 5000
API available at http://localhost:5000/api/v1
```

## Step 5: Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

## Available Commands

```bash
# Development
npm run dev              # Start with auto-reload (uses nodemon)

# Production
npm run build            # Compile TypeScript to JavaScript
npm start               # Run compiled JavaScript

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Check for linting issues
npm run lint:fix        # Automatically fix linting issues

# Database
npm run seed            # Seed database with sample data
npm run migrate         # Run database migrations
```

## Project Structure Quick Reference

```
Backend/
├── src/
│   ├── controllers/     # Handle HTTP requests
│   ├── routes/          # Define API endpoints
│   ├── models/          # MongoDB schemas
│   ├── services/        # Business logic
│   ├── middleware/      # Request processing
│   ├── validators/      # Input validation
│   ├── config/          # Configuration
│   ├── utils/           # Helper functions
│   ├── constants/       # Constants & enums
│   └── index.ts        # Application entry point
├── logs/               # Application logs (auto-created)
├── dist/               # Compiled JavaScript (after npm run build)
├── package.json        # Dependencies & scripts
├── tsconfig.json       # TypeScript config
├── jest.config.js      # Testing config
├── .env.example        # Environment template
└── README.md          # Main documentation
```

## Common Development Tasks

### Adding a New Endpoint

1. **Create/Update Model** (`src/models/`)
2. **Create Service** (`src/services/`)
3. **Create Controller** (`src/controllers/`)
4. **Add Validator** (`src/validators/`)
5. **Create Route** (`src/routes/`)
6. **Register Route** in `src/index.ts`

### Testing an Endpoint

Use Postman/Insomnia or curl:

```bash
# Example: Create Resume
curl -X POST http://localhost:5000/api/v1/resumes \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Resume",
    "templateId": "modern",
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": "New York, USA",
      "summary": "Software Engineer with 5 years experience"
    }
  }'
```

### Debugging

Set `NODE_ENV=development` in `.env` to enable:
- Debug logging
- Detailed error messages
- Console output of all HTTP requests

Check `logs/` directory for detailed logs:
- `info-*.log` - General information
- `error-*.log` - Error tracking
- `warn-*.log` - Warnings
- `debug-*.log` - Debug information

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB or update `MONGODB_URI` in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change `PORT` in `.env` or kill process: `lsof -i :5000`

### JWT Token Expired
```
Error: Invalid or expired token
```
**Solution**: Get a new token by logging in again

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Add your frontend URL to `CORS_ORIGIN` in `.env`

## Production Checklist

- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas instead of localhost
- [ ] Set CORS_ORIGIN to your production domain
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and alerts
- [ ] Configure backups for MongoDB
- [ ] Use environment-specific .env files
- [ ] Run `npm run build` before deployment
- [ ] Test all APIs in staging environment

## API Documentation

See `API_DOCS.md` for complete endpoint documentation.

## Support & Resources

- Express.js: https://expressjs.com/
- MongoDB: https://docs.mongodb.com/
- TypeScript: https://www.typescriptlang.org/
- Mongoose: https://mongoosejs.com/
- JWT: https://jwt.io/

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment
3. ✅ Start development server
4. ✅ Test authentication endpoints
5. Create resume endpoints
6. Implement PDF generation
7. Add AI integration
8. Deploy to production

Happy coding! 🚀
