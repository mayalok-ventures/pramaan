/**
 * Job Data Transfer Objects
 * @application DTO
 */
import { JobStatus } from '../../domain/entities/job';

// Request DTOs
export interface CreateJobRequest {
    title: string;
    description: string;
    minTrustScore?: number;
    skills?: string[];
    location?: string;
    salaryRange?: string;
    metadata?: {
        experience?: string;
        employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
        remote?: boolean;
        benefits?: string[];
        applicationDeadline?: string;
    };
}

export interface UpdateJobRequest {
    title?: string;
    description?: string;
    minTrustScore?: number;
    skills?: string[];
    location?: string;
    salaryRange?: string;
    status?: JobStatus;
    metadata?: Record<string, any>;
}

export interface ApplyJobRequest {
    jobId: string;
    userId: string;
    resumeText?: string;
}

export interface SearchJobsRequest {
    search?: string;
    location?: string;
    minTrustScore?: number;
    maxTrustScore?: number;
    remote?: boolean;
    skills?: string[];
    status?: JobStatus;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'trustScore' | 'salary' | 'relevance';
}

// Response DTOs
export interface JobResponse {
    id: string;
    title: string;
    description: string;
    summary: string;
    companyId: string;
    companyName?: string;
    minTrustScore: number;
    skills: string[];
    location: string;
    salaryRange: string;
    formattedSalary: string;
    status: JobStatus;
    metadata: Record<string, any>;
    isActive: boolean;
    isRemote: boolean;
    isExpired: boolean;
    applicationCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface JobWithEligibilityResponse extends JobResponse {
    userEligibility: {
        isEligible: boolean;
        userTrustScore: number;
        requiredTrustScore: number;
        pointsNeeded: number;
    };
    userApplication?: {
        applied: boolean;
        applicationId?: string;
        matchScore?: number;
        status?: string;
        appliedAt?: Date;
    };
}

export interface JobApplicationResponse {
    id: string;
    jobId: string;
    userId: string;
    resumeText?: string;
    matchScore: number;
    status: string;
    appliedAt: Date;
    user?: {
        id: string;
        email: string;
        trustScore: number;
        metadata: Record<string, any>;
    };
}

export interface JobStatsResponse {
    jobId: string;
    applicationCount: number;
    avgMatchScore: number;
    eligibleUsers: number;
    status: JobStatus;
    createdAt: Date;
}

export interface JobListResponse {
    jobs: JobResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface ApplyJobResponse {
    success: boolean;
    applicationId: string;
    matchScore: number;
    message: string;
    isEligible: boolean;
}

// Validation schemas
import { z } from 'zod';

export const createJobSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    minTrustScore: z.number().min(0).max(100).default(0),
    skills: z.array(z.string()).default([]),
    location: z.string().optional(),
    salaryRange: z.string().optional(),
    metadata: z.object({
        experience: z.string().optional(),
        employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
        remote: z.boolean().optional(),
        benefits: z.array(z.string()).optional(),
        applicationDeadline: z.string().datetime().optional(),
    }).optional(),
});

export const updateJobSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    minTrustScore: z.number().min(0).max(100).optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional(),
    salaryRange: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'CLOSED', 'DRAFT']).optional(),
    metadata: z.record(z.any()).optional(),
});

export const applyJobSchema = z.object({
    jobId: z.string(),
    userId: z.string(),
    resumeText: z.string().max(10000).optional(),
});

export const searchJobsSchema = z.object({
    search: z.string().optional(),
    location: z.string().optional(),
    minTrustScore: z.number().min(0).max(100).optional(),
    maxTrustScore: z.number().min(0).max(100).optional(),
    remote: z.boolean().optional(),
    skills: z.array(z.string()).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'CLOSED', 'DRAFT']).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sortBy: z.enum(['newest', 'trustScore', 'salary', 'relevance']).default('newest'),
});