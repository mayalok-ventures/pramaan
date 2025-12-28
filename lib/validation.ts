/**
 * Validation Utilities
 * Centralized validation functions for the application
 * @utils
 */
import { z } from 'zod';

/**
 * Common validation schemas
 */
export const validationSchemas = {
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    url: z.string().url('Invalid URL'),
    trustScore: z.number().min(0).max(100, 'Trust score must be between 0-100'),
    userId: z.string().uuid('Invalid user ID'),
    jobId: z.string().regex(/^job_\w+$/, 'Invalid job ID format'),
    contentId: z.string().regex(/^content_\w+$/, 'Invalid content ID format'),
};

/**
 * User validation schemas
 */
export const userSchemas = {
    create: z.object({
        email: validationSchemas.email,
        password: validationSchemas.password,
        role: z.enum(['USER', 'MEDIA', 'BUSINESS']),
        metadata: z.record(z.any()).optional(),
    }),

    update: z.object({
        email: validationSchemas.email.optional(),
        role: z.enum(['USER', 'MEDIA', 'BUSINESS']).optional(),
        metadata: z.record(z.any()).optional(),
    }),

    profile: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        phone: validationSchemas.phone,
        company: z.string().optional(),
        skills: z.array(z.string()).optional(),
        digiLockerId: z.string().optional(),
    }),
};

/**
 * Job validation schemas
 */
export const jobSchemas = {
    create: z.object({
        title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
        description: z.string().min(1, 'Description is required').max(5000),
        minTrustScore: validationSchemas.trustScore.default(0),
        skills: z.array(z.string()).default([]),
        location: z.string().optional(),
        salaryRange: z.string().optional(),
        isActive: z.boolean().default(true),
    }),

    apply: z.object({
        resumeText: z.string().max(10000, 'Resume text too long'),
        coverLetter: z.string().max(2000, 'Cover letter too long').optional(),
    }),
};

/**
 * Content validation schemas
 */
export const contentSchemas = {
    create: z.object({
        url: validationSchemas.url,
        title: z.string().min(1, 'Title is required').max(200),
        description: z.string().optional(),
        type: z.enum(['VIDEO', 'PLAYLIST']),
        tags: z.array(z.string()).default([]),
        isVerifiedByCompany: z.boolean().default(false),
    }),

    progress: z.object({
        progress: z.number().min(0).max(100, 'Progress must be between 0-100'),
        isCompleted: z.boolean().optional(),
    }),
};

/**
 * Validation utility functions
 */
export const ValidationUtils = {
    /**
     * Validate data against schema
     * @param schema Zod schema
     * @param data Data to validate
     * @returns Validation result
     */
    validate<T>(schema: z.ZodSchema<T>, data: unknown): {
        success: boolean;
        data?: T;
        errors?: z.ZodError['errors'];
    } {
        try {
            const validatedData = schema.parse(data);
            return { success: true, data: validatedData };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return { success: false, errors: error.errors };
            }
            throw error;
        }
    },

    /**
     * Sanitize input string
     * @param input Input string
     * @returns Sanitized string
     */
    sanitizeString(input: string): string {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove HTML tags
            .replace(/[&<>"']/g, '') // Remove special characters
            .substring(0, 10000); // Limit length
    },

    /**
     * Sanitize object recursively
     * @param obj Object to sanitize
     * @returns Sanitized object
     */
    sanitizeObject<T extends Record<string, any>>(obj: T): T {
        const sanitized: Record<string, any> = {};

        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        });

        return sanitized as T;
    },

    /**
     * Validate YouTube URL
     * @param url YouTube URL
     * @returns boolean indicating validity
     */
    isValidYouTubeUrl(url: string): boolean {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+$/,
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+(&\S*)?$/,
        ];

        return patterns.some(pattern => pattern.test(url));
    },

    /**
     * Extract YouTube video ID from URL
     * @param url YouTube URL
     * @returns Video ID or null
     */
    extractYouTubeId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/,
            /youtube\.com\/v\/([\w-]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    },

    /**
     * Validate trust score factors
     * @param factors Trust score factors
     * @returns Validation result
     */
    validateTrustFactors(factors: any): { isValid: boolean; error?: string } {
        const requiredFields = ['identityVerified', 'profileComplete', 'skillVerified'];

        for (const field of requiredFields) {
            if (typeof factors[field] !== 'boolean') {
                return {
                    isValid: false,
                    error: `${field} must be a boolean`
                };
            }
        }

        return { isValid: true };
    },

    /**
     * Generate validation error messages
     * @param errors Zod errors
     * @returns User-friendly error messages
     */
    formatErrorMessages(errors: z.ZodError['errors']): string[] {
        return errors.map(error => {
            const field = error.path.join('.');
            return `${field ? `${field}: ` : ''}${error.message}`;
        });
    },

    /**
     * Validate array of skills
     * @param skills Skills array
     * @returns Validation result
     */
    validateSkills(skills: any[]): { isValid: boolean; error?: string } {
        if (!Array.isArray(skills)) {
            return { isValid: false, error: 'Skills must be an array' };
        }

        if (skills.length > 50) {
            return { isValid: false, error: 'Maximum 50 skills allowed' };
        }

        for (const skill of skills) {
            if (typeof skill !== 'string') {
                return { isValid: false, error: 'Each skill must be a string' };
            }

            if (skill.length > 100) {
                return { isValid: false, error: 'Skill name too long' };
            }
        }

        return { isValid: true };
    },
};

/**
 * Custom validation decorators
 */
export function Validate(schema: z.ZodSchema) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const result = ValidationUtils.validate(schema, args[0]);

            if (!result.success) {
                throw new Error(
                    `Validation failed: ${ValidationUtils.formatErrorMessages(result.errors!).join(', ')}`
                );
            }

            return originalMethod.apply(this, [result.data, ...args.slice(1)]);
        };

        return descriptor;
    };
}

/**
 * Async validation middleware for API routes
 */
export const validateRequest = (schema: z.ZodSchema) => {
    return async (request: Request) => {
        try {
            const body = await request.json();
            return schema.parse(body);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Request validation failed: ${ValidationUtils.formatErrorMessages(error.errors).join(', ')}`
                );
            }
            throw error;
        }
    };
};