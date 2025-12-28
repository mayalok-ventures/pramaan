/**
 * User Data Transfer Objects
 * @application DTO
 */
import { UserRole } from '../../domain/entities/user';

// Request DTOs
export interface CreateUserRequest {
    email: string;
    password: string;
    role?: UserRole;
    metadata?: {
        name?: string;
        phone?: string;
        company?: string;
        skills?: string[];
    };
}

export interface UpdateUserRequest {
    email?: string;
    role?: UserRole;
    metadata?: Record<string, any>;
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    company?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    experience?: {
        title: string;
        company: string;
        duration: string;
    }[];
    education?: {
        degree: string;
        institution: string;
        year: string;
    }[];
    socialLinks?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
    };
}

export interface VerifyUserRequest {
    userId: string;
    isVerified: boolean;
}

// Response DTOs
export interface UserResponse {
    id: string;
    email: string;
    role: UserRole;
    trustScore: number;
    isVerified: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    trustLevel: string;
}

export interface UserProfileResponse extends UserResponse {
    stats: {
        contentCompleted: number;
        jobsApplied: number;
        trustRank: number;
        lastActive: Date;
    };
}

export interface UserStatsResponse {
    userId: string;
    trustScore: number;
    trustLevel: string;
    breakdown: {
        identityVerified: boolean;
        profileComplete: boolean;
        skillVerified: boolean;
        contentCompleted: number;
        positiveReviews: number;
        accountAge: number;
    };
    nextLevel?: {
        level: string;
        pointsNeeded: number;
        progress: number;
    };
    recommendations: string[];
}

// List DTOs
export interface UserListResponse {
    users: UserResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Validation schemas (using Zod)
import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['USER', 'MEDIA', 'BUSINESS']).default('USER'),
    metadata: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        skills: z.array(z.string()).optional(),
    }).optional(),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().regex(/^[+]?[\d\s\-()]+$/).optional(),
    company: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    bio: z.string().max(1000).optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string(),
    })).optional(),
    education: z.array(z.object({
        degree: z.string(),
        institution: z.string(),
        year: z.string(),
    })).optional(),
    socialLinks: z.object({
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
        twitter: z.string().url().optional(),
    }).optional(),
});

export const verifyUserSchema = z.object({
    userId: z.string(),
    isVerified: z.boolean(),
});