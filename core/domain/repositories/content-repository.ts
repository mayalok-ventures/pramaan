/**
 * Content Repository Interface
 * Port for content data access operations
 * @domain Repository (Port)
 */
import { Content, ContentType } from '../entities/content';

export interface FindContentCriteria {
    creatorId?: string;
    type?: ContentType;
    isVerifiedByCompany?: boolean;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
}

export interface UpdateContentData {
    title?: string;
    description?: string;
    tags?: string[];
    isVerifiedByCompany?: boolean;
    metadata?: any;
}

export interface ContentRepository {
    // Basic CRUD operations
    findById(id: string): Promise<Content | null>;
    findByUrl(url: string): Promise<Content | null>;
    save(content: Content): Promise<Content>;
    update(id: string, data: UpdateContentData): Promise<Content | null>;
    delete(id: string): Promise<boolean>;

    // Batch operations
    findByIds(ids: string[]): Promise<Content[]>;
    findByCriteria(criteria: FindContentCriteria): Promise<{
        contents: Content[];
        total: number;
    }>;

    // Business-specific queries
    findByCreator(creatorId: string): Promise<Content[]>;
    findByType(type: ContentType): Promise<Content[]>;
    findVerifiedContent(): Promise<Content[]>;
    findByTags(tags: string[]): Promise<Content[]>;

    // Statistics
    getStats(): Promise<{
        totalContent: number;
        contentByType: Record<ContentType, number>;
        verifiedCount: number;
        averageEnrollment: number;
    }>;

    // Content-specific operations
    updateVerification(id: string, isVerified: boolean): Promise<Content | null>;
    incrementEnrollmentCount(id: string): Promise<Content | null>;

    // Existence checks
    existsById(id: string): Promise<boolean>;
    existsByUrl(url: string): Promise<boolean>;
}