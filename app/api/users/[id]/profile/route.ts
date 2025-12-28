import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { userId: currentUserId } = await auth();
        const { id: targetUserId } = await params;

        // Allow users to view their own profile or any profile if they're authenticated
        if (!currentUserId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user from database
        const userResult = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [targetUserId]
        );

        if (userResult.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user = userResult[0];

        // Parse metadata
        const metadata = typeof user.metadata === 'string'
            ? JSON.parse(user.metadata)
            : user.metadata;

        // Get user stats
        const [contentProgress, jobApplications] = await Promise.all([
            db.query(
                'SELECT COUNT(*) as count FROM UserContentProgress WHERE userId = ? AND isCompleted = 1',
                [targetUserId]
            ),
            db.query(
                'SELECT COUNT(*) as count FROM JobApplication WHERE userId = ?',
                [targetUserId]
            ),
        ]);

        const stats = {
            contentCompleted: contentProgress[0]?.count || 0,
            jobsApplied: jobApplications[0]?.count || 0,
        };

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                trustScore: user.trustScore,
                isVerified: user.isVerified === 1,
                metadata,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                stats,
            },
        });

    } catch (error: any) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { userId: currentUserId } = await auth();
        const { id: targetUserId } = await params;
        const body = await request.json();

        // Check authorization
        if (!currentUserId || currentUserId !== targetUserId) {
            return NextResponse.json(
                { error: 'You can only update your own profile' },
                { status: 403 }
            );
        }

        // Validate update fields
        const allowedFields = ['metadata'];
        const updates: any = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Get current user data
        const userResult = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [targetUserId]
        );

        if (userResult.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const currentUser = userResult[0];

        // Handle metadata update
        if (updates.metadata) {
            const currentMetadata = typeof currentUser.metadata === 'string'
                ? JSON.parse(currentUser.metadata)
                : currentUser.metadata;

            // Merge metadata
            const updatedMetadata = { ...currentMetadata, ...updates.metadata };

            // Recalculate trust score
            const TrustEngine = (await import('@/core/domain/services/trust-engine')).TrustEngine;
            const trustEngine = new TrustEngine();

            const breakdown = {
                identityVerified: currentUser.isVerified === 1,
                profileComplete: trustEngine.isProfileComplete(updatedMetadata),
                skillVerified: Array.isArray(updatedMetadata.skills) && updatedMetadata.skills.length > 0,
            };

            const newTrustScore = trustEngine.calculateScore(breakdown);

            // Update database
            await db.query(
                `UPDATE User 
         SET metadata = ?, trustScore = ?, updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ?`,
                [
                    JSON.stringify(updatedMetadata),
                    newTrustScore,
                    targetUserId,
                ]
            );

            updates.trustScore = newTrustScore;
        }

        // Get updated user
        const updatedUserResult = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [targetUserId]
        );

        const updatedUser = updatedUserResult[0];

        return NextResponse.json({
            success: true,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                trustScore: updatedUser.trustScore,
                isVerified: updatedUser.isVerified === 1,
                metadata: typeof updatedUser.metadata === 'string'
                    ? JSON.parse(updatedUser.metadata)
                    : updatedUser.metadata,
                updatedAt: updatedUser.updatedAt,
            },
        });

    } catch (error: any) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}