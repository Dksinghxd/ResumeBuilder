# Resume Builder Backend API

Production-grade Node.js + Express backend for the Resume Builder platform.

## Features

- ✅ JWT Authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ MongoDB with Mongoose ODM
- ✅ RESTful API design
- ✅ Comprehensive validation
- ✅ Error handling middleware
- ✅ Production logging system
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Resume CRUD operations
- ✅ PDF export functionality
- ✅ Resume scoring system
- ✅ Public shareable links
- ✅ Analytics and insights
- ✅ AI-powered suggestions
- ✅ Admin dashboard APIs

## Project Structure

```
src/
├── controllers/          # Business logic
├── routes/              # API endpoints
├── models/              # Mongoose schemas
├── services/            # Business services
├── middleware/          # Custom middleware
├── validators/          # Input validation schemas
├── config/              # Configuration files
├── utils/               # Utility functions
├── constants/           # Constants and enums
└── index.ts            # Application entry point
```

## Installation

```bash
npm install
```

## Environment Setup

```bash
cp .env.example .env
```

Update `.env` with your configuration.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Testing

```bash
npm test
npm run test:coverage
```

## API Documentation

All endpoints are prefixed with `/api/v1`

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user
- `GET /auth/verify` - Verify token

### Resume Endpoints
- `GET /resumes` - Get all resumes
- `POST /resumes` - Create new resume
- `GET /resumes/:id` - Get specific resume
- `PUT /resumes/:id` - Update resume
- `DELETE /resumes/:id` - Delete resume
- `POST /resumes/:id/pdf` - Generate PDF
- `POST /resumes/:id/share` - Create shareable link
- `GET /resumes/share/:token` - Access shared resume

### Template Endpoints
- `GET /templates` - Get all templates
- `GET /templates/:id` - Get template details
- `POST /templates/:id/preview` - Preview template

### Analytics Endpoints
- `GET /analytics/dashboard` - Get dashboard analytics
- `GET /analytics/resumes/:id` - Get resume analytics
- `POST /analytics/track` - Track user activity

### AI Endpoints
- `POST /ai/suggestions/resume` - Get resume suggestions
- `POST /ai/suggestions/score` - Score resume
- `POST /ai/generate/content` - Generate content

### Admin Endpoints
- `GET /admin/users` - Get all users
- `GET /admin/analytics` - Get system analytics
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

## Security

- Helmet for HTTP headers security
- CORS configuration
- JWT authentication
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection (when needed)

## License

MIT
