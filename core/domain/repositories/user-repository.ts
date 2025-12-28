/**
 * User Repository Interface
 * Port for user data access operations
 * @domain Repository (Port)
 */
import { User, UserRole, UserMetadata } from '../entities/user';

export interface FindUsersCriteria {
    role?: UserRole;
    minTrustScore?: number;
    maxTrustScore?: number;
    isVerified?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface UpdateUserData {
    email?: string;
    role?: UserRole;
    trustScore?: number;
    isVerified?: boolean;
    metadata?: UserMetadata;
}

export interface UserRepository {
    // Basic CRUD operations
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    save(user: User): Promise<User>;
    update(id: string, data: UpdateUserData): Promise<User | null>;
    delete(id: string): Promise<boolean>;

    // Batch operations
    findByIds(ids: string[]): Promise<User[]>;
    findByCriteria(criteria: FindUsersCriteria): Promise<{
        users: User[];
        total: number;
    }>;

    // Business-specific queries
    findByRole(role: UserRole): Promise<User[]>;
    findWithMinTrustScore(minScore: number): Promise<User[]>;
    findVerifiedUsers(): Promise<User[]>;

    // Statistics
    getStats(): Promise<{
        totalUsers: number;
        usersByRole: Record<UserRole, number>;
        averageTrustScore: number;
        verifiedCount: number;
    }>;

    // User-specific operations
    incrementTrustScore(id: string, amount: number): Promise<User | null>;
    updateVerification(id: string, isVerified: boolean): Promise<User | null>;
    updateProfile(id: string, metadata: UserMetadata): Promise<User | null>;

    // Existence checks
    existsById(id: string): Promise<boolean>;
    existsByEmail(email: string): Promise<boolean>;
}