/**
 * Apply to Job Use Case
 * Application service for job applications with resume matching
 * @application Use Case
 */
import { UserRepository } from '../../domain/repositories/user-repository';
import { JobRepository } from '../../domain/repositories/job-repository';
import { parseResume } from '../../../lib/llm';

export interface ApplyToJobInput {
    jobId: string;
    userId: string;
    resumeText: string;
}

export interface ApplyToJobOutput {
    success: boolean;
    applicationId?: string;
    matchScore?: number;
    isEligible?: boolean;
    errors?: string[];
}

export class ApplyToJobUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jobRepository: JobRepository
    ) { }

    /**
     * Execute job application
     * @param input Use case input
     * @returns Application result
     */
    async execute(input: ApplyToJobInput): Promise<ApplyToJobOutput> {
        const errors: string[] = [];

        try {
            // Validate input
            if (!input.jobId) {
                errors.push('Job ID is required');
            }

            if (!input.userId) {
                errors.push('User ID is required');
            }

            if (errors.length > 0) {
                return {
                    success: false,
                    errors,
                };
            }

            // Check if job exists and is active
            const job = await this.jobRepository.findById(input.jobId);
            if (!job) {
                errors.push('Job not found');
                return {
                    success: false,
                    errors,
                };
            }

            if (!job.isActive()) {
                errors.push('Job is no longer active');
                return {
                    success: false,
                    errors,
                };
            }

            // Check if user exists
            const user = await this.userRepository.findById(input.userId);
            if (!user) {
                errors.push('User not found');
                return {
                    success: false,
                    errors,
                };
            }

            // Check eligibility (trust score requirement)
            const isEligible = job.isEligibleForUser(user.trustScore);
            if (!isEligible) {
                return {
                    success: false,
                    isEligible: false,
                    errors: [`Trust score requirement not met. Required: ${job.minTrustScore}, Your score: ${user.trustScore}`],
                };
            }

            // Check for existing application
            // Note: In a real implementation, we would check an ApplicationRepository
            // For now, we'll skip this check and assume it's handled by the API layer

            // Parse resume and calculate match score
            let matchScore = 0;
            if (input.resumeText && input.resumeText.trim().length > 0) {
                try {
                    const resumeAnalysis = await parseResume(input.resumeText);
                    matchScore = resumeAnalysis.overall;

                    // Calculate additional match based on job skills
                    const userSkills = new Set(resumeAnalysis.parsedData.skills.map(s => s.toLowerCase()));
                    const jobSkills = new Set(job.skills.map(s => s.toLowerCase()));

                    const matchedSkills = Array.from(userSkills).filter(skill => jobSkills.has(skill));
                    const intersection = new Set(matchedSkills);

                    const skillMatchScore = job.skills.length > 0
                        ? (intersection.size / job.skills.length) * 100
                        : 50;

                    // Weighted average of AI score and skill match
                    matchScore = Math.round((matchScore * 0.7) + (skillMatchScore * 0.3));

                } catch (llmError) {
                    console.warn('LLM parsing failed:', llmError);
                    // Fallback: Use trust score as base match score
                    matchScore = Math.min(user.trustScore, 85);
                }
            } else {
                // No resume text provided, use trust score as base
                matchScore = Math.min(user.trustScore, 70);
            }

            // Generate application ID
            const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // In a real implementation, we would save to ApplicationRepository
            // For now, we'll return success

            return {
                success: true,
                applicationId,
                matchScore,
                isEligible: true,
            };

        } catch (error: any) {
            console.error('ApplyToJobUseCase error:', error);
            errors.push(error.message || 'Failed to process application');

            return {
                success: false,
                errors,
            };
        }
    }
}