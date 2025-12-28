/**
 * Create Content Use Case
 * Application service for creating educational content
 * @application Use Case
 */
import { Content } from '../../domain/entities/content';
import { ContentRepository } from '../../domain/repositories/content-repository';
import { UserRepository } from '../../domain/repositories/user-repository';

export interface CreateContentInput {
    creatorId: string;
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

export interface CreateContentOutput {
    success: boolean;
    contentId: string;
    content?: {
        id: string;
        title: string;
        url: string;
        type: string;
        creatorId: string;
        isVerifiedByCompany: boolean;
        tags: string[];
        createdAt: Date;
    };
    errors?: string[];
}

export class CreateContentUseCase {
    constructor(
        private readonly contentRepository: ContentRepository,
        private readonly userRepository: UserRepository
    ) { }

    /**
     * Execute content creation
     * @param input Use case input
     * @returns Content creation result
     */
    async execute(input: CreateContentInput): Promise<CreateContentOutput> {
        const errors: string[] = [];

        try {
            // Validate input
            if (!input.creatorId) {
                errors.push('Creator ID is required');
            }

            if (!input.url) {
                errors.push('URL is required');
            } else if (!this.isValidUrl(input.url)) {
                errors.push('Invalid URL format');
            }

            if (!input.title || input.title.trim().length === 0) {
                errors.push('Title is required');
            }

            if (!input.type || !['VIDEO', 'PLAYLIST'].includes(input.type)) {
                errors.push('Type must be either VIDEO or PLAYLIST');
            }

            if (errors.length > 0) {
                return {
                    success: false,
                    contentId: '',
                    errors,
                };
            }

            // Check if creator exists and is MEDIA role
            const creator = await this.userRepository.findById(input.creatorId);
            if (!creator) {
                errors.push('Creator not found');
                return {
                    success: false,
                    contentId: '',
                    errors,
                };
            }

            if (creator.role !== 'MEDIA') {
                errors.push('Only MEDIA users can create content');
                return {
                    success: false,
                    contentId: '',
                    errors,
                };
            }

            // Check if content with same URL already exists
            const existingContent = await this.contentRepository.findByUrl(input.url);
            if (existingContent) {
                errors.push('Content with this URL already exists');
                return {
                    success: false,
                    contentId: '',
                    errors,
                };
            }

            // Create content entity
            const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const content = new Content(
                contentId,
                input.creatorId,
                input.url,
                input.title.trim(),
                input.description?.trim() || '',
                input.type,
                false, // isVerifiedByCompany
                input.tags || [],
                input.metadata || {}
            );

            // Save content
            const savedContent = await this.contentRepository.save(content);

            return {
                success: true,
                contentId: savedContent.id,
                content: {
                    id: savedContent.id,
                    title: savedContent.title,
                    url: savedContent.url,
                    type: savedContent.type,
                    creatorId: savedContent.creatorId,
                    isVerifiedByCompany: savedContent.isVerifiedByCompany,
                    tags: savedContent.tags,
                    createdAt: savedContent.createdAt,
                },
            };

        } catch (error: any) {
            console.error('CreateContentUseCase error:', error);
            errors.push(error.message || 'Failed to create content');

            return {
                success: false,
                contentId: '',
                errors,
            };
        }
    }

    /**
     * Validate URL format
     * @param url URL to validate
     * @returns boolean indicating valid URL
     */
    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}