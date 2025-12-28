/**
 * Trust Engine Test Suite
 * Comprehensive unit tests for trust score calculation
 * @testing Vitest
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TrustEngine } from '@/core/domain/services/trust-engine';
import { TrustScore, TrustLevel, TrustScoreUtils, DEFAULT_WEIGHTS } from '@/core/domain/value-objects/trust-score';
import type { TrustFactors } from '@/core/domain/value-objects/trust-score';

describe('Trust Engine & Trust Score Value Object', () => {
    let trustEngine: TrustEngine;

    beforeEach(() => {
        trustEngine = new TrustEngine();
    });

    describe('TrustScore Value Object', () => {
        it('should create valid TrustScore instance', () => {
            const score = new TrustScore(75);
            expect(score.value).toBe(75);
            expect(score.level).toBe(TrustLevel.HIGH);
        });

        it('should throw error for invalid score', () => {
            expect(() => new TrustScore(-10)).toThrow();
            expect(() => new TrustScore(150)).toThrow();
            expect(() => new TrustScore(NaN)).toThrow();
        });

        it('should correctly determine trust levels', () => {
            expect(new TrustScore(95).level).toBe(TrustLevel.EXCELLENT);
            expect(new TrustScore(80).level).toBe(TrustLevel.HIGH);
            expect(new TrustScore(60).level).toBe(TrustLevel.MEDIUM);
            expect(new TrustScore(30).level).toBe(TrustLevel.LOW);
            expect(new TrustScore(10).level).toBe(TrustLevel.VERY_LOW);
        });

        it('should check minimum requirements', () => {
            const score = new TrustScore(70);
            expect(score.meetsRequirement(50)).toBe(true);
            expect(score.meetsRequirement(70)).toBe(true);
            expect(score.meetsRequirement(80)).toBe(false);
        });

        it('should correctly increment and decrement', () => {
            const score = new TrustScore(50);
            const incremented = score.increment(20);
            const decremented = score.decrement(30);

            expect(incremented.value).toBe(70);
            expect(decremented.value).toBe(20);
        });

        it('should cap at maximum and minimum scores', () => {
            const highScore = new TrustScore(95);
            const lowScore = new TrustScore(5);

            expect(highScore.increment(10).value).toBe(100);
            expect(lowScore.decrement(10).value).toBe(0);
        });

        it('should calculate from string', () => {
            const score = TrustScore.fromString('85.5');
            expect(score.value).toBe(86); // Rounded
        });

        it('should throw when parsing invalid string', () => {
            expect(() => TrustScore.fromString('invalid')).toThrow();
        });

        it('should correctly convert to JSON', () => {
            const score = new TrustScore(75);
            const json = score.toJSON();

            expect(json.score).toBe(75);
            expect(json.level).toBe(TrustLevel.HIGH);
            expect(json.meetsMinimum(50)).toBe(true);
        });

        it('should check equality correctly', () => {
            const score1 = new TrustScore(75);
            const score2 = new TrustScore(75);
            const score3 = new TrustScore(80);

            expect(score1.equals(score2)).toBe(true);
            expect(score1.equals(score3)).toBe(false);
        });

        it('should calculate using static method', () => {
            const factors: TrustFactors = {
                identityVerified: true,
                profileComplete: true,
                skillVerified: false
            };

            const score = TrustScore.calculate(factors);
            expect(score.value).toBe(60); // 40 + 20 + 0
        });

        it('should handle additional verification factors', () => {
            const factors: TrustFactors = {
                identityVerified: true,
                profileComplete: true,
                skillVerified: true,
                digiLockerVerified: true,
                workExperienceVerified: true
            };

            const score = TrustScore.calculate(factors);
            expect(score.value).toBe(100); // 40 + 20 + 40 + 10 + 10 = 120, capped at 100
        });
    });

    describe('TrustScoreUtils', () => {
        it('should validate scores correctly', () => {
            expect(TrustScoreUtils.validate(50).isValid).toBe(true);
            expect(TrustScoreUtils.validate(-10).isValid).toBe(false);
            expect(TrustScoreUtils.validate(150).isValid).toBe(false);
            expect(TrustScoreUtils.validate(NaN).isValid).toBe(false);
        });

        it('should calculate average of scores', () => {
            const scores = [
                new TrustScore(70),
                new TrustScore(80),
                new TrustScore(90)
            ];

            const average = TrustScoreUtils.average(scores);
            expect(average.value).toBe(80);
        });

        it('should return zero for empty array', () => {
            const average = TrustScoreUtils.average([]);
            expect(average.value).toBe(0);
        });

        it('should return correct colors for trust levels', () => {
            expect(TrustScoreUtils.getColorForLevel(TrustLevel.EXCELLENT))
                .toContain('emerald');
            expect(TrustScoreUtils.getColorForLevel(TrustLevel.HIGH))
                .toContain('green');
            expect(TrustScoreUtils.getColorForLevel(TrustLevel.MEDIUM))
                .toContain('yellow');
            expect(TrustScoreUtils.getColorForLevel(TrustLevel.LOW))
                .toContain('orange');
            expect(TrustScoreUtils.getColorForLevel(TrustLevel.VERY_LOW))
                .toContain('red');
        });
    });

    describe('TrustEngine Integration', () => {
        it('should calculate trust score with default weights', () => {
            const factors = {
                identityVerified: true,
                profileComplete: true,
                skillVerified: true
            };

            const score = trustEngine.calculateScore(factors);
            expect(score).toBe(100);
        });

        it('should calculate partial trust scores', () => {
            const factors = {
                identityVerified: true,
                profileComplete: false,
                skillVerified: true
            };

            const score = trustEngine.calculateScore(factors);
            expect(score).toBe(80); // 40 + 0 + 40
        });

        it('should detect profile completeness', () => {
            const completeProfile = { name: 'John Doe', phone: '+1234567890' };
            const incompleteProfile = { name: 'John Doe' };

            expect(trustEngine.isProfileComplete(completeProfile)).toBe(true);
            expect(trustEngine.isProfileComplete(incompleteProfile)).toBe(false);
        });

        it('should recalculate trust score for user', () => {
            const mockUser = {
                isVerified: true,
                metadata: {
                    name: 'Test User',
                    phone: '1234567890',
                    skills: ['JavaScript', 'TypeScript']
                }
            };

            const score = trustEngine.recalculateForUser(mockUser);
            expect(score).toBe(100); // All factors true
        });

        it('should handle user without skills', () => {
            const mockUser = {
                isVerified: true,
                metadata: {
                    name: 'Test User',
                    phone: '1234567890'
                }
            };

            const score = trustEngine.recalculateForUser(mockUser);
            expect(score).toBe(60); // Verified + Profile complete
        });

        it('should handle edge cases in profile completeness', () => {
            expect(trustEngine.isProfileComplete({})).toBe(false);
            expect(trustEngine.isProfileComplete({ name: '', phone: '' })).toBe(false);
            expect(trustEngine.isProfileComplete({ name: '   ', phone: '   ' })).toBe(false);
            expect(trustEngine.isProfileComplete({ name: 'John', phone: '123' })).toBe(true);
        });

        it('should maintain score between 0 and 100', () => {
            // Test with all factors false
            const zeroFactors = {
                identityVerified: false,
                profileComplete: false,
                skillVerified: false
            };

            const zeroScore = trustEngine.calculateScore(zeroFactors);
            expect(zeroScore).toBe(0);
            expect(zeroScore).toBeGreaterThanOrEqual(0);
            expect(zeroScore).toBeLessThanOrEqual(100);

            // Test with all factors true
            const maxFactors = {
                identityVerified: true,
                profileComplete: true,
                skillVerified: true
            };

            const maxScore = trustEngine.calculateScore(maxFactors);
            expect(maxScore).toBe(100);
        });
    });

    describe('Performance Tests', () => {
        it('should handle 1000 calculations efficiently', () => {
            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                const factors = {
                    identityVerified: i % 2 === 0,
                    profileComplete: i % 3 === 0,
                    skillVerified: i % 5 === 0
                };
                trustEngine.calculateScore(factors);
            }

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            // Should complete in less than 50ms for 1000 calculations
            expect(executionTime).toBeLessThan(50);
        });

        it('should handle concurrent calculations', async () => {
            const promises = Array(100)
                .fill(null)
                .map(async (_, i) => {
                    const factors = {
                        identityVerified: true,
                        profileComplete: i % 2 === 0,
                        skillVerified: true
                    };
                    return trustEngine.calculateScore(factors);
                });

            const results = await Promise.all(promises);

            // All results should be valid scores
            results.forEach(score => {
                expect(score).toBeGreaterThanOrEqual(0);
                expect(score).toBeLessThanOrEqual(100);
            });
        });
    });
});
