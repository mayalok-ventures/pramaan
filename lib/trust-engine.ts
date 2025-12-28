/**
 * Trust Engine Utility
 * Provides easy access to trust score calculations
 * @lib Utility
 */
import { TrustEngine } from '@/core/domain/services/trust-engine';

// Singleton instance
let trustEngineInstance: TrustEngine | null = null;

/**
 * Get Trust Engine instance
 */
export function getTrustEngine(): TrustEngine {
    if (!trustEngineInstance) {
        trustEngineInstance = new TrustEngine();
    }
    return trustEngineInstance;
}

/**
 * Calculate trust score based on verification factors
 */
export function calculateTrustScore(factors: {
    identityVerified: boolean;
    profileComplete: boolean;
    skillVerified: boolean;
    contentCompleted?: number;
    positiveReviews?: number;
    accountAge?: number;
}): number {
    const engine = getTrustEngine();
    return engine.calculateScore(factors);
}

/**
 * Determine if profile is complete
 */
export function isProfileComplete(metadata: Record<string, any>): boolean {
    const engine = getTrustEngine();
    return engine.isProfileComplete(metadata);
}

/**
 * Get trust level based on score
 */
export function getTrustLevel(score: number): string {
    const engine = getTrustEngine();
    return engine.getTrustLevel(score);
}

/**
 * Get next level information
 */
export function getNextLevelInfo(currentScore: number): {
    nextLevel: string;
    pointsNeeded: number;
    progress: number;
} {
    const engine = getTrustEngine();
    return engine.getNextLevelInfo(currentScore);
}

/**
 * Get improvement recommendations
 */
export function getImprovementRecommendations(factors: {
    identityVerified: boolean;
    profileComplete: boolean;
    skillVerified: boolean;
    contentCompleted?: number;
    positiveReviews?: number;
    accountAge?: number;
}): string[] {
    const engine = getTrustEngine();
    return engine.getImprovementRecommendations(factors);
}

/**
 * Calculate trust score for user profile
 */
export function calculateUserTrustScore(userData: {
    isVerified: boolean;
    metadata: Record<string, any>;
    contentCompleted?: number;
    positiveReviews?: number;
    accountAge?: number;
}): {
    score: number;
    level: string;
    breakdown: {
        identityVerified: boolean;
        profileComplete: boolean;
        skillVerified: boolean;
        contentCompleted: number;
        positiveReviews: number;
        accountAge: number;
    };
} {
    const engine = getTrustEngine();

    const factors = {
        identityVerified: userData.isVerified,
        profileComplete: engine.isProfileComplete(userData.metadata),
        skillVerified: engine.hasVerifiedSkills(userData.metadata),
        contentCompleted: userData.contentCompleted || 0,
        positiveReviews: userData.positiveReviews || 0,
        accountAge: userData.accountAge || 0,
    };

    const score = engine.calculateScore(factors);
    const level = engine.getTrustLevel(score);

    return {
        score,
        level,
        breakdown: factors,
    };
}

/**
 * Get trust score progress visualization
 */
export function getTrustScoreProgress(currentScore: number): {
    currentLevel: string;
    nextLevel?: string;
    pointsNeeded: number;
    progressPercentage: number;
    color: string;
} {
    const engine = getTrustEngine();
    const nextLevelInfo = engine.getNextLevelInfo(currentScore);
    const currentLevel = engine.getTrustLevel(currentScore);

    // Determine color based on score
    let color = 'gray';
    if (currentScore >= 80) color = 'green';
    else if (currentScore >= 60) color = 'blue';
    else if (currentScore >= 40) color = 'yellow';
    else color = 'red';

    return {
        currentLevel,
        nextLevel: nextLevelInfo.pointsNeeded > 0 ? nextLevelInfo.nextLevel : undefined,
        pointsNeeded: nextLevelInfo.pointsNeeded,
        progressPercentage: nextLevelInfo.progress,
        color,
    };
}

/**
 * Validate trust score requirements for job application
 */
export function validateJobApplication(
    userTrustScore: number,
    jobMinTrustScore: number
): {
    eligible: boolean;
    pointsNeeded: number;
    percentage: number;
    message: string;
} {
    const eligible = userTrustScore >= jobMinTrustScore;
    const pointsNeeded = Math.max(0, jobMinTrustScore - userTrustScore);
    const percentage = Math.min(100, (userTrustScore / jobMinTrustScore) * 100);

    let message = '';
    if (eligible) {
        message = `You meet the trust score requirement (${userTrustScore}/${jobMinTrustScore})`;
    } else {
        message = `You need ${pointsNeeded} more points to apply (${userTrustScore}/${jobMinTrustScore})`;
    }

    return {
        eligible,
        pointsNeeded,
        percentage,
        message,
    };
}

/**
 * Calculate trust score increase from actions
 */
export function calculateScoreIncrease(
    currentScore: number,
    action: 'verify_identity' | 'complete_profile' | 'add_skills' | 'complete_content' | 'receive_review'
): {
    newScore: number;
    increase: number;
    maxPossible: number;
} {
    const engine = getTrustEngine();

    // Base factors for calculation
    const baseFactors = {
        identityVerified: false,
        profileComplete: false,
        skillVerified: false,
        contentCompleted: 0,
        positiveReviews: 0,
        accountAge: 0,
    };

    // Calculate current base score without bonuses
    const baseScore = engine.calculateScore(baseFactors);

    let increase = 0;
    let maxPossible = 100;

    switch (action) {
        case 'verify_identity':
            increase = 40;
            break;
        case 'complete_profile':
            increase = 20;
            break;
        case 'add_skills':
            increase = 40;
            break;
        case 'complete_content':
            increase = Math.min(10, 100 - currentScore);
            break;
        case 'receive_review':
            increase = Math.min(5, 100 - currentScore);
            break;
    }

    const newScore = Math.min(100, currentScore + increase);

    return {
        newScore,
        increase,
        maxPossible,
    };
}