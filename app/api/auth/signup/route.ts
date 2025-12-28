/**
 * POST /api/auth/signup
 * User registration endpoint
 * @api Public Route
 */
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { D1UserRepository } from '@/core/infrastructure/database/d1-user-repository';
import { TrustEngine } from '@/core/domain/services/trust-engine';

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request
        const body = await request.json();

        const { email, password, role = 'USER', metadata = {} } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (!['USER', 'MEDIA', 'BUSINESS'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role specified' },
                { status: 400 }
            );
        }

        // Create user in Clerk (authentication provider)
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.createUser({
            emailAddress: [email],
            password,
            publicMetadata: {
                role,
                trustScore: 0,
                isVerified: false
            }
        });

        // Create user in our database
        const userRepository = new D1UserRepository(db.getDB());
        const trustEngine = new TrustEngine();

        const user = {
            id: clerkUser.id,
            email,
            role,
            trustScore: 0,
            isVerified: false,
            metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Calculate initial trust score
        const breakdown = {
            identityVerified: false,
            profileComplete: trustEngine.isProfileComplete(metadata),
            skillVerified: false
        };

        user.trustScore = trustEngine.calculateScore(breakdown);

        // Save to database
        await userRepository.save(user as any);

        return NextResponse.json({
            success: true,
            user: {
                id: clerkUser.id,
                email,
                role,
                trustScore: user.trustScore,
                isVerified: false,
                metadata
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Signup error:', error);

        // Handle duplicate email
        if (error.message?.includes('already exists') || error.code === 'resource_conflict') {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Registration failed. Please try again.' },
            { status: 500 }
        );
    }
}
