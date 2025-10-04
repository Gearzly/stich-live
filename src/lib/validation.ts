/**
 * Input Validation Utilities
 * Comprehensive input validation and sanitization functions
 */

import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters')
  .transform(email => email.toLowerCase().trim());

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Name validation schema
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
  .transform(name => name.trim());

// Username validation schema
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(username => username.toLowerCase().trim());

// URL validation schema
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .max(2048, 'URL must not exceed 2048 characters')
  .refine(url => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol');

// Phone number validation schema
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .min(7, 'Phone number must be at least 7 digits')
  .max(15, 'Phone number must not exceed 15 digits');

// App name validation schema
export const appNameSchema = z
  .string()
  .min(1, 'App name is required')
  .max(50, 'App name must not exceed 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'App name can only contain letters, numbers, spaces, hyphens, underscores, and periods')
  .transform(name => name.trim());

// App description validation schema
export const appDescriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(500, 'Description must not exceed 500 characters')
  .transform(desc => desc.trim());

// API key validation schema
export const apiKeySchema = z
  .string()
  .regex(/^sk_[a-zA-Z0-9_-]+$/, 'Invalid API key format')
  .min(20, 'API key must be at least 20 characters')
  .max(100, 'API key must not exceed 100 characters');

// File name validation schema
export const fileNameSchema = z
  .string()
  .min(1, 'File name is required')
  .max(255, 'File name must not exceed 255 characters')
  .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, 'File name contains invalid characters')
  .refine(name => !name.startsWith('.'), 'File name cannot start with a period')
  .refine(name => !name.endsWith('.'), 'File name cannot end with a period')
  .transform(name => name.trim());

// Framework validation schema
export const frameworkSchema = z.enum([
  'react',
  'vue',
  'angular',
  'svelte',
  'nextjs',
  'nuxtjs',
  'gatsby',
  'remix',
  'astro',
  'vanilla'
], {
  errorMap: () => ({ message: 'Please select a valid framework' })
});

// Color hex validation schema
export const colorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code');

// Slug validation schema (for URLs)
export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must not exceed 50 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .transform(slug => slug.toLowerCase().trim());

// IP address validation schema
export const ipAddressSchema = z
  .string()
  .refine(ip => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }, 'Please enter a valid IP address');

// Common registration form schema
export const registrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

// App creation form schema
export const appCreationSchema = z.object({
  name: appNameSchema,
  description: appDescriptionSchema,
  framework: frameworkSchema,
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(20)).max(10, 'Maximum 10 tags allowed').optional()
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  username: usernameSchema.optional(),
  bio: z.string().max(160, 'Bio must not exceed 160 characters').optional(),
  website: urlSchema.optional(),
  location: z.string().max(50, 'Location must not exceed 50 characters').optional(),
  phone: phoneSchema.optional()
});

// Security settings schema
export const securitySettingsSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
  twoFactorEnabled: z.boolean().optional()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword']
});

// Contact form schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must not exceed 100 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000, 'Message must not exceed 1000 characters'),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

// Team invitation schema
export const teamInvitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['viewer', 'editor', 'admin']),
  message: z.string().max(200, 'Message must not exceed 200 characters').optional()
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.custom<File>()
    .refine(file => file instanceof File, 'Please select a file')
    .refine(file => file.size <= 50 * 1024 * 1024, 'File size must not exceed 50MB')
    .refine(file => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/json',
        'application/javascript',
        'text/css',
        'text/html',
        'application/zip'
      ];
      return allowedTypes.includes(file.type);
    }, 'File type not allowed'),
  description: z.string().max(200, 'Description must not exceed 200 characters').optional()
});

// Comment validation schema
export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must not exceed 500 characters')
    .transform(content => content.trim()),
  parentId: z.string().uuid().optional()
});

// Rating validation schema
export const ratingSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must not exceed 5'),
  review: z.string().max(300, 'Review must not exceed 300 characters').optional()
});

// Search query validation schema
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query must not exceed 100 characters')
    .transform(query => query.trim()),
  filters: z.object({
    category: z.string().optional(),
    framework: frameworkSchema.optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional()
    }).optional()
  }).optional()
});

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9\-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

export const sanitizeSlug = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Rate limiting configuration
export const rateLimits = {
  login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  registration: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 registrations per hour
  passwordReset: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 reset attempts per hour
  apiCalls: { windowMs: 60 * 1000, max: 60 }, // 60 API calls per minute
  fileUpload: { windowMs: 60 * 1000, max: 10 }, // 10 uploads per minute
  appCreation: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 apps per hour
  comments: { windowMs: 60 * 1000, max: 5 }, // 5 comments per minute
  search: { windowMs: 60 * 1000, max: 30 } // 30 searches per minute
};

// Security headers configuration
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.anthropic.com wss:; frame-ancestors 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block'
};

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://stich.com', 'https://www.stich.com', 'https://app.stich.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Input validation utility function
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

// Rate limiting check utility
export const checkRateLimit = (key: string, limit: { windowMs: number; max: number }): boolean => {
  // In a real implementation, this would use Redis or another store
  // For now, we'll use a simple in-memory implementation
  const now = Date.now();
  const windowStart = now - limit.windowMs;
  
  // This is a simplified version - use proper rate limiting in production
  const requests = getRequestHistory(key, windowStart);
  return requests.length < limit.max;
};

// Helper function for rate limiting (simplified)
const getRequestHistory = (key: string, windowStart: number): number[] => {
  // In production, implement proper storage mechanism
  return [];
};

export default {
  schemas: {
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    username: usernameSchema,
    url: urlSchema,
    phone: phoneSchema,
    appName: appNameSchema,
    appDescription: appDescriptionSchema,
    apiKey: apiKeySchema,
    fileName: fileNameSchema,
    framework: frameworkSchema,
    color: colorSchema,
    slug: slugSchema,
    ipAddress: ipAddressSchema,
    registration: registrationSchema,
    login: loginSchema,
    appCreation: appCreationSchema,
    profileUpdate: profileUpdateSchema,
    securitySettings: securitySettingsSchema,
    contactForm: contactFormSchema,
    teamInvitation: teamInvitationSchema,
    fileUpload: fileUploadSchema,
    comment: commentSchema,
    rating: ratingSchema,
    searchQuery: searchQuerySchema
  },
  sanitize: {
    html: sanitizeHtml,
    fileName: sanitizeFileName,
    slug: sanitizeSlug
  },
  security: {
    headers: securityHeaders,
    cors: corsConfig,
    rateLimits
  },
  utils: {
    validateInput,
    checkRateLimit
  }
};