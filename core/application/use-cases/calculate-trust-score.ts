/**
 * Calculate Trust Score Use Case
 * Application service for trust score calculation
 * @application Use Case
 */
import { User } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user-repository';
import { TrustEngine } from '../../domain/services/trust-engine';

export interface CalculateTrustScoreInput {
    userId: string;
    identityVerified?: boolean;
    profileUpdates?: Record<string, any>;
    contentCompleted?: number;
    positiveReviews?: number;
    accountAge?: number;
}

export interface CalculateTrustScoreOutput {
    success: boolean;
    userId: string;
    trustScore: number;
    trustLevel: string;
    breakdown: {
        identityVerified: boolean;
        profileComplete: boolean;
        skillVerified: boolean;
        contentCompleted: number;
        positiveReviews: number;
        accountAge: number;
    };
    nextLevel?: {
        nextLevel: string;
        pointsNeeded: number;
        progress: number;
    };
}

export class CalculateTrustScoreUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly trustEngine: TrustEngine
    ) { }

    /**
     * Execute trust score calculation
     * @param input Use case input
     * @returns Trust score calculation result
     * O(1) - Constant time operation
     */
    async execute(input: CalculateTrustScoreInput): Promise<CalculateTrustScoreOutput> {
        try {
            // Validate input
            if (!input.userId) {
                throw new Error('User ID is required');
            }

            // Retrieve user
            const user = await this.userRepository.findById(input.userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Prepare trust factors
            const factors = {
                identityVerified: input.identityVerified ?? user.isVerified,
                profileComplete: this.trustEngine.isProfileComplete(user.metadata),
                skillVerified: this.trustEngine.hasVerifiedSkills(user.metadata),
                contentCompleted: input.contentCompleted ?? 0,
                positiveReviews: input.positiveReviews ?? 0,
                accountAge: input.accountAge ?? 0,
            };

            // Calculate trust score
            const trustScore = this.trustEngine.calculateScore(factors);

            // Update user if score changed
            if (Math.abs(trustScore - user.trustScore) > 0.1) {
                await this.userRepository.update(user.id, {
                    trustScore,
                    isVerified: factors.identityVerified,
                });
            }

            // Get next level info
            const nextLevelInfo = this.trustEngine.getNextLevelInfo(trustScore);
            const trustLevel = this.trustEngine.getTrustLevel(trustScore);

            // Get improvement recommendations
            const recommendations = this.trustEngine.getImprovementRecommendations(factors);

            return {
                success: true,
                userId: user.id,
                trustScore,
                trustLevel,
                breakdown: factors,
                nextLevel: nextLevelInfo.pointsNeeded > 0 ? nextLevelInfo : undefined,
            };

        } catch (error: any) {
            console.error('CalculateTrustScoreUseCase error:', error);

            return {
                success: false,
                userId: input.userId,
                trustScore: 0,
                trustLevel: 'New',
                breakdown: {
                    identityVerified: false,
                    profileComplete: false,
                    skillVerified: false,
                    contentCompleted: 0,
                    positiveReviews: 0,
                    accountAge: 0,
                },
            };
        }
    }
}