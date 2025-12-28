/**
 * Content Data Transfer Objects
 * @application DTO
 */

// Request DTOs
export interface CreateContentRequest {
    url: string;
    title: string;
    description?: string;
    type: 'VIDEO' | 'PLAYLIST';
    tags?: string[];
    metadata?: {
        duration?: string;
        videoCount?: number;
        category?: string;
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        language?: string;
    };
}

export interface UpdateContentRequest {
    title?: string;
    description?: string;
    tags?: string[];
    isVerifiedByCompany?: boolean;
    metadata?: Record<string, any>;
}

export interface EnrollContentRequest {
    contentId: string;
    userId: string;
}

export interface UpdateProgressRequest {
    contentId: string;
    userId: string;
    progress: number;
    isCompleted?: boolean;
}

export interface SearchContentRequest {
    search?: string;
    type?: 'VIDEO' | 'PLAYLIST';
    category?: string;
    tags?: string[];
    verified?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'popular' | 'trending';
}

// Response DTOs
export interface ContentResponse {
    id: string;
    title: string;
    description: string;
    url: string;
    type: 'VIDEO' | 'PLAYLIST';
    creatorId: string;
    creatorEmail?: string;
    isVerifiedByCompany: boolean;
    tags: string[];
    metadata: Record<string, any>;
    youtubeId?: string;
    enrollmentCount: number;
    avgProgress: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ContentWithProgressResponse extends ContentResponse {
    userProgress?: {
        progress: number;
        isCompleted: boolean;
        lastAccessed: Date;
    };
}

export interface ContentStatsResponse {
    contentId: string;
    enrollmentCount: number;
    avgProgress: number;
    completionRate: number;
    totalDuration: number;
    verified: boolean;
}

export interface ContentListResponse {
    contents: ContentResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface EnrollContentResponse {
    success: boolean;
    enrollmentId: string;
    contentId: string;
    userId: string;
    enrolledAt: Date;
}

export interface UpdateProgressResponse {
    success: boolean;
    contentId: string;
    userId: string;
    progress: number;
    isCompleted: boolean;
    updatedAt: Date;
}

// Validation schemas
import { z } from 'zod';

export const createContentSchema = z.object({
    url: z.string().url(),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    type: z.enum(['VIDEO', 'PLAYLIST']),
    tags: z.array(z.string()).default([]),
    metadata: z.object({
        duration: z.string().optional(),
        videoCount: z.number().int().positive().optional(),
        category: z.string().optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        language: z.string().optional(),
    }).optional(),
});

export const updateContentSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional(),
    isVerifiedByCompany: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});

export const enrollContentSchema = z.object({
    contentId: z.string(),
    userId: z.string(),
});

export const updateProgressSchema = z.object({
    contentId: z.string(),
    userId: z.string(),
    progress: z.number().min(0).max(100),
    isCompleted: z.boolean().optional(),
});

export const searchContentSchema = z.object({
    search: z.string().optional(),
    type: z.enum(['VIDEO', 'PLAYLIST']).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    verified: z.boolean().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sortBy: z.enum(['newest', 'popular', 'trending']).default('newest'),
});