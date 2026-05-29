import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  apiPrefix: string;
  database: {
    uri: string;
    testUri: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  oauth?: {
    google?: {
      clientID: string;
      clientSecret: string;
      callbackURL: string;
    };
    github?: {
      clientID: string;
      clientSecret: string;
      callbackURL: string;
    };
  };
  cors: {
    origin: string[];
  };
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    bcryptRounds: number;
  };
  email: {
    smtp: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
    };
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
  };
  pdf: {
    fontPath: string;
    quality: string;
  };
  logging: {
    level: string;
    format: string;
  };
  ai: {
    openaiApiKey: string;
    cohereApiKey: string;
  };
  admin: {
    email: string;
    password: string;
  };
  analytics: {
    enableAnalytics: boolean;
    retentionDays: number;
  };
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
  };
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  apiPrefix: process.env.API_PREFIX || '/api',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-builder',
    testUri:
      process.env.MONGODB_TEST_URI ||
      'mongodb://localhost:27017/resume-builder-test',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  },
  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },
    github: {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '',
    },
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15', 10),
    rateLimitMaxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      10
    ),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      from: process.env.SMTP_FROM || 'noreply@resumebuilder.com',
    },
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'resume-builder-uploads',
  },
  pdf: {
    fontPath: process.env.PDF_FONT_PATH || '/fonts',
    quality: process.env.PDF_QUALITY || 'high',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    cohereApiKey: process.env.COHERE_API_KEY || '',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@resumebuilder.com',
    password: process.env.ADMIN_PASSWORD || 'change-me',
  },
  analytics: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
  },
  fileUpload: {
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10),
    allowedTypes: (
      process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt'
    ).split(','),
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
};

export default config;
