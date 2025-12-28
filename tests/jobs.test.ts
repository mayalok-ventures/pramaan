/**
 * Jobs API Test Suite
 * Integration tests for job-related endpoints
 * @testing Vitest with Supertest
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/jobs/route';

// Mock external dependencies
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
    db: {
        getDB: vi.fn(),
        query: vi.fn(),
    },
}));

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

describe('Jobs API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/jobs', () => {
        it('should return 401 for unauthenticated requests', async () => {
            (auth as any).mockReturnValue({ userId: null });

            const { req, res } = createMocks({
                method: 'GET',
            });

            const response = await GET(req as any);
            expect(response.status).toBe(401);
        });

        it('should return jobs with pagination for authenticated users', async () => {
            (auth as any).mockReturnValue({ userId: 'user_123' });

            // Mock user trust score
            (db.query as any)
                .mockResolvedValueOnce([{ trustScore: 75 }]) // User query
                .mockResolvedValueOnce([ // Jobs query
                    {
                        id: 'job_1',
                        title: 'Test Job',
                        minTrustScore: 50,
                        skills: '["JavaScript", "React"]',
                        isActive: 1
                    }
                ])
                .mockResolvedValueOnce([{ total: 1 }]); // Count query

            const { req, res } = createMocks({
                method: 'GET',
                url: '/api/jobs?page=1&limit=10',
            });

            const response = await GET(req as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(1);
            expect(data.data[0].canApply).toBe(true); // 75 >= 50
            expect(data.pagination).toHaveProperty('total', 1);
        });

        it('should filter jobs by minimum trust score', async () => {
            (auth as any).mockReturnValue({ userId: 'user_123' });

            (db.query as any)
                .mockResolvedValueOnce([{ trustScore: 30 }]) // Low trust score
                .mockResolvedValueOnce([]) // No jobs matching
                .mockResolvedValueOnce([{ total: 0 }]);

            const { req, res } = createMocks({
                method: 'GET',
                url: '/api/jobs?minTrustScore=50',
            });

            const response = await GET(req as any);
            const data = await response.json();

            expect(data.data).toHaveLength(0);
        });
    });

    describe('POST /api/jobs', () => {
        it('should return 403 for non-BUSINESS users', async () => {
            (auth as any).mockReturnValue({
                userId: 'user_123',
                sessionClaims: { metadata: { role: 'USER' } }
            });

            const { req, res } = createMocks({
                method: 'POST',
                body: {
                    title: 'Test Job',
                    description: 'Test Description',
                    minTrustScore: 50,
                },
            });

            const response = await POST(req as any);
            expect(response.status).toBe(403);
        });

        it('should create job for BUSINESS users', async () => {
            (auth as any).mockReturnValue({
                userId: 'business_123',
                sessionClaims: { metadata: { role: 'BUSINESS' } }
            });

            (db.query as any).mockResolvedValue([{ insertId: 1 }]);

            const jobData = {
                title: 'Senior Developer',
                description: 'Looking for experienced developer',
                minTrustScore: 70,
                skills: ['React', 'TypeScript', 'Node.js'],
                location: 'Remote',
                salaryRange: '$100k-$150k',
            };

            const { req, res } = createMocks({
                method: 'POST',
                body: jobData,
            });

            const response = await POST(req as any);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data).toHaveProperty('jobId');
        });

        it('should validate job data', async () => {
            (auth as any).mockReturnValue({
                userId: 'business_123',
                sessionClaims: { metadata: { role: 'BUSINESS' } }
            });

            const invalidData = {
                title: '', // Empty title
                description: 'Test',
                minTrustScore: 150, // Out of range
            };

            const { req, res } = createMocks({
                method: 'POST',
                body: invalidData,
            });

            const response = await POST(req as any);
            expect(response.status).toBe(400);
        });
    });
});