export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PREMIUM_USER: 'premium_user',
} as const;

export const RESUME_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const TEMPLATE_TYPES = {
  MODERN: 'modern',
  CLASSIC: 'classic',
  CREATIVE: 'creative',
  MINIMAL: 'minimal',
  PROFESSIONAL: 'professional',
} as const;

export const DEFAULT_RESUME_TEMPLATE_ID = 'professional-teal';

/** Slugs used by the editor preview and PDF renderer. */
export const RESUME_TEMPLATE_IDS = [
  'professional-teal',
  'corporate-navy',
  'tech-sidebar',
  'clean-linear',
  'modern-blue',
  'minimalist',
  'creative-split',
  'bold-executive',
] as const;

export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

const LEGACY_TEMPLATE_ID_MAP: Record<string, ResumeTemplateId> = {
  '1': 'professional-teal',
  '2': 'corporate-navy',
  '3': 'minimalist',
  '4': 'creative-split',
  '5': 'tech-sidebar',
  '6': 'bold-executive',
};

export function resolveResumeTemplateId(
  raw?: string | null
): ResumeTemplateId {
  if (!raw?.trim()) return DEFAULT_RESUME_TEMPLATE_ID;
  const trimmed = raw.trim();
  const legacy = LEGACY_TEMPLATE_ID_MAP[trimmed];
  if (legacy) return legacy;
  if ((RESUME_TEMPLATE_IDS as readonly string[]).includes(trimmed)) {
    return trimmed as ResumeTemplateId;
  }
  return DEFAULT_RESUME_TEMPLATE_ID;
}

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid or expired token',
  EMAIL_EXISTS: 'Email already registered',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMITED: 'Too many requests, please try again later',
  FILE_UPLOAD_FAILED: 'File upload failed',
  PDF_GENERATION_FAILED: 'PDF generation failed',
} as const;

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  LOGIN_SUCCESS: 'Login successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  RESUME_CREATED: 'Resume created successfully',
  RESUME_UPDATED: 'Resume updated successfully',
  RESUME_DELETED: 'Resume deleted successfully',
  PDF_GENERATED: 'PDF generated successfully',
  SHARE_LINK_CREATED: 'Share link created successfully',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export const SHARE_LINK_VALIDITY = {
  NEVER_EXPIRE: 'never',
  SEVEN_DAYS: 7,
  THIRTY_DAYS: 30,
  SIXTY_DAYS: 60,
  NINETY_DAYS: 90,
} as const;

export const RESUME_SCORING = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  EXCELLENT: 85,
  GOOD: 70,
  FAIR: 50,
  POOR: 0,
} as const;

export const AI_SUGGESTION_TYPES = {
  CONTENT: 'content',
  FORMATTING: 'formatting',
  KEYWORD: 'keyword',
  STRUCTURE: 'structure',
  IMPROVEMENT: 'improvement',
} as const;
