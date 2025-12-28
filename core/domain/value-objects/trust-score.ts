/**
 * Trust Score Value Object
 * Immutable value object representing a trust score with validation
 * @domain Value Object
 */
export class TrustScore {
    private readonly score: number;
    private readonly MAX_SCORE = 100;
    private readonly MIN_SCORE = 0;

    /**
     * Create a new TrustScore instance
     * @param score Numeric trust score (0-100)
     * @throws {Error} if score is invalid
     */
    constructor(score: number) {
        if (!this.isValid(score)) {
            throw new Error(`Trust score must be between ${this.MIN_SCORE} and ${this.MAX_SCORE}`);
        }

        this.score = Math.round(score);
        Object.freeze(this); // Make immutable
    }

    /**
     * Validate trust score
     * @param score Score to validate
     * @returns boolean indicating validity
     * @timeComplexity O(1)
     */
    private isValid(score: number): boolean {
        return Number.isFinite(score) &&
            score >= this.MIN_SCORE &&
            score <= this.MAX_SCORE;
    }

    /**
     * Get numeric value of trust score
     * @returns Trust score number
     */
    get value(): number {
        return this.score;
    }

    /**
     * Get trust level category
     * @returns Trust level category
     */
    get level(): TrustLevel {
        if (this.score >= 90) return TrustLevel.EXCELLENT;
        if (this.score >= 75) return TrustLevel.HIGH;
        if (this.score >= 50) return TrustLevel.MEDIUM;
        if (this.score >= 25) return TrustLevel.LOW;
        return TrustLevel.VERY_LOW;
    }

    /**
     * Check if trust score meets minimum requirement
     * @param minimum Minimum required score
     * @returns boolean indicating if requirement is met
     */
    meetsRequirement(minimum: number): boolean {
        return this.score >= minimum;
    }

    /**
     * Calculate percentage difference from another score
     * @param otherScore Other trust score to compare
     * @returns Percentage difference
     */
    differenceFrom(otherScore: TrustScore): number {
        return Math.abs(this.score - otherScore.value);
    }

    /**
     * Create a new TrustScore with increment
     * @param increment Amount to increase score by
     * @returns New TrustScore instance
     */
    increment(increment: number): TrustScore {
        const newScore = Math.min(this.score + increment, this.MAX_SCORE);
        return new TrustScore(newScore);
    }

    /**
     * Create a new TrustScore with decrement
     * @param decrement Amount to decrease score by
     * @returns New TrustScore instance
     */
    decrement(decrement: number): TrustScore {
        const newScore = Math.max(this.score - decrement, this.MIN_SCORE);
        return new TrustScore(newScore);
    }

    /**
     * Calculate weighted trust score based on factors
     * @param factors Trust calculation factors
     * @returns Calculated TrustScore
     */
    static calculate(factors: TrustFactors): TrustScore {
        let totalScore = 0;
        const { weights = DEFAULT_WEIGHTS } = factors;

        // Identity verification
        if (factors.identityVerified) {
            totalScore += weights.identityVerified;
        }

        // Profile completeness
        if (factors.profileComplete) {
            totalScore += weights.profileComplete;
        }

        // Skill verification
        if (factors.skillVerified) {
            totalScore += weights.skillVerified;
        }

        // Additional verification methods
        if (factors.digiLockerVerified) {
            totalScore += weights.additionalVerification;
        }

        if (factors.workExperienceVerified) {
            totalScore += weights.additionalVerification;
        }

        // Cap at maximum score
        const finalScore = Math.min(totalScore, MAX_TRUST_SCORE);

        return new TrustScore(finalScore);
    }

    /**
     * Parse trust score from string
     * @param scoreString String representation of score
     * @returns TrustScore instance
     * @throws {Error} if parsing fails
     */
    static fromString(scoreString: string): TrustScore {
        const score = parseFloat(scoreString);

        if (isNaN(score)) {
            throw new Error('Invalid trust score string');
        }

        return new TrustScore(score);
    }

    /**
     * Convert to JSON representation
     * @returns JSON object
     */
    toJSON(): TrustScoreJSON {
        return {
            score: this.score,
            level: this.level,
            meetsMinimum: (min: number) => this.meetsRequirement(min)
        };
    }

    /**
     * String representation
     * @returns String representation
     */
    toString(): string {
        return `TrustScore(${this.score} - ${this.level})`;
    }

    /**
     * Equality check
     * @param other Other TrustScore to compare
     * @returns boolean indicating equality
     */
    equals(other: TrustScore): boolean {
        return this.score === other.value;
    }
}

/**
 * Trust level enum
 */
export enum TrustLevel {
    VERY_LOW = 'VERY_LOW',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    EXCELLENT = 'EXCELLENT'
}

/**
 * Trust calculation factors interface
 */
export interface TrustFactors {
    identityVerified: boolean;
    profileComplete: boolean;
    skillVerified: boolean;
    digiLockerVerified?: boolean;
    workExperienceVerified?: boolean;
    weights?: TrustWeights;
}

/**
 * Trust calculation weights interface
 */
export interface TrustWeights {
    identityVerified: number;
    profileComplete: number;
    skillVerified: number;
    additionalVerification: number;
}

/**
 * Default trust calculation weights
 */
export const DEFAULT_WEIGHTS: TrustWeights = {
    identityVerified: 40,
    profileComplete: 20,
    skillVerified: 40,
    additionalVerification: 10
};

/**
 * Maximum trust score constant
 */
export const MAX_TRUST_SCORE = 100;

/**
 * JSON representation interface
 */
export interface TrustScoreJSON {
    score: number;
    level: TrustLevel;
    meetsMinimum: (min: number) => boolean;
}

/**
 * Trust score validation utility functions
 */
export const TrustScoreUtils = {
    /**
     * Validate if number can be converted to TrustScore
     * @param score Potential trust score
     * @returns Validation result
     */
    validate: (score: number): { isValid: boolean; error?: string } => {
        if (!Number.isFinite(score)) {
            return { isValid: false, error: 'Score must be a finite number' };
        }

        if (score < 0 || score > 100) {
            return { isValid: false, error: 'Score must be between 0 and 100' };
        }

        return { isValid: true };
    },

    /**
     * Calculate average of multiple trust scores
     * @param scores Array of TrustScore instances
     * @returns Average TrustScore
     */
    average: (scores: TrustScore[]): TrustScore => {
        if (scores.length === 0) {
            return new TrustScore(0);
        }

        const total = scores.reduce((sum, score) => sum + score.value, 0);
        const average = total / scores.length;

        return new TrustScore(average);
    },

    /**
     * Get color representation for trust level
     * @param level Trust level
     * @returns Tailwind CSS color class
     */
    getColorForLevel: (level: TrustLevel): string => {
        const colors = {
            [TrustLevel.VERY_LOW]: 'text-red-600 bg-red-50',
            [TrustLevel.LOW]: 'text-orange-600 bg-orange-50',
            [TrustLevel.MEDIUM]: 'text-yellow-600 bg-yellow-50',
            [TrustLevel.HIGH]: 'text-green-600 bg-green-50',
            [TrustLevel.EXCELLENT]: 'text-emerald-600 bg-emerald-50'
        };

        return colors[level];
    }
};