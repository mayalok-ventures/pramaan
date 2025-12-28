/**
 * Database Client Singleton
 * Provides typed access to Cloudflare D1
 * @infrastructure Adapter
 */

export class DatabaseClient {
    private static instance: DatabaseClient;
    private db: any = null;
    private isInitialized = false;

    private constructor() { }

    /**
     * Get singleton instance
     */
    static getInstance(): DatabaseClient {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new DatabaseClient();
        }
        return DatabaseClient.instance;
    }

    /**
     * Initialize database connection
     */
    initialize(db: any): void {
        if (this.isInitialized) {
            console.warn('Database already initialized');
            return;
        }
        this.db = db;
        this.isInitialized = true;
    }

    /**
     * Check if database is initialized
     */
    isReady(): boolean {
        return this.isInitialized && this.db !== null;
    }

    /**
     * Get database instance
     */
    getDB(): any {
        if (!this.isReady()) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    /**
     * Execute a prepared statement with error handling
     */
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        try {
            if (!this.isReady()) {
                throw new Error('Database not initialized');
            }

            const stmt = this.db.prepare(sql);

            // Bind parameters if provided
            if (params.length > 0) {
                stmt.bind(...params);
            }

            const result = await stmt.all();
            return result.results as T[];
        } catch (error: any) {
            console.error('Database query failed:', {
                sql,
                params,
                error: error.message,
            });
            throw new Error(`Database error: ${error.message}`);
        }
    }

    /**
     * Execute a single row query
     */
    async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
        const results = await this.query<T>(sql, params);
        return results[0] || null;
    }

    /**
     * Execute an insert/update/delete query
     */
    async execute(sql: string, params: any[] = []): Promise<{ success: boolean; meta?: any }> {
        try {
            if (!this.isReady()) {
                throw new Error('Database not initialized');
            }

            const stmt = this.db.prepare(sql);

            if (params.length > 0) {
                stmt.bind(...params);
            }

            const result = await stmt.run();
            return {
                success: result.success,
                meta: result.meta,
            };
        } catch (error: any) {
            console.error('Database execute failed:', {
                sql,
                params,
                error: error.message,
            });
            throw new Error(`Database error: ${error.message}`);
        }
    }

    /**
     * Execute a transaction
     */
    async transaction<T>(operations: (db: any) => Promise<T>): Promise<T> {
        try {
            if (!this.isReady()) {
                throw new Error('Database not initialized');
            }

            // Start transaction
            await this.db.prepare('BEGIN TRANSACTION').run();

            try {
                // Execute operations
                const result = await operations(this.db);

                // Commit transaction
                await this.db.prepare('COMMIT').run();
                return result;
            } catch (error) {
                // Rollback on error
                await this.db.prepare('ROLLBACK').run();
                throw error;
            }
        } catch (error: any) {
            console.error('Database transaction failed:', error);
            throw new Error(`Transaction error: ${error.message}`);
        }
    }

    /**
     * Batch execute multiple queries
     */
    async batch(queries: Array<{ sql: string; params?: any[] }>): Promise<any[]> {
        try {
            if (!this.isReady()) {
                throw new Error('Database not initialized');
            }

            const statements = queries.map(q => {
                const stmt = this.db.prepare(q.sql);
                if (q.params && q.params.length > 0) {
                    stmt.bind(...q.params);
                }
                return stmt;
            });

            const results = await this.db.batch(statements);
            return results;
        } catch (error: any) {
            console.error('Database batch failed:', error);
            throw new Error(`Batch error: ${error.message}`);
        }
    }

    /**
     * Check if a table exists
     */
    async tableExists(tableName: string): Promise<boolean> {
        try {
            const result = await this.queryOne(
                "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
                [tableName]
            );
            return !!result;
        } catch (error) {
            console.error('Error checking table existence:', error);
            return false;
        }
    }

    /**
     * Get table schema
     */
    async getTableSchema(tableName: string): Promise<any> {
        try {
            return await this.query(`PRAGMA table_info(${tableName})`);
        } catch (error) {
            console.error('Error getting table schema:', error);
            return null;
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ healthy: boolean; message: string }> {
        try {
            if (!this.isReady()) {
                return { healthy: false, message: 'Database not initialized' };
            }

            await this.queryOne('SELECT 1 as healthy');
            return { healthy: true, message: 'Database is healthy' };
        } catch (error: any) {
            return { healthy: false, message: `Database error: ${error.message}` };
        }
    }
}

// Export singleton instance
export const db = DatabaseClient.getInstance();