/**
 * D1 Job Repository Implementation
 * Adapter for Cloudflare D1 database
 * @infrastructure Adapter
 */
import { Job, JobStatus, JobMetadata } from '../../domain/entities/job';
import { JobRepository, FindJobsCriteria, UpdateJobData } from '../../domain/repositories/job-repository';

export class D1JobRepository implements JobRepository {
    constructor(private readonly db: any) { }

    async findById(id: string): Promise<Job | null> {
        try {
            const result = await this.db
                .prepare('SELECT * FROM Job WHERE id = ?')
                .bind(id)
                .first();

            if (!result) return null;

            return this.mapToJob(result);
        } catch (error) {
            console.error('Error finding job by ID:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async save(job: Job): Promise<Job> {
        try {
            const result = await this.db
                .prepare(
                    `INSERT INTO Job (
            id, companyId, title, description, minTrustScore, skills, location, salaryRange,
            status, experience, employmentType, remote, benefits, applicationDeadline, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
                    job.id,
                    job.companyId,
                    job.title,
                    job.description,
                    job.minTrustScore,
                    JSON.stringify(job.skills),
                    job.location,
                    job.salaryRange,
                    job.status,
                    job.metadata.experience || null,
                    job.metadata.employmentType || null,
                    job.metadata.remote ? 1 : 0,
                    job.metadata.benefits ? JSON.stringify(job.metadata.benefits) : null,
                    job.metadata.applicationDeadline?.toISOString() || null,
                    job.createdAt.toISOString(),
                    job.updatedAt.toISOString()
                )
                .run();

            if (!result.success) {
                throw new Error('Failed to save job');
            }

            return job;
        } catch (error) {
            console.error('Error saving job:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async update(id: string, data: UpdateJobData): Promise<Job | null> {
        try {
            const updates: string[] = [];
            const params: any[] = [];

            if (data.title !== undefined) {
                updates.push('title = ?');
                params.push(data.title);
            }

            if (data.description !== undefined) {
                updates.push('description = ?');
                params.push(data.description);
            }

            if (data.minTrustScore !== undefined) {
                updates.push('minTrustScore = ?');
                params.push(data.minTrustScore);
            }

            if (data.skills !== undefined) {
                updates.push('skills = ?');
                params.push(JSON.stringify(data.skills));
            }

            if (data.location !== undefined) {
                updates.push('location = ?');
                params.push(data.location);
            }

            if (data.salaryRange !== undefined) {
                updates.push('salaryRange = ?');
                params.push(data.salaryRange);
            }

            if (data.status !== undefined) {
                updates.push('status = ?');
                params.push(data.status);
            }

            if (data.metadata !== undefined) {
                // Get current job to merge metadata
                const currentJob = await this.findById(id);
                if (currentJob) {
                    const mergedMetadata = { ...currentJob.metadata, ...data.metadata };

                    if (mergedMetadata.experience !== undefined) {
                        updates.push('experience = ?');
                        params.push(mergedMetadata.experience);
                    }

                    if (mergedMetadata.employmentType !== undefined) {
                        updates.push('employmentType = ?');
                        params.push(mergedMetadata.employmentType);
                    }

                    if (mergedMetadata.remote !== undefined) {
                        updates.push('remote = ?');
                        params.push(mergedMetadata.remote ? 1 : 0);
                    }

                    if (mergedMetadata.benefits !== undefined) {
                        updates.push('benefits = ?');
                        params.push(JSON.stringify(mergedMetadata.benefits));
                    }

                    if (mergedMetadata.applicationDeadline !== undefined) {
                        updates.push('applicationDeadline = ?');
                        params.push(mergedMetadata.applicationDeadline.toISOString());
                    }
                }
            }

            // Always update updatedAt
            updates.push('updatedAt = ?');
            params.push(new Date().toISOString());

            // Add ID for WHERE clause
            params.push(id);

            if (updates.length > 1) {
                const query = `UPDATE Job SET ${updates.join(', ')} WHERE id = ?`;

                const result = await this.db
                    .prepare(query)
                    .bind(...params)
                    .run();

                if (!result.success) {
                    throw new Error('Failed to update job');
                }
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating job:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('DELETE FROM Job WHERE id = ?')
                .bind(id)
                .run();

            return result.success;
        } catch (error) {
            console.error('Error deleting job:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByIds(ids: string[]): Promise<Job[]> {
        try {
            if (ids.length === 0) return [];

            const placeholders = ids.map(() => '?').join(',');
            const results = await this.db
                .prepare(`SELECT * FROM Job WHERE id IN (${placeholders}) ORDER BY createdAt DESC`)
                .bind(...ids)
                .all();

            return results.results.map((result: any) => this.mapToJob(result));
        } catch (error) {
            console.error('Error finding jobs by IDs:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByCriteria(criteria: FindJobsCriteria): Promise<{ jobs: Job[]; total: number }> {
        try {
            let query = `
        SELECT j.*, 
               COUNT(ja.id) as applicationCount
        FROM Job j
        LEFT JOIN JobApplication ja ON j.id = ja.jobId
        WHERE 1=1
      `;
            const params: any[] = [];

            if (criteria.companyId) {
                query += ' AND j.companyId = ?';
                params.push(criteria.companyId);
            }

            if (criteria.status) {
                query += ' AND j.status = ?';
                params.push(criteria.status);
            } else {
                // Default to active jobs
                query += ' AND j.status = "ACTIVE"';
            }

            if (criteria.minTrustScore !== undefined) {
                query += ' AND j.minTrustScore >= ?';
                params.push(criteria.minTrustScore);
            }

            if (criteria.maxTrustScore !== undefined) {
                query += ' AND j.minTrustScore <= ?';
                params.push(criteria.maxTrustScore);
            }

            if (criteria.location) {
                query += ' AND j.location LIKE ?';
                params.push(`%${criteria.location}%`);
            }

            if (criteria.remote === true) {
                query += ' AND j.remote = 1';
            }

            if (criteria.search) {
                query += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.skills LIKE ?)';
                const searchTerm = `%${criteria.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (criteria.skills && criteria.skills.length > 0) {
                const skillConditions = criteria.skills.map(skill => {
                    params.push(`%${skill}%`);
                    return 'j.skills LIKE ?';
                }).join(' OR ');
                query += ` AND (${skillConditions})`;
            }

            // Group by job ID
            query += ' GROUP BY j.id';

            // Get total count
            const countQuery = query.replace('SELECT j.*, COUNT(ja.id) as applicationCount', 'SELECT COUNT(DISTINCT j.id) as total');
            const countResult = await this.db
                .prepare(countQuery)
                .bind(...params)
                .first();
            const total = countResult?.total || 0;

            // Apply sorting
            if (criteria.sortBy === 'newest') {
                query += ' ORDER BY j.createdAt DESC';
            } else if (criteria.sortBy === 'trustScore') {
                query += ' ORDER BY j.minTrustScore ASC';
            } else if (criteria.sortBy === 'salary') {
                query += ' ORDER BY j.salaryRange DESC';
            } else {
                query += ' ORDER BY j.createdAt DESC';
            }

            // Apply pagination
            if (criteria.limit !== undefined) {
                query += ' LIMIT ?';
                params.push(criteria.limit);
            }

            if (criteria.offset !== undefined) {
                query += ' OFFSET ?';
                params.push(criteria.offset);
            }

            const results = await this.db
                .prepare(query)
                .bind(...params)
                .all();

            const jobs = results.results.map((result: any) => this.mapToJob(result));

            return { jobs, total };
        } catch (error) {
            console.error('Error finding jobs by criteria:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByCompany(companyId: string): Promise<Job[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM Job WHERE companyId = ? ORDER BY createdAt DESC')
                .bind(companyId)
                .all();

            return results.results.map((result: any) => this.mapToJob(result));
        } catch (error) {
            console.error('Error finding jobs by company:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByStatus(status: JobStatus): Promise<Job[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM Job WHERE status = ? ORDER BY createdAt DESC')
                .bind(status)
                .all();

            return results.results.map((result: any) => this.mapToJob(result));
        } catch (error) {
            console.error('Error finding jobs by status:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findActiveJobs(): Promise<Job[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM Job WHERE status = "ACTIVE" ORDER BY createdAt DESC')
                .all();

            return results.results.map((result: any) => this.mapToJob(result));
        } catch (error) {
            console.error('Error finding active jobs:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByMinTrustScore(maxScore: number): Promise<Job[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM Job WHERE minTrustScore <= ? AND status = "ACTIVE" ORDER BY minTrustScore ASC')
                .bind(maxScore)
                .all();

            return results.results.map((result: any) => this.mapToJob(result));
        } catch (error) {
            console.error('Error finding jobs by min trust score:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getStats(): Promise<{
        totalJobs: number;
        jobsByStatus: Record<JobStatus, number>;
        averageMinTrustScore: number;
        activeCount: number;
    }> {
        try {
            // Get total jobs
            const totalResult = await this.db
                .prepare('SELECT COUNT(*) as total FROM Job')
                .first();
            const totalJobs = totalResult?.total || 0;

            // Get jobs by status
            const statusResult = await this.db
                .prepare('SELECT status, COUNT(*) as count FROM Job GROUP BY status')
                .all();

            const jobsByStatus: Record<JobStatus, number> = {
                ACTIVE: 0,
                INACTIVE: 0,
                CLOSED: 0,
                DRAFT: 0,
            };

            statusResult.results.forEach((row: any) => {
                jobsByStatus[row.status as JobStatus] = row.count;
            });

            // Get average min trust score
            const avgResult = await this.db
                .prepare('SELECT AVG(minTrustScore) as average FROM Job WHERE status = "ACTIVE"')
                .first();
            const averageMinTrustScore = avgResult?.average || 0;

            // Get active count
            const activeResult = await this.db
                .prepare('SELECT COUNT(*) as count FROM Job WHERE status = "ACTIVE"')
                .first();
            const activeCount = activeResult?.count || 0;

            return {
                totalJobs,
                jobsByStatus,
                averageMinTrustScore: Math.round(averageMinTrustScore),
                activeCount,
            };
        } catch (error) {
            console.error('Error getting job stats:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateStatus(id: string, status: JobStatus): Promise<Job | null> {
        try {
            await this.db
                .prepare('UPDATE Job SET status = ?, updatedAt = ? WHERE id = ?')
                .bind(status, new Date().toISOString(), id)
                .run();

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating job status:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async incrementApplicationCount(id: string): Promise<Job | null> {
        // This is handled automatically by the JobApplication table
        // We'll just return the updated job
        return await this.findById(id);
    }

    async findJobsForUser(userTrustScore: number, userSkills: string[]): Promise<Job[]> {
        try {
            // Find jobs that match user's trust score
            let query = `
        SELECT j.*, 
               COUNT(ja.id) as applicationCount
        FROM Job j
        LEFT JOIN JobApplication ja ON j.id = ja.jobId
        WHERE j.status = "ACTIVE"
          AND j.minTrustScore <= ?
      `;
            const params: any[] = [userTrustScore];

            // If user has skills, prioritize jobs that match those skills
            if (userSkills.length > 0) {
                const skillConditions = userSkills.map(skill => {
                    params.push(`%${skill}%`);
                    return 'j.skills LIKE ?';
                }).join(' OR ');

                query += ` AND (${skillConditions})`;

                // Order by skill match count
                query += ' ORDER BY (';
                userSkills.forEach((skill, index) => {
                    if (index > 0) query += ' + ';
                    query += 'CASE WHEN j.skills LIKE ? THEN 1 ELSE 0 END';
                    params.push(`%${skill}%`);
                });
                query += ') DESC, j.minTrustScore ASC';
            } else {
                query += ' ORDER BY j.minTrustScore ASC';
            }

            query += ' LIMIT 50';

            const results = await this.db
                .prepare(query)
                .bind(...params)
                .all();

            return results.results.map((result: any) => this.mapToJob(result));
        } catch (error) {
            console.error('Error finding jobs for user:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async existsById(id: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('SELECT 1 FROM Job WHERE id = ?')
                .bind(id)
                .first();

            return !!result;
        } catch (error) {
            console.error('Error checking job existence by ID:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private mapToJob(result: any): Job {
        let skills: string[];
        try {
            skills = typeof result.skills === 'string'
                ? JSON.parse(result.skills)
                : result.skills || [];
        } catch {
            skills = [];
        }

        let benefits: string[] = [];
        if (result.benefits) {
            try {
                benefits = typeof result.benefits === 'string'
                    ? JSON.parse(result.benefits)
                    : result.benefits;
            } catch {
                benefits = [];
            }
        }

        const metadata: JobMetadata = {
            experience: result.experience || undefined,
            employmentType: result.employmentType as any || undefined,
            remote: result.remote === 1,
            benefits,
            applicationDeadline: result.applicationDeadline ? new Date(result.applicationDeadline) : undefined,
        };

        return new Job(
            result.id,
            result.companyId,
            result.title,
            result.description,
            result.minTrustScore,
            skills,
            result.location,
            result.salaryRange,
            result.status as JobStatus,
            metadata,
            new Date(result.createdAt),
            new Date(result.updatedAt)
        );
    }
}