/**
 * Trust Engine Service
 * Calculates and manages user trust scores
 * @domain Service
 */
export interface TrustFactors {
    identityVerified: boolean;
    profileComplete: boolean;
    skillVerified: boolean;
    contentCompleted?: number;
    positiveReviews?: number;
    accountAge?: number; // in days
}

export class TrustEngine {
    private readonly weights = {
        identityVerified: 40,
        profileComplete: 20,
        skillVerified: 40,
        contentCompleted: 10, // Bonus points
        positiveReviews: 5,   // Bonus points
        accountAge: 5,       // Bonus points
    };

    private readonly maxBonusPoints = 20;

    /**
     * Calculate trust score based on verification factors
     * @param factors Object containing verification status
     * @returns Calculated trust score (0-100)
     */
    calculateScore(factors: TrustFactors): number {
        let score = 0;

        // Base factors
        if (factors.identityVerified) {
            score += this.weights.identityVerified;
        }

        if (factors.profileComplete) {
            score += this.weights.profileComplete;
        }

        if (factors.skillVerified) {
            score += this.weights.skillVerified;
        }

        // Bonus points (capped)
        let bonusPoints = 0;

        if (factors.contentCompleted && factors.contentCompleted > 0) {
            bonusPoints += Math.min(
                Math.floor(factors.contentCompleted / 5) * this.weights.contentCompleted,
                this.weights.contentCompleted
            );
        }

        if (factors.positiveReviews && factors.positiveReviews > 0) {
            bonusPoints += Math.min(
                Math.floor(factors.positiveReviews / 3) * this.weights.positiveReviews,
                this.weights.positiveReviews
            );
        }

        if (factors.accountAge && factors.accountAge > 30) {
            bonusPoints += Math.min(
                Math.floor(factors.accountAge / 30) * this.weights.accountAge,
                this.weights.accountAge
            );
        }

        // Apply bonus points cap
        score += Math.min(bonusPoints, this.maxBonusPoints);

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Determine if profile is complete based on metadata
     * @param metadata User metadata object
     * @returns boolean indicating profile completeness
     */
    isProfileComplete(metadata: Record<string, any>): boolean {
        const requiredFields = ['name', 'phone'];
        return requiredFields.every(field =>
            metadata[field] && metadata[field].toString().trim().length > 0
        );
    }

    /**
     * Check if user has verified skills
     * @param metadata User metadata object
     * @returns boolean indicating skill verification
     */
    hasVerifiedSkills(metadata: Record<string, any>): boolean {
        return Array.isArray(metadata.skills) && metadata.skills.length > 0;
    }

    /**
     * Calculate trust level based on score
     * @param score Trust score (0-100)
     * @returns Trust level string
     */
    getTrustLevel(score: number): string {
        if (score >= 90) return 'Elite';
        if (score >= 80) return 'Premium';
        if (score >= 70) return 'Advanced';
        if (score >= 60) return 'Verified';
        if (score >= 40) return 'Basic';
        return 'New';
    }

    /**
     * Calculate score needed for next level
     * @param currentScore Current trust score
     * @returns Object containing next level info
     */
    getNextLevelInfo(currentScore: number): {
        nextLevel: string;
        pointsNeeded: number;
        progress: number;
    } {
        const levels = [
            { threshold: 0, level: 'New' },
            { threshold: 40, level: 'Basic' },
            { threshold: 60, level: 'Verified' },
            { threshold: 80, level: 'Premium' },
            { threshold: 90, level: 'Elite' },
        ];

        let currentLevelIndex = 0;
        let nextLevelIndex = 1;

        // Find current level
        for (let i = levels.length - 1; i >= 0; i--) {
            if (currentScore >= levels[i].threshold) {
                currentLevelIndex = i;
                nextLevelIndex = i + 1;
                break;
            }
        }

        // If already at max level
        if (nextLevelIndex >= levels.length) {
            return {
                nextLevel: 'Max Level',
                pointsNeeded: 0,
                progress: 100,
            };
        }

        const nextLevelThreshold = levels[nextLevelIndex].threshold;
        const currentLevelThreshold = levels[currentLevelIndex].threshold;

        const pointsNeeded = nextLevelThreshold - currentScore;
        const levelRange = nextLevelThreshold - currentLevelThreshold;
        const progressInLevel = currentScore - currentLevelThreshold;
        const progressPercentage = Math.round((progressInLevel / levelRange) * 100);

        return {
            nextLevel: levels[nextLevelIndex].level,
            pointsNeeded: Math.max(0, pointsNeeded),
            progress: Math.min(100, Math.max(0, progressPercentage)),
        };
    }

    /**
     * Get recommendations to improve trust score
     * @param factors Current trust factors
     * @returns Array of improvement recommendations
     */
    getImprovementRecommendations(factors: TrustFactors): string[] {
        const recommendations: string[] = [];

        if (!factors.identityVerified) {
            recommendations.push('Verify your identity to gain 40 points');
        }

        if (!factors.profileComplete) {
            recommendations.push('Complete your profile (add name and phone) to gain 20 points');
        }

        if (!factors.skillVerified) {
            recommendations.push('Add verified skills to gain 40 points');
        }

        if (!factors.contentCompleted || factors.contentCompleted < 5) {
            recommendations.push('Complete 5 learning modules to gain bonus points');
        }

        return recommendations;
    }

    /**
     * Recalculate user trust score based on current state
     * @param user User entity
     * @param additionalData Additional user data
     * @returns Updated trust score
     */
    recalculateForUser(
        user: any,
        additionalData?: {
            contentCompleted?: number;
            positiveReviews?: number;
            accountAge?: number;
        }
    ): number {
        const factors: TrustFactors = {
            identityVerified: user.isVerified,
            profileComplete: this.isProfileComplete(user.metadata || {}),
            skillVerified: this.hasVerifiedSkills(user.metadata || {}),
            ...additionalData,
        };

        return this.calculateScore(factors);
    }
}