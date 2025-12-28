/**
 * Job Repository Interface
 * Port for job data access operations
 * @domain Repository (Port)
 */
import { Job, JobStatus } from '../entities/job';

export interface FindJobsCriteria {
    companyId?: string;
    status?: JobStatus;
    minTrustScore?: number;
    maxTrustScore?: number;
    location?: string;
    remote?: boolean;
    search?: string;
    skills?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'newest' | 'trustScore' | 'salary';
}

export interface UpdateJobData {
    title?: string;
    description?: string;
    minTrustScore?: number;
    skills?: string[];
    location?: string;
    salaryRange?: string;
    status?: JobStatus;
    metadata?: any;
}

export interface JobRepository {
    // Basic CRUD operations
    findById(id: string): Promise<Job | null>;
    save(job: Job): Promise<Job>;
    update(id: string, data: UpdateJobData): Promise<Job | null>;
    delete(id: string): Promise<boolean>;

    // Batch operations
    findByIds(ids: string[]): Promise<Job[]>;
    findByCriteria(criteria: FindJobsCriteria): Promise<{
        jobs: Job[];
        total: number;
    }>;

    // Business-specific queries
    findByCompany(companyId: string): Promise<Job[]>;
    findByStatus(status: JobStatus): Promise<Job[]>;
    findActiveJobs(): Promise<Job[]>;
    findByMinTrustScore(maxScore: number): Promise<Job[]>;

    // Statistics
    getStats(): Promise<{
        totalJobs: number;
        jobsByStatus: Record<JobStatus, number>;
        averageMinTrustScore: number;
        activeCount: number;
    }>;

    // Job-specific operations
    updateStatus(id: string, status: JobStatus): Promise<Job | null>;
    incrementApplicationCount(id: string): Promise<Job | null>;

    // Matching operations
    findJobsForUser(userTrustScore: number, userSkills: string[]): Promise<Job[]>;

    // Existence checks
    existsById(id: string): Promise<boolean>;
}