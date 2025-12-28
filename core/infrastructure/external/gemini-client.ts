/**
 * Gemini AI Client
 * Adapter for Google's Gemini AI API
 * @infrastructure Adapter
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SafetySetting } from '@google/generative-ai';

export interface GeminiConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    safetySettings?: SafetySetting[];
}

export interface ResumeAnalysis {
    overall: number;
    breakdown: {
        skills: number;
        experience: number;
        education: number;
        relevance: number;
    };
    parsedData: {
        skills: string[];
        experience: string[];
        education: string[];
        summary: string;
    };
}

export interface MatchAnalysis {
    jobTitle: string;
    jobDescription: string;
    jobSkills: string[];
    resumeAnalysis: ResumeAnalysis;
    matchScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

export class GeminiClient {
    private genAI: GoogleGenerativeAI | null = null;
    private config: GeminiConfig | null = null;

    /**
     * Initialize the Gemini client
     */
    initialize(config: GeminiConfig): void {
        if (!config.apiKey) {
            throw new Error('Gemini API key is required');
        }

        this.config = {
            model: 'gemini-pro',
            temperature: 0.2,
            maxTokens: 1000,
            ...config,
        };

        this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    }

    /**
     * Parse resume text and extract structured information
     */
    async parseResume(resumeText: string): Promise<ResumeAnalysis> {
        if (!this.genAI || !this.config) {
            throw new Error('GeminiClient not initialized. Call initialize() first.');
        }

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.config.model!,
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens,
                },
                safetySettings: this.config.safetySettings,
            });

            const prompt = `
        Analyze the following resume text and extract structured information.
        Return ONLY a valid JSON object with this exact structure:
        {
          "skills": ["skill1", "skill2", ...],
          "experience": ["exp1", "exp2", ...],
          "education": ["edu1", "edu2", ...],
          "summary": "brief summary"
        }

        Resume text:
        ${resumeText.substring(0, 10000)} // Limit input size
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse JSON from Gemini response');
            }

            const parsedData = JSON.parse(jsonMatch[0]);

            // Calculate scores based on parsed data
            const skillsScore = this.calculateSkillsScore(parsedData.skills);
            const experienceScore = this.calculateExperienceScore(parsedData.experience);
            const educationScore = this.calculateEducationScore(parsedData.education);
            const relevanceScore = 50; // Default relevance score

            const overall = Math.round(
                (skillsScore * 0.4) +
                (experienceScore * 0.4) +
                (educationScore * 0.15) +
                (relevanceScore * 0.05)
            );

            return {
                overall,
                breakdown: {
                    skills: skillsScore,
                    experience: experienceScore,
                    education: educationScore,
                    relevance: relevanceScore,
                },
                parsedData,
            };

        } catch (error: any) {
            console.error('Gemini API error:', error);
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }

    /**
     * Analyze match between resume and job
     */
    async analyzeMatch(
        resumeText: string,
        jobTitle: string,
        jobDescription: string,
        jobSkills: string[]
    ): Promise<MatchAnalysis> {
        if (!this.genAI || !this.config) {
            throw new Error('GeminiClient not initialized. Call initialize() first.');
        }

        try {
            // First parse the resume
            const resumeAnalysis = await this.parseResume(resumeText);

            // Analyze match with job
            const model = this.genAI.getGenerativeModel({
                model: this.config.model!,
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens,
                },
            });

            const prompt = `
        Analyze how well the following resume matches the job requirements.
        
        Job Title: ${jobTitle}
        Job Description: ${jobDescription.substring(0, 2000)}
        Required Skills: ${JSON.stringify(jobSkills)}
        
        Resume Analysis:
        Skills: ${JSON.stringify(resumeAnalysis.parsedData.skills)}
        Experience: ${JSON.stringify(resumeAnalysis.parsedData.experience)}
        Education: ${JSON.stringify(resumeAnalysis.parsedData.education)}
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "matchScore": 0-100,
          "strengths": ["strength1", "strength2", ...],
          "weaknesses": ["weakness1", "weakness2", ...],
          "recommendations": ["rec1", "rec2", ...]
        }
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse JSON from Gemini response');
            }

            const matchAnalysis = JSON.parse(jsonMatch[0]);

            return {
                jobTitle,
                jobDescription,
                jobSkills,
                resumeAnalysis,
                matchScore: matchAnalysis.matchScore,
                strengths: matchAnalysis.strengths || [],
                weaknesses: matchAnalysis.weaknesses || [],
                recommendations: matchAnalysis.recommendations || [],
            };

        } catch (error: any) {
            console.error('Gemini match analysis error:', error);
            throw new Error(`Gemini analysis error: ${error.message}`);
        }
    }

    /**
     * Generate job application improvement suggestions
     */
    async generateImprovementSuggestions(
        resumeText: string,
        jobDescription: string
    ): Promise<string[]> {
        if (!this.genAI || !this.config) {
            throw new Error('GeminiClient not initialized. Call initialize() first.');
        }

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.config.model!,
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: 500,
                },
            });

            const prompt = `
        Based on the following resume and job description, provide 3-5 specific suggestions to improve the job application.
        
        Job Description: ${jobDescription.substring(0, 1500)}
        
        Resume: ${resumeText.substring(0, 3000)}
        
        Return ONLY a JSON array of strings with suggestions:
        ["suggestion1", "suggestion2", ...]
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON array from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Failed to parse JSON from Gemini response');
            }

            return JSON.parse(jsonMatch[0]);

        } catch (error: any) {
            console.error('Gemini suggestions error:', error);
            return [
                "Tailor your resume to highlight relevant skills",
                "Quantify your achievements with specific numbers",
                "Use keywords from the job description",
            ];
        }
    }

    /**
     * Calculate skills score based on number and relevance of skills
     */
    private calculateSkillsScore(skills: string[]): number {
        if (!skills || skills.length === 0) return 0;

        const uniqueSkills = new Set(skills.map(s => s.toLowerCase().trim()));
        const count = uniqueSkills.size;

        // Score based on number of skills (capped at 100)
        return Math.min(count * 10, 100);
    }

    /**
     * Calculate experience score based on number of experiences
     */
    private calculateExperienceScore(experiences: string[]): number {
        if (!experiences || experiences.length === 0) return 0;

        const count = experiences.length;

        // Score based on number of experiences (capped at 100)
        return Math.min(count * 20, 100);
    }

    /**
     * Calculate education score
     */
    private calculateEducationScore(education: string[]): number {
        if (!education || education.length === 0) return 30; // Basic score for no education listed

        const count = education.length;

        // Higher base score for having education listed
        return Math.min(70 + (count * 10), 100);
    }

    /**
     * Fallback parsing when Gemini API fails
     */
    fallbackParseResume(resumeText: string): ResumeAnalysis {
        // Simple keyword extraction as fallback
        const techSkills = [
            'javascript', 'typescript', 'react', 'node', 'python',
            'java', 'aws', 'docker', 'kubernetes', 'sql', 'nosql',
            'html', 'css', 'nextjs', 'tailwind', 'graphql', 'mongodb',
            'postgresql', 'redis', 'git', 'github', 'ci/cd', 'devops',
            'machine learning', 'ai', 'data science', 'analytics'
        ];

        const softSkills = [
            'communication', 'leadership', 'teamwork', 'problem solving',
            'critical thinking', 'time management', 'adaptability', 'creativity'
        ];

        const textLower = resumeText.toLowerCase();
        const foundTechSkills = techSkills.filter(skill => textLower.includes(skill));
        const foundSoftSkills = softSkills.filter(skill => textLower.includes(skill));
        const allFoundSkills = [...foundTechSkills, ...foundSoftSkills];

        const skillsScore = Math.min(allFoundSkills.length * 15, 100);
        const experienceScore = textLower.includes('experience') ? 70 : 40;
        const educationScore = textLower.includes('education') || textLower.includes('degree') ? 80 : 50;

        const overall = Math.round(
            (skillsScore * 0.4) +
            (experienceScore * 0.4) +
            (educationScore * 0.2)
        );

        return {
            overall,
            breakdown: {
                skills: skillsScore,
                experience: experienceScore,
                education: educationScore,
                relevance: 50,
            },
            parsedData: {
                skills: allFoundSkills,
                experience: ['Experience extracted from resume'],
                education: ['Education information extracted from resume'],
                summary: 'Parsed using fallback method due to API limitations',
            },
        };
    }
}