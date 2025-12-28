import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { TrustEngine } from '@/core/domain/services/trust-engine';

// Validation schema
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request
        const body = await request.json();
        const validatedData = loginSchema.parse(body);

        const { email } = validatedData;

        // Get Clerk client
        const clerk = await clerkClient();

        // Look up user by email in Clerk
        const usersResponse = await clerk.users.getUserList({
            emailAddress: [email],
        });

        if (usersResponse.data.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const clerkUser = usersResponse.data[0];

        // Get user from our database
        const userResult = await db.query(
            'SELECT * FROM User WHERE email = ?',
            [email]
        );

        let user = userResult[0];

        // If user doesn't exist in our DB, create a record
        if (!user) {
            const trustEngine = new TrustEngine();
            const metadata = {
                name: clerkUser.firstName || '',
                email: email,
            };

            const breakdown = {
                identityVerified: false,
                profileComplete: trustEngine.isProfileComplete(metadata),
                skillVerified: false,
            };

            const initialTrustScore = trustEngine.calculateScore(breakdown);

            await db.query(
                `INSERT INTO User (
          id, email, role, trustScore, isVerified, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    clerkUser.id,
                    email,
                    clerkUser.publicMetadata?.role || 'USER',
                    initialTrustScore,
                    false,
                    JSON.stringify(metadata),
                ]
            );

            user = {
                id: clerkUser.id,
                email,
                role: clerkUser.publicMetadata?.role || 'USER',
                trustScore: initialTrustScore,
                isVerified: false,
                metadata,
            };
        }

        // Update last login time
        await db.query(
            'UPDATE User SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [clerkUser.id]
        );

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                trustScore: user.trustScore,
                isVerified: user.isVerified,
                metadata: typeof user.metadata === 'string'
                    ? JSON.parse(user.metadata)
                    : user.metadata,
            },
        });

    } catch (error: any) {
        console.error('Login error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Login failed. Please try again.' },
            { status: 500 }
        );
    }
}
