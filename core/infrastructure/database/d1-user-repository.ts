/**
 * D1 User Repository Implementation
 * Adapter for Cloudflare D1 database
 * @infrastructure Adapter
 */
import { User, UserRole, UserMetadata } from '../../domain/entities/user';
import { UserRepository, FindUsersCriteria, UpdateUserData } from '../../domain/repositories/user-repository';

export class D1UserRepository implements UserRepository {
    constructor(private readonly db: any) { }

    async findById(id: string): Promise<User | null> {
        try {
            const result = await this.db
                .prepare('SELECT * FROM User WHERE id = ?')
                .bind(id)
                .first();

            if (!result) return null;

            return this.mapToUser(result);
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        try {
            const result = await this.db
                .prepare('SELECT * FROM User WHERE email = ?')
                .bind(email)
                .first();

            if (!result) return null;

            return this.mapToUser(result);
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async save(user: User): Promise<User> {
        try {
            const result = await this.db
                .prepare(
                    `INSERT INTO User (id, email, role, trustScore, isVerified, metadata, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
                    user.id,
                    user.email,
                    user.role,
                    user.trustScore,
                    user.isVerified ? 1 : 0,
                    JSON.stringify(user.metadata),
                    user.createdAt.toISOString(),
                    user.updatedAt.toISOString()
                )
                .run();

            if (!result.success) {
                throw new Error('Failed to save user');
            }

            return user;
        } catch (error) {
            console.error('Error saving user:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async update(id: string, data: UpdateUserData): Promise<User | null> {
        try {
            // Build dynamic update query
            const updates: string[] = [];
            const params: any[] = [];

            if (data.email !== undefined) {
                updates.push('email = ?');
                params.push(data.email);
            }

            if (data.role !== undefined) {
                updates.push('role = ?');
                params.push(data.role);
            }

            if (data.trustScore !== undefined) {
                updates.push('trustScore = ?');
                params.push(data.trustScore);
            }

            if (data.isVerified !== undefined) {
                updates.push('isVerified = ?');
                params.push(data.isVerified ? 1 : 0);
            }

            if (data.metadata !== undefined) {
                // Get current metadata to merge
                const currentUser = await this.findById(id);
                if (currentUser) {
                    const mergedMetadata = { ...currentUser.metadata, ...data.metadata };
                    updates.push('metadata = ?');
                    params.push(JSON.stringify(mergedMetadata));
                }
            }

            // Always update updatedAt
            updates.push('updatedAt = ?');
            params.push(new Date().toISOString());

            // Add ID for WHERE clause
            params.push(id);

            if (updates.length > 1) { // More than just updatedAt
                const query = `UPDATE User SET ${updates.join(', ')} WHERE id = ?`;

                const result = await this.db
                    .prepare(query)
                    .bind(...params)
                    .run();

                if (!result.success) {
                    throw new Error('Failed to update user');
                }
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('DELETE FROM User WHERE id = ?')
                .bind(id)
                .run();

            return result.success;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByIds(ids: string[]): Promise<User[]> {
        try {
            if (ids.length === 0) return [];

            const placeholders = ids.map(() => '?').join(',');
            const results = await this.db
                .prepare(`SELECT * FROM User WHERE id IN (${placeholders})`)
                .bind(...ids)
                .all();

            return results.results.map((result: any) => this.mapToUser(result));
        } catch (error) {
            console.error('Error finding users by IDs:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByCriteria(criteria: FindUsersCriteria): Promise<{ users: User[]; total: number }> {
        try {
            let query = 'SELECT * FROM User WHERE 1=1';
            const params: any[] = [];

            if (criteria.role) {
                query += ' AND role = ?';
                params.push(criteria.role);
            }

            if (criteria.minTrustScore !== undefined) {
                query += ' AND trustScore >= ?';
                params.push(criteria.minTrustScore);
            }

            if (criteria.maxTrustScore !== undefined) {
                query += ' AND trustScore <= ?';
                params.push(criteria.maxTrustScore);
            }

            if (criteria.isVerified !== undefined) {
                query += ' AND isVerified = ?';
                params.push(criteria.isVerified ? 1 : 0);
            }

            if (criteria.search) {
                query += ' AND (email LIKE ? OR metadata LIKE ?)';
                const searchTerm = `%${criteria.search}%`;
                params.push(searchTerm, searchTerm);
            }

            // Get total count
            const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
            const countResult = await this.db
                .prepare(countQuery)
                .bind(...params)
                .first();
            const total = countResult?.total || 0;

            // Apply pagination
            query += ' ORDER BY trustScore DESC';

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

            const users = results.results.map((result: any) => this.mapToUser(result));

            return { users, total };
        } catch (error) {
            console.error('Error finding users by criteria:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByRole(role: UserRole): Promise<User[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM User WHERE role = ? ORDER BY trustScore DESC')
                .bind(role)
                .all();

            return results.results.map((result: any) => this.mapToUser(result));
        } catch (error) {
            console.error('Error finding users by role:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findWithMinTrustScore(minScore: number): Promise<User[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM User WHERE trustScore >= ? ORDER BY trustScore DESC')
                .bind(minScore)
                .all();

            return results.results.map((result: any) => this.mapToUser(result));
        } catch (error) {
            console.error('Error finding users with min trust score:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findVerifiedUsers(): Promise<User[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM User WHERE isVerified = 1 ORDER BY trustScore DESC')
                .all();

            return results.results.map((result: any) => this.mapToUser(result));
        } catch (error) {
            console.error('Error finding verified users:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getStats(): Promise<{
        totalUsers: number;
        usersByRole: Record<UserRole, number>;
        averageTrustScore: number;
        verifiedCount: number;
    }> {
        try {
            // Get total users
            const totalResult = await this.db
                .prepare('SELECT COUNT(*) as total FROM User')
                .first();
            const totalUsers = totalResult?.total || 0;

            // Get users by role
            const roleResult = await this.db
                .prepare('SELECT role, COUNT(*) as count FROM User GROUP BY role')
                .all();

            const usersByRole: Record<UserRole, number> = {
                USER: 0,
                MEDIA: 0,
                BUSINESS: 0,
            };

            roleResult.results.forEach((row: any) => {
                usersByRole[row.role as UserRole] = row.count;
            });

            // Get average trust score
            const avgResult = await this.db
                .prepare('SELECT AVG(trustScore) as average FROM User')
                .first();
            const averageTrustScore = avgResult?.average || 0;

            // Get verified count
            const verifiedResult = await this.db
                .prepare('SELECT COUNT(*) as count FROM User WHERE isVerified = 1')
                .first();
            const verifiedCount = verifiedResult?.count || 0;

            return {
                totalUsers,
                usersByRole,
                averageTrustScore: Math.round(averageTrustScore),
                verifiedCount,
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async incrementTrustScore(id: string, amount: number): Promise<User | null> {
        try {
            await this.db
                .prepare('UPDATE User SET trustScore = trustScore + ?, updatedAt = ? WHERE id = ?')
                .bind(amount, new Date().toISOString(), id)
                .run();

            return await this.findById(id);
        } catch (error) {
            console.error('Error incrementing trust score:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateVerification(id: string, isVerified: boolean): Promise<User | null> {
        try {
            await this.db
                .prepare('UPDATE User SET isVerified = ?, updatedAt = ? WHERE id = ?')
                .bind(isVerified ? 1 : 0, new Date().toISOString(), id)
                .run();

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating verification:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateProfile(id: string, metadata: UserMetadata): Promise<User | null> {
        try {
            const currentUser = await this.findById(id);
            if (!currentUser) return null;

            const mergedMetadata = { ...currentUser.metadata, ...metadata };

            await this.db
                .prepare('UPDATE User SET metadata = ?, updatedAt = ? WHERE id = ?')
                .bind(JSON.stringify(mergedMetadata), new Date().toISOString(), id)
                .run();

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async existsById(id: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('SELECT 1 FROM User WHERE id = ?')
                .bind(id)
                .first();

            return !!result;
        } catch (error) {
            console.error('Error checking user existence by ID:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async existsByEmail(email: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('SELECT 1 FROM User WHERE email = ?')
                .bind(email)
                .first();

            return !!result;
        } catch (error) {
            console.error('Error checking user existence by email:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private mapToUser(result: any): User {
        let metadata: UserMetadata;
        try {
            metadata = typeof result.metadata === 'string'
                ? JSON.parse(result.metadata)
                : result.metadata || {};
        } catch {
            metadata = {};
        }

        return new User(
            result.id,
            result.email,
            result.role as UserRole,
            result.trustScore,
            result.isVerified === 1,
            metadata,
            new Date(result.createdAt),
            new Date(result.updatedAt)
        );
    }
}