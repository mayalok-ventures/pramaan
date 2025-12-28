/**
 * LLM Integration Service
 * Handles resume parsing and match scoring using Gemini API
 * @infrastructure External Service Adapter
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeAnalysis, MatchAnalysis } from '@/core/infrastructure/external/gemini-client';

// Re-export interfaces and classes from gemini-client for backward compatibility
export type { ResumeAnalysis, MatchAnalysis } from '@/core/infrastructure/external/gemini-client';
export { GeminiClient } from '@/core/infrastructure/external/gemini-client';

// Re-export MatchScore type alias for tests
export type MatchScore = number;

export interface LLMConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

// Singleton Gemini client
let geminiClient: any = null;

/**
 * Initialize the Gemini client
 */
export function initializeGemini(config: LLMConfig): void {
    try {
        const { GeminiClient } = require('@/core/infrastructure/external/gemini-client');
        geminiClient = new GeminiClient();
        geminiClient.initialize(config);
    } catch (error) {
        console.error('Failed to initialize Gemini client:', error);
    }
}

/**
 * Parse resume text and extract structured information
 */
export async function parseResume(resumeText: string): Promise<ResumeAnalysis> {
    try {
        // Check if Gemini is configured
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.warn('GEMINI_API_KEY not set, using stub implementation');
            return stubParseResume(resumeText);
        }

        // Initialize client if needed
        if (!geminiClient) {
            initializeGemini({
                apiKey,
                model: 'gemini-pro',
                temperature: 0.2,
                maxTokens: 1000,
            });
        }

        if (!geminiClient) {
            throw new Error('Gemini client failed to initialize');
        }

        return await geminiClient.parseResume(resumeText);
    } catch (error) {
        console.error('Failed to parse resume with Gemini, falling back to stub:', error);
        return stubParseResume(resumeText);
    }
}

/**
 * Analyze match between resume and job
 */
export async function analyzeJobMatch(
    resumeText: string,
    jobTitle: string,
    jobDescription: string,
    jobSkills: string[]
): Promise<MatchAnalysis> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.warn('GEMINI_API_KEY not set, using stub match analysis');
            return stubAnalyzeMatch(resumeText, jobTitle, jobDescription, jobSkills);
        }

        if (!geminiClient) {
            initializeGemini({
                apiKey,
                model: 'gemini-pro',
                temperature: 0.2,
                maxTokens: 1000,
            });
        }

        if (!geminiClient) {
            throw new Error('Gemini client failed to initialize');
        }

        return await geminiClient.analyzeMatch(resumeText, jobTitle, jobDescription, jobSkills);
    } catch (error) {
        console.error('Failed to analyze job match, using stub:', error);
        return stubAnalyzeMatch(resumeText, jobTitle, jobDescription, jobSkills);
    }
}

/**
 * Generate improvement suggestions for job application
 */
export async function generateImprovementSuggestions(
    resumeText: string,
    jobDescription: string
): Promise<string[]> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return [
                'Tailor your resume to highlight relevant skills',
                'Quantify achievements with specific numbers',
                'Use keywords from the job description',
            ];
        }

        if (!geminiClient) {
            initializeGemini({
                apiKey,
                model: 'gemini-pro',
                temperature: 0.2,
                maxTokens: 500,
            });
        }

        if (!geminiClient) {
            throw new Error('Gemini client failed to initialize');
        }

        return await geminiClient.generateImprovementSuggestions(resumeText, jobDescription);
    } catch (error) {
        console.error('Failed to generate suggestions, returning defaults:', error);
        return [
            'Focus on relevant experience for this role',
            'Highlight quantifiable achievements',
            'Customize your resume for this specific job',
        ];
    }
}

/**
 * Stub implementation for development
 */
export function stubParseResume(resumeText: string): ResumeAnalysis {
    const keywords = [
        'javascript', 'typescript', 'react', 'node', 'python',
        'java', 'aws', 'docker', 'kubernetes', 'sql', 'nosql',
        'html', 'css', 'nextjs', 'tailwind', 'graphql'
    ];

    const found = keywords.filter(kw =>
        resumeText.toLowerCase().includes(kw.toLowerCase())
    ).length;

    const score = Math.min(found * 20, 100);

    return {
        overall: score,
        breakdown: {
            skills: score,
            experience: Math.min(score + 10, 100),
            education: 80,
            relevance: Math.min(score - 10, 100),
        },
        parsedData: {
            skills: found > 0 ? keywords.slice(0, found) : ['General Skills'],
            experience: ['2+ years experience in relevant field'],
            education: ['Bachelor\'s Degree in Computer Science or related field'],
            summary: 'Stub parsing complete. In production, this would use Gemini AI for detailed analysis.',
        },
    };
}

/**
 * Stub match analysis
 */
function stubAnalyzeMatch(
    resumeText: string,
    jobTitle: string,
    jobDescription: string,
    jobSkills: string[]
): MatchAnalysis {
    const resumeAnalysis = stubParseResume(resumeText);

    // Calculate skill match
    const resumeSkills = new Set<string>(resumeAnalysis.parsedData.skills.map((s: string) => s.toLowerCase()));
    const jobSkillSet = new Set<string>(jobSkills.map((s: string) => s.toLowerCase()));

    const intersection = new Set<string>(
        Array.from(resumeSkills).filter((skill: string) => jobSkillSet.has(skill))
    );

    const skillMatch = jobSkills.length > 0
        ? (intersection.size / jobSkills.length) * 100
        : 50;

    const matchScore = Math.round((resumeAnalysis.overall * 0.7) + (skillMatch * 0.3));

    return {
        jobTitle,
        jobDescription: jobDescription.substring(0, 200),
        jobSkills,
        resumeAnalysis,
        matchScore,
        strengths: [
            'Relevant technical skills',
            'Solid educational background',
            'Industry experience',
        ],
        weaknesses: [
            'Could use more specific examples',
            'Consider adding more metrics',
        ],
        recommendations: [
            'Tailor resume to highlight relevant skills',
            'Add quantifiable achievements',
            'Include specific technologies mentioned in job description',
        ],
    };
}

/**
 * Check if Gemini API is available
 */
export function isGeminiAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
}

/**
 * Get LLM configuration status
 */
export function getLLMStatus(): {
    available: boolean;
    service: string;
    configured: boolean;
} {
    return {
        available: true,
        service: 'Google Gemini',
        configured: !!process.env.GEMINI_API_KEY,
    };
}