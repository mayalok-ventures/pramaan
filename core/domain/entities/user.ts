/**
 * User Entity
 * Core business entity representing a PRAMAAN user
 * @domain Entity
 */
export type UserRole = 'USER' | 'MEDIA' | 'BUSINESS';

export interface UserMetadata {
    name?: string;
    phone?: string;
    company?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    experience?: {
        title: string;
        company: string;
        duration: string;
    }[];
    education?: {
        degree: string;
        institution: string;
        year: string;
    }[];
    digiLockerId?: string;
    socialLinks?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
    };
}

export class User {
    constructor(
        public readonly id: string,
        public email: string,
        public role: UserRole = 'USER',
        public trustScore: number = 0,
        public isVerified: boolean = false,
        public metadata: UserMetadata = {},
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
            throw new Error('User must have an ID');
        }

        if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            throw new Error('Invalid email address');
        }

        if (this.trustScore < 0 || this.trustScore > 100) {
            throw new Error('Trust score must be between 0 and 100');
        }

        if (!['USER', 'MEDIA', 'BUSINESS'].includes(this.role)) {
            throw new Error(`Invalid role: ${this.role}`);
        }
    }

    /**
     * Update user profile information
     * @param updates Partial user data to update
     * @returns Updated User instance
     */
    updateProfile(updates: Partial<Pick<User, 'metadata' | 'role'>>): User {
        if (updates.metadata) {
            this.metadata = { ...this.metadata, ...updates.metadata };
        }

        if (updates.role && this.isValidRole(updates.role)) {
            this.role = updates.role;
        }

        this.updatedAt = new Date();
        this.validate();

        return this;
    }

    /**
     * Update verification status and recalculate trust score
     * @param isVerified New verification status
     * @param trustEngine Trust engine for score calculation
     * @returns Updated User instance
     */
    updateVerification(
        isVerified: boolean,
        trustEngine: { calculateScore: (factors: any) => number }
    ): User {
        this.isVerified = isVerified;

        // Recalculate trust score
        const factors = {
            identityVerified: this.isVerified,
            profileComplete: this.isProfileComplete(),
            skillVerified: this.hasVerifiedSkills(),
        };

        this.trustScore = trustEngine.calculateScore(factors);
        this.updatedAt = new Date();

        return this;
    }

    /**
     * Check if profile is complete
     * @returns boolean indicating profile completeness
     */
    isProfileComplete(): boolean {
        return !!(this.metadata.name && this.metadata.phone);
    }

    /**
     * Check if user has verified skills
     * @returns boolean indicating skill verification
     */
    hasVerifiedSkills(): boolean {
        return Array.isArray(this.metadata.skills) && this.metadata.skills.length > 0;
    }

    /**
     * Check if user can access content based on role
     * @param contentType Type of content being accessed
     * @returns boolean indicating access permission
     */
    canAccessContent(contentType: 'VIDEO' | 'PLAYLIST'): boolean {
        // All roles can access content
        return true;
    }

    /**
     * Check if user can create content
     * @returns boolean indicating permission
     */
    canCreateContent(): boolean {
        return this.role === 'MEDIA';
    }

    /**
     * Check if user can create job posts
     * @returns boolean indicating permission
     */
    canCreateJobs(): boolean {
        return this.role === 'BUSINESS';
    }

    /**
     * Check if user can apply to a job based on trust score
     * @param minTrustScore Minimum required trust score
     * @returns boolean indicating eligibility
     */
    canApplyToJob(minTrustScore: number): boolean {
        return this.trustScore >= minTrustScore;
    }

    /**
     * Get user's trust level
     * @returns Trust level string
     */
    getTrustLevel(): string {
        if (this.trustScore >= 80) return 'Premium';
        if (this.trustScore >= 60) return 'Verified';
        if (this.trustScore >= 40) return 'Basic';
        return 'New';
    }

    /**
     * Validate role
     * @param role Role to validate
     * @returns boolean indicating valid role
     */
    private isValidRole(role: string): role is UserRole {
        return ['USER', 'MEDIA', 'BUSINESS'].includes(role);
    }

    /**
     * Convert to plain object for serialization
     * @returns Plain object representation
     */
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            email: this.email,
            role: this.role,
            trustScore: this.trustScore,
            isVerified: this.isVerified,
            metadata: this.metadata,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            trustLevel: this.getTrustLevel(),
        };
    }
}