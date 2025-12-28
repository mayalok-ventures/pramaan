/**
 * LLM Integration Test Suite
 * Unit tests for Gemini API integration and resume parsing
 * @testing Vitest
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GeminiClient, parseResume, stubParseResume } from '@/lib/llm';
import type { ResumeAnalysis } from '@/lib/llm';

describe('LLM Integration - Resume Parsing', () => {
    let geminiClient: GeminiClient;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        delete process.env.GEMINI_API_KEY;
    });

    describe('Stub Implementation', () => {
        it('should parse resume with stub implementation', () => {
            const resumeText = `
        John Doe
        Senior Software Engineer
        Skills: JavaScript, TypeScript, React, Node.js, AWS
        Experience: 5 years at Tech Corp
        Education: B.S. Computer Science
      `;

            const result = stubParseResume(resumeText);

            expect(result).toHaveProperty('overall');
            expect(result).toHaveProperty('breakdown');
            expect(result).toHaveProperty('parsedData');

            expect(result.overall).toBeGreaterThanOrEqual(0);
            expect(result.overall).toBeLessThanOrEqual(100);

            expect(result.parsedData.skills).toBeInstanceOf(Array);
            expect(result.parsedData.experience).toBeInstanceOf(Array);
            expect(result.parsedData.education).toBeInstanceOf(Array);
            expect(typeof result.parsedData.summary).toBe('string');
        });

        it('should extract skills from resume text', () => {
            const resumeText = 'Expert in React, Node.js, TypeScript, and AWS cloud services.';
            const result = stubParseResume(resumeText);

            expect(result.parsedData.skills.length).toBeGreaterThan(0);
            expect(result.breakdown.skills).toBeGreaterThan(0);

            // Should find React, Node, TypeScript, AWS
            const foundSkills = result.parsedData.skills.map((s: string) => s.toLowerCase());
            expect(foundSkills.some(skill => skill.includes('react'))).toBe(true);
            expect(foundSkills.some(skill => skill.includes('node'))).toBe(true);
        });

        it('should handle empty resume text', () => {
            const result = stubParseResume('');

            expect(result.overall).toBe(0);
            expect(result.parsedData.skills).toEqual(['General Skills']);
            expect(result.parsedData.summary).toContain('Stub');
        });

        it('should calculate match scores based on keywords', () => {
            const resumeText = 'React developer with AWS experience';
            const result = stubParseResume(resumeText);

            // Should match React and AWS (2/5 keywords = 40% base)
            expect(result.overall).toBeGreaterThanOrEqual(20);
            expect(result.overall).toBeLessThanOrEqual(100);
        });
    });

    describe('GeminiClient Instance Tests', () => {
        beforeEach(() => {
            geminiClient = new GeminiClient();
        });

        it('should throw error when parseResume called without initialization', async () => {
            await expect(geminiClient.parseResume('test resume')).rejects.toThrow('GeminiClient not initialized');
        });

        it('should throw error when initialize called without API key', () => {
            expect(() => geminiClient.initialize({ apiKey: '' })).toThrow('Gemini API key is required');
        });
    });

    describe('parseResume Function', () => {
        it('should use stub when API key is missing', async () => {
            delete process.env.GEMINI_API_KEY;

            const resumeText = 'Test resume';
            const result = await parseResume(resumeText);

            expect(result.parsedData.summary).toContain('Stub');
        });

        it('should handle errors gracefully and fall back to stub', async () => {
            process.env.GEMINI_API_KEY = 'invalid-key';

            const resumeText = 'Test resume content';
            const result = await parseResume(resumeText);

            // Should fall back to stub implementation
            expect(result.parsedData.summary).toContain('Stub');
        });
    });

    describe('Match Score Calculations', () => {
        it('should calculate skill match percentage', () => {
            const resumeText = `
        Skills: React, Vue.js, Angular, TypeScript, JavaScript, Node.js, Python, Django
        Experience: Full Stack Developer at ABC Corp (3 years)
        Education: Master in Computer Science
      `;

            const result = stubParseResume(resumeText);

            // Should match many skills from the common skills list
            expect(result.breakdown.skills).toBeGreaterThan(50);
            expect(result.overall).toBeGreaterThan(50);
        });

        it('should handle resume with no common skills', () => {
            const resumeText = `
        Skills: Cooking, Gardening, Painting, Writing
        Experience: Chef at Restaurant
        Education: Culinary Arts Degree
      `;

            const result = stubParseResume(resumeText);

            // No technical skills found
            expect(result.breakdown.skills).toBe(0);
            expect(result.overall).toBeLessThan(50);
        });

        it('should maintain score boundaries', () => {
            const longResume = 'React '.repeat(100) + 'Node '.repeat(100);
            const result = stubParseResume(longResume);

            expect(result.overall).toBeGreaterThanOrEqual(0);
            expect(result.overall).toBeLessThanOrEqual(100);

            expect(result.breakdown.skills).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.skills).toBeLessThanOrEqual(100);

            expect(result.breakdown.experience).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.experience).toBeLessThanOrEqual(100);

            expect(result.breakdown.education).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.education).toBeLessThanOrEqual(100);

            expect(result.breakdown.relevance).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.relevance).toBeLessThanOrEqual(100);
        });
    });

    describe('Performance & Edge Cases', () => {
        it('should handle very long resume text', () => {
            const longText = 'A'.repeat(10000) + ' React ' + 'B'.repeat(10000);
            const startTime = performance.now();

            const result = stubParseResume(longText);
            const endTime = performance.now();

            expect(result.overall).toBeDefined();
            expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
        });

        it('should handle special characters and formatting', () => {
            const resumeText = `
        Name: John "JD" Doe
        Email: john.doe@company.com
        Phone: +1 (555) 123-4567
        LinkedIn: https://linkedin.com/in/johndoe
        
        SKILLS:
        • JavaScript/ES6+
        • React.js & Redux
        • Node.js/Express
        • AWS (S3, EC2, Lambda)
        • Docker 🐳 & Kubernetes
        • CI/CD: Jenkins, GitHub Actions
        
        EXPERIENCE:
        → Senior Developer @TechCorp (2020-Present)
        → Junior Developer @Startup (2018-2020)
        
        EDUCATION:
        🎓 B.S. Computer Science, Stanford University (2014-2018)
        GPA: 3.8/4.0
        
        CERTIFICATIONS:
        - AWS Certified Solutions Architect
        - Google Cloud Professional Developer
      `;

            const result = stubParseResume(resumeText);

            expect(result.parsedData.skills.length).toBeGreaterThan(0);
            expect(result.parsedData.experience.length).toBeGreaterThan(0);
            expect(result.parsedData.education.length).toBeGreaterThan(0);
            expect(result.parsedData.summary.length).toBeGreaterThan(0);
        });

        it('should handle multiple languages', () => {
            const multilingualResume = `
        Nombre: Juan Pérez
        Habilidades: JavaScript, React, Node.js
        Experiencia: Desarrollador en Empresa Tech
        Educación: Ingeniería en Sistemas
        
        Name: Juan Pérez
        Skills: JavaScript, React, Node.js
        Experience: Developer at Tech Company
        Education: Systems Engineering
      `;

            const result = stubParseResume(multilingualResume);

            expect(result.parsedData.skills).toContain('javascript');
            expect(result.overall).toBeGreaterThan(0);
        });
    });

    describe('Integration with Job Matching', () => {
        it('should calculate job match based on parsed skills', () => {
            const resumeText = 'Skills: React, TypeScript, Node.js, AWS';
            const jobSkills = ['React', 'TypeScript', 'Next.js', 'AWS'];

            const result = stubParseResume(resumeText);
            const resumeSkills = new Set(result.parsedData.skills.map((s: string) => s.toLowerCase()));
            const jobSkillsSet = new Set(jobSkills.map(s => s.toLowerCase()));

            const intersection = new Set(
                Array.from(resumeSkills).filter((skill: string) => jobSkillsSet.has(skill))
            );

            const matchPercentage = (intersection.size / jobSkillsSet.size) * 100;

            // Should match 3 out of 4 skills (75%)
            expect(matchPercentage).toBe(75);
        });

        it('should handle job with no skills requirement', () => {
            const resumeText = 'Skills: Many skills listed';
            const jobSkills: string[] = [];

            const result = stubParseResume(resumeText);

            // When job has no skills, match should be based on other factors
            expect(result.overall).toBeGreaterThan(0);
            expect(result.breakdown.skills).toBeGreaterThan(0);
        });
    });
});
