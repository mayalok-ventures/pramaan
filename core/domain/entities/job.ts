/**
 * Job Entity
 * Represents a job posting in the marketplace
 * @domain Entity
 */
export type JobStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED' | 'DRAFT';

export interface JobMetadata {
    experience?: string;
    employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
    remote?: boolean;
    benefits?: string[];
    applicationDeadline?: Date;
}

export class Job {
    constructor(
        public readonly id: string,
        public companyId: string,
        public title: string,
        public description: string,
        public minTrustScore: number = 0,
        public skills: string[] = [],
        public location: string = '',
        public salaryRange: string = '',
        public status: JobStatus = 'ACTIVE',
        public metadata: JobMetadata = {},
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
            throw new Error('Job must have an ID');
        }

        if (!this.companyId) {
            throw new Error('Job must have a company ID');
        }

        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Title is required');
        }

        if (!this.description || this.description.trim().length === 0) {
            throw new Error('Description is required');
        }

        if (this.minTrustScore < 0 || this.minTrustScore > 100) {
            throw new Error('Minimum trust score must be between 0 and 100');
        }

        if (!['ACTIVE', 'INACTIVE', 'CLOSED', 'DRAFT'].includes(this.status)) {
            throw new Error(`Invalid job status: ${this.status}`);
        }
    }

    /**
     * Update job information
     * @param updates Partial job data to update
     * @returns Updated Job instance
     */
    update(updates: Partial<Pick<Job,
        'title' | 'description' | 'minTrustScore' | 'skills' |
        'location' | 'salaryRange' | 'status' | 'metadata'
    >>): Job {
        if (updates.title !== undefined) {
            this.title = updates.title;
        }

        if (updates.description !== undefined) {
            this.description = updates.description;
        }

        if (updates.minTrustScore !== undefined) {
            this.minTrustScore = updates.minTrustScore;
        }

        if (updates.skills !== undefined) {
            this.skills = updates.skills;
        }

        if (updates.location !== undefined) {
            this.location = updates.location;
        }

        if (updates.salaryRange !== undefined) {
            this.salaryRange = updates.salaryRange;
        }

        if (updates.status !== undefined) {
            this.status = updates.status;
        }

        if (updates.metadata !== undefined) {
            this.metadata = { ...this.metadata, ...updates.metadata };
        }

        this.updatedAt = new Date();
        this.validate();

        return this;
    }

    /**
     * Update job status
     * @param status New job status
     * @returns Updated Job instance
     */
    updateStatus(status: JobStatus): Job {
        this.status = status;
        this.updatedAt = new Date();

        return this;
    }

    /**
     * Check if job is active
     * @returns boolean indicating job is active
     */
    isActive(): boolean {
        return this.status === 'ACTIVE';
    }

    /**
     * Check if job is remote
     * @returns boolean indicating remote job
     */
    isRemote(): boolean {
        return this.metadata.remote === true;
    }

    /**
     * Check if job matches user's trust score
     * @param userTrustScore User's trust score
     * @returns boolean indicating eligibility
     */
    isEligibleForUser(userTrustScore: number): boolean {
        return userTrustScore >= this.minTrustScore;
    }

    /**
     * Check if job matches search query
     * @param query Search query
     * @returns boolean indicating match
     */
    matchesSearch(query: string): boolean {
        const searchTerms = query.toLowerCase().split(' ');

        const searchableText = [
            this.title,
            this.description,
            this.location,
            ...this.skills,
            this.metadata.experience || '',
            this.metadata.employmentType || '',
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
    }

    /**
     * Check if job has expired
     * @returns boolean indicating expired job
     */
    isExpired(): boolean {
        if (!this.metadata.applicationDeadline) {
            return false;
        }

        return new Date() > this.metadata.applicationDeadline;
    }

    /**
     * Get job summary
     * @param maxLength Maximum length of summary
     * @returns Truncated description
     */
    getSummary(maxLength: number = 200): string {
        if (this.description.length <= maxLength) {
            return this.description;
        }

        return this.description.substring(0, maxLength).trim() + '...';
    }

    /**
     * Get formatted salary range
     * @returns Formatted salary string
     */
    getFormattedSalary(): string {
        if (!this.salaryRange) return 'Not specified';

        // Add currency symbol if missing
        if (!this.salaryRange.includes('$') && !this.salaryRange.includes('€') && !this.salaryRange.includes('₹')) {
            return `$${this.salaryRange}`;
        }

        return this.salaryRange;
    }

    /**
     * Convert to plain object for serialization
     * @returns Plain object representation
     */
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            companyId: this.companyId,
            title: this.title,
            description: this.description,
            summary: this.getSummary(),
            minTrustScore: this.minTrustScore,
            skills: this.skills,
            location: this.location,
            salaryRange: this.salaryRange,
            formattedSalary: this.getFormattedSalary(),
            status: this.status,
            metadata: this.metadata,
            isActive: this.isActive(),
            isRemote: this.isRemote(),
            isExpired: this.isExpired(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }
}