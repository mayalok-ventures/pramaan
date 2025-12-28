/**
 * POST /api/jobs/:id/apply
 * Apply for a job with resume parsing
 * @api Protected Route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { parseResume } from '@/lib/llm';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        const { id: jobId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Validate job exists and is active
        const jobResult = await db.query(
            'SELECT * FROM Job WHERE id = ? AND isActive = 1',
            [jobId]
        );

        if (jobResult.length === 0) {
            return NextResponse.json(
                { error: 'Job not found or inactive' },
                { status: 404 }
            );
        }

        const job = jobResult[0];

        // Get user trust score
        const userResult = await db.query(
            'SELECT trustScore, metadata FROM User WHERE id = ?',
            [userId]
        );

        if (userResult.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user = userResult[0];
        const userTrustScore = user.trustScore || 0;

        // Check trust score requirement
        if (userTrustScore < job.minTrustScore) {
            return NextResponse.json(
                {
                    error: 'Trust score requirement not met',
                    required: job.minTrustScore,
                    current: userTrustScore
                },
                { status: 403 }
            );
        }

        // Check for existing application
        const existingApp = await db.query(
            'SELECT * FROM JobApplication WHERE jobId = ? AND userId = ?',
            [jobId, userId]
        );

        if (existingApp.length > 0) {
            return NextResponse.json(
                { error: 'Already applied to this job' },
                { status: 409 }
            );
        }

        // Parse request body for resume text
        const body = await request.json();
        const resumeText = body.resumeText || '';
        const skills = JSON.parse(job.skills || '[]');

        // Parse resume and calculate match score
        let matchScore = 0;
        let parsedResume = null;

        if (resumeText.trim().length > 0) {
            try {
                parsedResume = await parseResume(resumeText);

                // Calculate match based on job skills
                if (parsedResume && parsedResume.parsedData?.skills && skills.length > 0) {
                    const userSkills = new Set(parsedResume.parsedData.skills.map((s: string) => s.toLowerCase()));
                    const jobSkills = new Set(skills.map((s: string) => s.toLowerCase()));

                    const matchedSkills = Array.from(userSkills).filter(skill => jobSkills.has(skill));
                    const intersection = new Set(matchedSkills);

                    matchScore = Math.round((intersection.size / jobSkills.size) * 100);
                }
            } catch (llmError) {
                console.warn('LLM parsing failed, using fallback scoring:', llmError);
                // Fallback: Use trust score as base match score
                matchScore = Math.min(userTrustScore, 85);
            }
        }

        // Create application
        const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db.query(
            `INSERT INTO JobApplication (
        id, jobId, userId, resumeText, matchScore, status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                applicationId,
                jobId,
                userId,
                resumeText.substring(0, 10000), // Limit length
                matchScore,
                'PENDING'
            ]
        );

        return NextResponse.json({
            success: true,
            applicationId,
            matchScore,
            message: 'Application submitted successfully'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Job application error:', error);

        return NextResponse.json(
            { error: 'Failed to submit application' },
            { status: 500 }
        );
    }
}