/**
 * Content Entity
 * Represents educational content in the knowledge repository
 * @domain Entity
 */
export type ContentType = 'VIDEO' | 'PLAYLIST';

export interface ContentMetadata {
    duration?: string;
    videoCount?: number;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    transcript?: string;
}

export class Content {
    constructor(
        public readonly id: string,
        public creatorId: string,
        public url: string,
        public title: string,
        public description: string,
        public type: ContentType,
        public isVerifiedByCompany: boolean = false,
        public tags: string[] = [],
        public metadata: ContentMetadata = {},
        public readonly createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) {
        this.validate();
    }

    /**
     * Validate entity invariants
     * @throws {Error} if validation fails
     */
    private validate(): void {
        if (!this.id) {
            throw new Error('Content must have an ID');
        }

        if (!this.creatorId) {
            throw new Error('Content must have a creator ID');
        }

        if (!this.url || !this.isValidUrl(this.url)) {
            throw new Error('Invalid URL');
        }

        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Title is required');
        }

        if (!['VIDEO', 'PLAYLIST'].includes(this.type)) {
            throw new Error(`Invalid content type: ${this.type}`);
        }
    }

    /**
     * Update content information
     * @param updates Partial content data to update
     * @returns Updated Content instance
     */
    update(updates: Partial<Pick<Content, 'title' | 'description' | 'tags' | 'metadata'>>): Content {
        if (updates.title !== undefined) {
            this.title = updates.title;
        }

        if (updates.description !== undefined) {
            this.description = updates.description;
        }

        if (updates.tags !== undefined) {
            this.tags = updates.tags;
        }

        if (updates.metadata !== undefined) {
            this.metadata = { ...this.metadata, ...updates.metadata };
        }

        this.updatedAt = new Date();
        this.validate();

        return this;
    }

    /**
     * Update verification status
     * @param isVerified New verification status
     * @returns Updated Content instance
     */
    updateVerification(isVerified: boolean): Content {
        this.isVerifiedByCompany = isVerified;
        this.updatedAt = new Date();

        return this;
    }

    /**
     * Check if content is a YouTube video
     * @returns boolean indicating if content is from YouTube
     */
    isYouTubeContent(): boolean {
        return this.url.includes('youtube.com') || this.url.includes('youtu.be');
    }

    /**
     * Extract YouTube video ID
     * @returns YouTube video ID or null
     */
    getYouTubeId(): string | null {
        if (!this.isYouTubeContent()) return null;

        const patterns = [
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
            /youtube\.com\/playlist\?list=([^"&?\/\s]{34})/,
        ];

        for (const pattern of patterns) {
            const match = this.url.match(pattern);
            if (match) return match[1];
        }

        return null;
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

    /**
     * Get content summary
     * @param maxLength Maximum length of summary
     * @returns Truncated description
     */
    getSummary(maxLength: number = 150): string {
        if (this.description.length <= maxLength) {
            return this.description;
        }

        return this.description.substring(0, maxLength).trim() + '...';
    }

    /**
     * Check if content matches search query
     * @param query Search query
     * @returns boolean indicating match
     */
    matchesSearch(query: string): boolean {
        const searchTerms = query.toLowerCase().split(' ');

        const searchableText = [
            this.title,
            this.description,
            ...this.tags,
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
    }

    /**
     * Convert to plain object for serialization
     * @returns Plain object representation
     */
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            creatorId: this.creatorId,
            url: this.url,
            title: this.title,
            description: this.description,
            type: this.type,
            isVerifiedByCompany: this.isVerifiedByCompany,
            tags: this.tags,
            metadata: this.metadata,
            youtubeId: this.getYouTubeId(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }
}