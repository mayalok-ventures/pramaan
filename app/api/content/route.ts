import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Validation schema for creating content
const createContentSchema = z.object({
    url: z.string().url(),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    type: z.enum(['VIDEO', 'PLAYLIST']),
    tags: z.array(z.string()).default([]),
    duration: z.string().optional(),
    videoCount: z.number().optional(),
});

// Validation schema for updating content
const updateContentSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional(),
    isVerifiedByCompany: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        const { searchParams } = new URL(request.url);

        // Build query
        let query = `
      SELECT c.*, u.email as creatorEmail, 
             COUNT(ucp.userId) as enrollmentCount,
             AVG(ucp.progress) as avgProgress
      FROM Content c
      LEFT JOIN User u ON c.creatorId = u.id
      LEFT JOIN UserContentProgress ucp ON c.id = ucp.contentId
      WHERE 1=1
    `;
        const params: any[] = [];

        // Apply filters
        const type = searchParams.get('type');
        if (type) {
            query += ' AND c.type = ?';
            params.push(type);
        }

        const search = searchParams.get('search');
        if (search) {
            query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const category = searchParams.get('category');
        if (category && category !== 'all') {
            query += ' AND c.tags LIKE ?';
            params.push(`%${category}%`);
        }

        const verified = searchParams.get('verified');
        if (verified === 'true') {
            query += ' AND c.isVerifiedByCompany = 1';
        }

        // Group and order
        query += ' GROUP BY c.id ORDER BY c.createdAt DESC';

        // Apply pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Execute query
        const content = await db.query(query, params);

        // Format response
        const formattedContent = content.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            url: item.url,
            type: item.type,
            creatorId: item.creatorId,
            creatorEmail: item.creatorEmail,
            isVerifiedByCompany: item.isVerifiedByCompany === 1,
            tags: JSON.parse(item.tags || '[]'),
            duration: item.duration,
            videoCount: item.videoCount,
            enrollmentCount: item.enrollmentCount || 0,
            avgProgress: item.avgProgress || 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        // Get total count for pagination
        const countQuery = query
            .replace('SELECT c.*, u.email as creatorEmail, COUNT(ucp.userId) as enrollmentCount, AVG(ucp.progress) as avgProgress', 'SELECT COUNT(DISTINCT c.id) as total')
            .replace('GROUP BY c.id ORDER BY c.createdAt DESC LIMIT ? OFFSET ?', '');

        const countParams = params.slice(0, -2); // Remove LIMIT and OFFSET params
        const countResult = await db.query(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        return NextResponse.json({
            success: true,
            data: formattedContent,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error: any) {
        console.error('Get content error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch content' },
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

        // Check if user is MEDIA role
        const userRole = (sessionClaims as { metadata?: { role?: string } })?.metadata?.role as string;
        if (userRole !== 'MEDIA') {
            return NextResponse.json(
                { error: 'Only MEDIA users can create content' },
                { status: 403 }
            );
        }

        // Parse and validate request
        const body = await request.json();
        const validatedData = createContentSchema.parse(body);

        // Extract YouTube video ID if URL is YouTube
        let youtubeId = null;
        if (validatedData.url.includes('youtube.com') || validatedData.url.includes('youtu.be')) {
            const match = validatedData.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            youtubeId = match ? match[1] : null;
        }

        // Create content in database
        const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db.query(
            `INSERT INTO Content (
        id, creatorId, url, title, description, type, tags, 
        duration, videoCount, isVerifiedByCompany
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                contentId,
                userId,
                validatedData.url,
                validatedData.title,
                validatedData.description || null,
                validatedData.type,
                JSON.stringify(validatedData.tags),
                validatedData.duration || null,
                validatedData.videoCount || null,
                false, // Default to not verified by company
            ]
        );

        // Get created content
        const contentResult = await db.query(
            'SELECT * FROM Content WHERE id = ?',
            [contentId]
        );

        const content = contentResult[0];

        return NextResponse.json({
            success: true,
            message: 'Content created successfully',
            data: {
                id: content.id,
                title: content.title,
                description: content.description,
                url: content.url,
                type: content.type,
                creatorId: content.creatorId,
                isVerifiedByCompany: content.isVerifiedByCompany === 1,
                tags: JSON.parse(content.tags || '[]'),
                youtubeId,
                createdAt: content.createdAt,
            },
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create content error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create content' },
            { status: 500 }
        );
    }
}

// Endpoint for enrolling in content
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const contentId = searchParams.get('contentId');
        const action = searchParams.get('action');

        if (!contentId || !action) {
            return NextResponse.json(
                { error: 'Missing contentId or action parameter' },
                { status: 400 }
            );
        }

        if (action === 'enroll') {
            // Check if already enrolled
            const existingProgress = await db.query(
                'SELECT * FROM UserContentProgress WHERE userId = ? AND contentId = ?',
                [userId, contentId]
            );

            if (existingProgress.length > 0) {
                return NextResponse.json(
                    { error: 'Already enrolled in this content' },
                    { status: 409 }
                );
            }

            // Create enrollment
            await db.query(
                `INSERT INTO UserContentProgress (userId, contentId, progress, isCompleted) 
         VALUES (?, ?, 0, FALSE)`,
                [userId, contentId]
            );

            return NextResponse.json({
                success: true,
                message: 'Successfully enrolled in content',
            });

        } else if (action === 'progress') {
            const body = await request.json();
            const { progress, isCompleted } = body;

            if (typeof progress !== 'number' || progress < 0 || progress > 100) {
                return NextResponse.json(
                    { error: 'Invalid progress value' },
                    { status: 400 }
                );
            }

            // Update progress
            await db.query(
                `UPDATE UserContentProgress 
         SET progress = ?, isCompleted = ?, lastAccessed = CURRENT_TIMESTAMP 
         WHERE userId = ? AND contentId = ?`,
                [
                    progress,
                    isCompleted ? 1 : 0,
                    userId,
                    contentId,
                ]
            );

            return NextResponse.json({
                success: true,
                message: 'Progress updated successfully',
            });

        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error('Content enrollment error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}