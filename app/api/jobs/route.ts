/**
 * Jobs API Routes
 * GET /api/jobs - List jobs
 * POST /api/jobs - Create job (BUSINESS only)
 * @api Protected Route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const jobSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    minTrustScore: z.number().min(0).max(100).default(0),
    skills: z.array(z.string()).default([]),
    location: z.string().optional(),
    salaryRange: z.string().optional(),
    isActive: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const minTrustScore = searchParams.get('minTrustScore');
        const location = searchParams.get('location');

        // Build query with pagination
        let query = 'SELECT * FROM Job WHERE isActive = 1';
        const params: any[] = [];

        if (minTrustScore) {
            query += ' AND minTrustScore <= ?';
            params.push(parseInt(minTrustScore));
        }

        if (location) {
            query += ' AND location LIKE ?';
            params.push(`%${location}%`);
        }

        query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Get user's trust score
        const userResult = await db.query(
            'SELECT trustScore FROM User WHERE id = ?',
            [userId]
        );

        const userTrustScore = userResult[0]?.trustScore || 0;

        // Execute query
        const jobs = await db.query(query, params);

        // Filter jobs user can apply to based on trust score
        const enhancedJobs = jobs.map((job: any) => ({
            ...job,
            canApply: userTrustScore >= job.minTrustScore,
            skills: JSON.parse(job.skills || '[]')
        }));

        // Get total count for pagination
        const countQuery = 'SELECT COUNT(*) as total FROM Job WHERE isActive = 1';
        const countResult = await db.query(countQuery);
        const total = countResult[0]?.total || 0;

        return NextResponse.json({
            success: true,
            data: enhancedJobs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('GET jobs error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, sessionClaims } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is BUSINESS role
        const userRole = (sessionClaims as { metadata?: { role?: string } })?.metadata?.role as string;
        if (userRole !== 'BUSINESS') {
            return NextResponse.json(
                { error: 'Only BUSINESS users can create jobs' },
                { status: 403 }
            );
        }

        // Parse and validate request
        const body = await request.json();
        const validatedData = jobSchema.parse(body);

        // Create job in database
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.execute(
            `INSERT INTO Job (
        id, companyId, title, description, minTrustScore,
        skills, location, salaryRange, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                jobId,
                userId,
                validatedData.title,
                validatedData.description,
                validatedData.minTrustScore,
                JSON.stringify(validatedData.skills),
                validatedData.location || null,
                validatedData.salaryRange || null,
                validatedData.isActive ? 1 : 0
            ]
        );

        return NextResponse.json({
            success: true,
            message: 'Job created successfully',
            jobId
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST jobs error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create job' },
            { status: 500 }
        );
    }
}