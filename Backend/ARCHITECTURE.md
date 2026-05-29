# Resume Builder Backend API

## Overview
Production-grade Node.js + Express backend for Resume Builder platform with enterprise-level architecture, security, and scalability.

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access & Refresh tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Custom file-based logger
- **PDF Generation**: PDFKit
- **Testing**: Jest

## Project Structure

```
src/
├── controllers/          # Business logic and request handling
│   ├── AuthController.ts
│   ├── ResumeController.ts
│   ├── ShareLinkController.ts
│   ├── AnalyticsController.ts
│   ├── AIController.ts
│   └── AdminController.ts
├── routes/              # API endpoint definitions
│   ├── authRoutes.ts
│   ├── resumeRoutes.ts
│   ├── shareRoutes.ts
│   ├── analyticsRoutes.ts
│   ├── aiRoutes.ts
│   └── adminRoutes.ts
├── models/              # Mongoose schemas and interfaces
│   ├── User.ts
│   ├── Resume.ts
│   ├── Template.ts
│   ├── ShareLink.ts
│   └── Analytics.ts
├── services/            # Business logic services
│   ├── AuthService.ts
│   ├── ResumeService.ts
│   ├── PDFService.ts
│   ├── ShareLinkService.ts
│   └── AnalyticsService.ts
├── middleware/          # Express middleware
│   ├── auth.ts          # JWT authentication & RBAC
│   ├── error.ts         # Error handling
│   ├── validation.ts    # Request validation
│   ├── rateLimiter.ts   # Rate limiting
│   └── logger.ts        # Request logging
├── validators/          # Joi validation schemas
│   ├── auth.ts
│   └── resume.ts
├── config/              # Configuration
│   ├── environment.ts   # Environment variables
│   ├── database.ts      # MongoDB connection
│   └── types.ts         # TypeScript types
├── utils/               # Utility functions
│   ├── jwt.ts           # JWT token generation/verification
│   ├── bcrypt.ts        # Password hashing
│   ├── response.ts      # API response helpers
│   ├── logger.ts        # Logging utility
│   ├── generators.ts    # ID/token generators
│   ├── pagination.ts    # Pagination helpers
│   ├── object.ts        # Object manipulation
├── constants/           # Constants and enums
│   └── index.ts
└── index.ts            # Application entry point

logs/                   # Application logs directory
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## Configuration

Edit `.env` file with your settings:

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/resume-builder

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
```

## Development

```bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /verify` - Verify JWT token
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /change-password` - Change password

### Resumes (`/api/v1/resumes`)
- `POST /` - Create resume
- `GET /` - Get user's resumes (paginated)
- `GET /:id` - Get resume by ID
- `PUT /:id` - Update resume
- `DELETE /:id` - Delete resume
- `POST /:id/score` - Score resume
- `POST /:id/pdf` - Generate PDF

### Share Links (`/api/v1/share`)
- `POST /resumes/:resumeId/share` - Create share link
- `GET /share/:token` - Access shared resume (public)
- `DELETE /share/:token` - Disable share link

### Analytics (`/api/v1/analytics`)
- `GET /dashboard` - Get user dashboard analytics
- `GET /resumes/:resumeId` - Get resume analytics
- `POST /track` - Track custom event

### AI Features (`/api/v1/ai`)
- `POST /suggestions/resume` - Get resume suggestions
- `POST /score` - Score resume using AI
- `POST /generate` - Generate content using AI

### Admin (`/api/v1/admin`)
- `GET /users` - Get all users (paginated)
- `GET /analytics` - Get system analytics
- `PUT /users/:userId` - Update user
- `DELETE /users/:userId` - Delete user

## Security Features

- **Helmet**: Secures HTTP headers
- **CORS**: Configurable cross-origin requests
- **JWT**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DDoS
- **Password Hashing**: bcrypt with configurable rounds
- **Input Validation**: Joi schema validation
- **RBAC**: Role-based access control (user, admin, premium)
- **Error Handling**: Centralized error management
- **Logging**: Comprehensive event logging

## Database Models

### User
- Personal information
- Authentication credentials
- Profile settings
- Role and status

### Resume
- Personal info, experience, education
- Skills, certifications, projects
- Social links
- Score tracking
- View/download counts

### Template
- Resume templates (5 types)
- Colors, fonts, features
- Premium designation

### ShareLink
- Public resume sharing with tokens
- Expiration settings
- Access controls
- View tracking

### Analytics
- Event tracking
- User behavior analysis
- Resume interaction metrics
- TTL-based auto-deletion (90 days)

## Error Handling

Standardized error responses with status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Logging

All requests and events are logged to `logs/` directory with daily log files:
- `info-YYYY-MM-DD.log` - General information
- `error-YYYY-MM-DD.log` - Errors
- `warn-YYYY-MM-DD.log` - Warnings
- `debug-YYYY-MM-DD.log` - Debug information (dev only)

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Performance Optimization

- MongoDB indexing on frequently queried fields
- Pagination support (20-100 items per page)
- Query optimization with lean() for read operations
- Connection pooling (5-10 connections)
- Caching headers via Helmet
- Rate limiting to prevent abuse

## Best Practices

- Environment-based configuration
- Separation of concerns (Controllers, Services, Models)
- Type-safe TypeScript throughout
- Comprehensive error handling
- Request validation before processing
- Secure password handling
- Audit logging for sensitive operations
- Clean code with consistent naming

## Deployment

### Prerequisites
- Node.js 18+
- MongoDB Atlas or local MongoDB
- Environment variables configured

### Steps
1. Install dependencies: `npm install`
2. Build application: `npm run build`
3. Set environment variables
4. Start server: `npm start`

### Docker Support (optional)
Create `Dockerfile` for containerization and deployment to cloud platforms.

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Use consistent naming conventions
4. Document complex logic
5. Run linting: `npm run lint:fix`

## License

MIT

## Support

For issues or questions, please contact the development team.
