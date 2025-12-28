/**
 * D1 Content Repository Implementation
 * Adapter for Cloudflare D1 database
 * @infrastructure Adapter
 */
import { Content, ContentType, ContentMetadata } from '../../domain/entities/content';
import { ContentRepository, FindContentCriteria, UpdateContentData } from '../../domain/repositories/content-repository';

export class D1ContentRepository implements ContentRepository {
    constructor(private readonly db: any) { }

    async findById(id: string): Promise<Content | null> {
        try {
            const result = await this.db
                .prepare('SELECT * FROM Content WHERE id = ?')
                .bind(id)
                .first();

            if (!result) return null;

            return this.mapToContent(result);
        } catch (error) {
            console.error('Error finding content by ID:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByUrl(url: string): Promise<Content | null> {
        try {
            const result = await this.db
                .prepare('SELECT * FROM Content WHERE url = ?')
                .bind(url)
                .first();

            if (!result) return null;

            return this.mapToContent(result);
        } catch (error) {
            console.error('Error finding content by URL:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async save(content: Content): Promise<Content> {
        try {
            const result = await this.db
                .prepare(
                    `INSERT INTO Content (
            id, creatorId, url, title, description, type, isVerifiedByCompany, tags,
            duration, videoCount, category, difficulty, language, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
                    content.id,
                    content.creatorId,
                    content.url,
                    content.title,
                    content.description,
                    content.type,
                    content.isVerifiedByCompany ? 1 : 0,
                    JSON.stringify(content.tags),
                    content.metadata.duration || null,
                    content.metadata.videoCount || null,
                    content.metadata.category || null,
                    content.metadata.difficulty || null,
                    content.metadata.language || null,
                    content.createdAt.toISOString(),
                    content.updatedAt.toISOString()
                )
                .run();

            if (!result.success) {
                throw new Error('Failed to save content');
            }

            return content;
        } catch (error) {
            console.error('Error saving content:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async update(id: string, data: UpdateContentData): Promise<Content | null> {
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

            if (data.tags !== undefined) {
                updates.push('tags = ?');
                params.push(JSON.stringify(data.tags));
            }

            if (data.isVerifiedByCompany !== undefined) {
                updates.push('isVerifiedByCompany = ?');
                params.push(data.isVerifiedByCompany ? 1 : 0);
            }

            if (data.metadata !== undefined) {
                // Get current content to merge metadata
                const currentContent = await this.findById(id);
                if (currentContent) {
                    const mergedMetadata = { ...currentContent.metadata, ...data.metadata };

                    if (mergedMetadata.duration !== undefined) {
                        updates.push('duration = ?');
                        params.push(mergedMetadata.duration);
                    }

                    if (mergedMetadata.videoCount !== undefined) {
                        updates.push('videoCount = ?');
                        params.push(mergedMetadata.videoCount);
                    }

                    if (mergedMetadata.category !== undefined) {
                        updates.push('category = ?');
                        params.push(mergedMetadata.category);
                    }

                    if (mergedMetadata.difficulty !== undefined) {
                        updates.push('difficulty = ?');
                        params.push(mergedMetadata.difficulty);
                    }

                    if (mergedMetadata.language !== undefined) {
                        updates.push('language = ?');
                        params.push(mergedMetadata.language);
                    }
                }
            }

            // Always update updatedAt
            updates.push('updatedAt = ?');
            params.push(new Date().toISOString());

            // Add ID for WHERE clause
            params.push(id);

            if (updates.length > 1) {
                const query = `UPDATE Content SET ${updates.join(', ')} WHERE id = ?`;

                const result = await this.db
                    .prepare(query)
                    .bind(...params)
                    .run();

                if (!result.success) {
                    throw new Error('Failed to update content');
                }
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating content:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('DELETE FROM Content WHERE id = ?')
                .bind(id)
                .run();

            return result.success;
        } catch (error) {
            console.error('Error deleting content:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByIds(ids: string[]): Promise<Content[]> {
        try {
            if (ids.length === 0) return [];

            const placeholders = ids.map(() => '?').join(',');
            const results = await this.db
                .prepare(`SELECT * FROM Content WHERE id IN (${placeholders}) ORDER BY createdAt DESC`)
                .bind(...ids)
                .all();

            return results.results.map((result: any) => this.mapToContent(result));
        } catch (error) {
            console.error('Error finding content by IDs:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByCriteria(criteria: FindContentCriteria): Promise<{ contents: Content[]; total: number }> {
        try {
            let query = `
        SELECT c.*, 
               COUNT(ucp.userId) as enrollmentCount,
               AVG(ucp.progress) as avgProgress
        FROM Content c
        LEFT JOIN UserContentProgress ucp ON c.id = ucp.contentId
        WHERE 1=1
      `;
            const params: any[] = [];

            if (criteria.creatorId) {
                query += ' AND c.creatorId = ?';
                params.push(criteria.creatorId);
            }

            if (criteria.type) {
                query += ' AND c.type = ?';
                params.push(criteria.type);
            }

            if (criteria.isVerifiedByCompany !== undefined) {
                query += ' AND c.isVerifiedByCompany = ?';
                params.push(criteria.isVerifiedByCompany ? 1 : 0);
            }

            if (criteria.search) {
                query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
                const searchTerm = `%${criteria.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (criteria.tags && criteria.tags.length > 0) {
                const tagConditions = criteria.tags.map(tag => {
                    params.push(`%${tag}%`);
                    return 'c.tags LIKE ?';
                }).join(' OR ');
                query += ` AND (${tagConditions})`;
            }

            // Group by content ID
            query += ' GROUP BY c.id';

            // Get total count
            const countQuery = query.replace('SELECT c.*, COUNT(ucp.userId) as enrollmentCount, AVG(ucp.progress) as avgProgress', 'SELECT COUNT(DISTINCT c.id) as total');
            const countResult = await this.db
                .prepare(countQuery)
                .bind(...params)
                .first();
            const total = countResult?.total || 0;

            // Apply sorting and pagination
            query += ' ORDER BY c.createdAt DESC';

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

            const contents = results.results.map((result: any) => this.mapToContent(result));

            return { contents, total };
        } catch (error) {
            console.error('Error finding content by criteria:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByCreator(creatorId: string): Promise<Content[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM Content WHERE creatorId = ? ORDER BY createdAt DESC')
                .bind(creatorId)
                .all();

            return results.results.map((result: any) => this.mapToContent(result));
        } catch (error) {
            console.error('Error finding content by creator:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByType(type: ContentType): Promise<Content[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM Content WHERE type = ? ORDER BY createdAt DESC')
                .bind(type)
                .all();

            return results.results.map((result: any) => this.mapToContent(result));
        } catch (error) {
            console.error('Error finding content by type:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findVerifiedContent(): Promise<Content[]> {
        try {
            const results = await this.db
                .prepare('SELECT * FROM Content WHERE isVerifiedByCompany = 1 ORDER BY createdAt DESC')
                .all();

            return results.results.map((result: any) => this.mapToContent(result));
        } catch (error) {
            console.error('Error finding verified content:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByTags(tags: string[]): Promise<Content[]> {
        try {
            if (tags.length === 0) return [];

            const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
            const searchTerms = tags.map(tag => `%${tag}%`);

            const results = await this.db
                .prepare(`SELECT * FROM Content WHERE ${tagConditions} ORDER BY createdAt DESC`)
                .bind(...searchTerms)
                .all();

            return results.results.map((result: any) => this.mapToContent(result));
        } catch (error) {
            console.error('Error finding content by tags:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getStats(): Promise<{
        totalContent: number;
        contentByType: Record<ContentType, number>;
        verifiedCount: number;
        averageEnrollment: number;
    }> {
        try {
            // Get total content
            const totalResult = await this.db
                .prepare('SELECT COUNT(*) as total FROM Content')
                .first();
            const totalContent = totalResult?.total || 0;

            // Get content by type
            const typeResult = await this.db
                .prepare('SELECT type, COUNT(*) as count FROM Content GROUP BY type')
                .all();

            const contentByType: Record<ContentType, number> = {
                VIDEO: 0,
                PLAYLIST: 0,
            };

            typeResult.results.forEach((row: any) => {
                contentByType[row.type as ContentType] = row.count;
            });

            // Get verified count
            const verifiedResult = await this.db
                .prepare('SELECT COUNT(*) as count FROM Content WHERE isVerifiedByCompany = 1')
                .first();
            const verifiedCount = verifiedResult?.count || 0;

            // Get average enrollment
            const enrollmentResult = await this.db
                .prepare(`
          SELECT AVG(enrollment_count) as average 
          FROM (
            SELECT COUNT(userId) as enrollment_count 
            FROM UserContentProgress 
            GROUP BY contentId
          )
        `)
                .first();
            const averageEnrollment = enrollmentResult?.average || 0;

            return {
                totalContent,
                contentByType,
                verifiedCount,
                averageEnrollment: Math.round(averageEnrollment),
            };
        } catch (error) {
            console.error('Error getting content stats:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateVerification(id: string, isVerified: boolean): Promise<Content | null> {
        try {
            await this.db
                .prepare('UPDATE Content SET isVerifiedByCompany = ?, updatedAt = ? WHERE id = ?')
                .bind(isVerified ? 1 : 0, new Date().toISOString(), id)
                .run();

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating content verification:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async incrementEnrollmentCount(id: string): Promise<Content | null> {
        // Note: This is handled automatically by the UserContentProgress table
        // We'll just return the updated content
        return await this.findById(id);
    }

    async existsById(id: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('SELECT 1 FROM Content WHERE id = ?')
                .bind(id)
                .first();

            return !!result;
        } catch (error) {
            console.error('Error checking content existence by ID:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async existsByUrl(url: string): Promise<boolean> {
        try {
            const result = await this.db
                .prepare('SELECT 1 FROM Content WHERE url = ?')
                .bind(url)
                .first();

            return !!result;
        } catch (error) {
            console.error('Error checking content existence by URL:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private mapToContent(result: any): Content {
        let tags: string[];
        try {
            tags = typeof result.tags === 'string'
                ? JSON.parse(result.tags)
                : result.tags || [];
        } catch {
            tags = [];
        }

        const metadata: ContentMetadata = {
            duration: result.duration || undefined,
            videoCount: result.videoCount || undefined,
            category: result.category || undefined,
            difficulty: result.difficulty || undefined,
            language: result.language || undefined,
        };

        return new Content(
            result.id,
            result.creatorId,
            result.url,
            result.title,
            result.description,
            result.type as ContentType,
            result.isVerifiedByCompany === 1,
            tags,
            metadata,
            new Date(result.createdAt),
            new Date(result.updatedAt)
        );
    }
}