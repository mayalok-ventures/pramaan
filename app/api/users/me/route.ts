import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user from database
        const userResult = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [userId]
        );

        if (userResult.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user = userResult[0];

        // Parse metadata if it's a string
        const metadata = typeof user.metadata === 'string'
            ? JSON.parse(user.metadata)
            : user.metadata;

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
            },
        });

    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}

// Endpoint for updating user profile
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Only allow updating metadata for now
        const { metadata } = body;

        if (!metadata || typeof metadata !== 'object') {
            return NextResponse.json(
                { error: 'Invalid metadata provided' },
                { status: 400 }
            );
        }

        // Get current user data
        const userResult = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [userId]
        );

        if (userResult.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const currentUser = userResult[0];
        const currentMetadata = typeof currentUser.metadata === 'string'
            ? JSON.parse(currentUser.metadata)
            : currentUser.metadata;

        // Merge metadata
        const updatedMetadata = { ...currentMetadata, ...metadata };

        // Recalculate trust score if needed
        let trustScore = currentUser.trustScore;
        if (metadata.name || metadata.phone || metadata.skills) {
            const TrustEngine = (await import('@/core/domain/services/trust-engine')).TrustEngine;
            const trustEngine = new TrustEngine();

            const breakdown = {
                identityVerified: currentUser.isVerified === 1,
                profileComplete: trustEngine.isProfileComplete(updatedMetadata),
                skillVerified: Array.isArray(updatedMetadata.skills) && updatedMetadata.skills.length > 0,
            };

            trustScore = trustEngine.calculateScore(breakdown);
        }

        // Update user in database
        await db.query(
            `UPDATE User 
       SET metadata = ?, trustScore = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [
                JSON.stringify(updatedMetadata),
                trustScore,
                userId,
            ]
        );

        // Get updated user
        const updatedUserResult = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [userId]
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
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user profile' },
            { status: 500 }
        );
    }
}