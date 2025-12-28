/**
 * Clerk Authentication Adapter
 * Adapter for Clerk authentication service
 * @infrastructure Adapter
 */
import { clerkClient } from '@clerk/nextjs/server';
import { User, UserRole, UserMetadata } from '../../domain/entities/user';

export interface ClerkUser {
    id: string;
    emailAddresses: { emailAddress: string }[];
    firstName?: string;
    lastName?: string;
    publicMetadata: {
        role?: UserRole;
        trustScore?: number;
        isVerified?: boolean;
    };
}

export interface CreateClerkUserInput {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    metadata?: {
        role?: UserRole;
        trustScore?: number;
        isVerified?: boolean;
    };
}

export interface UpdateClerkUserInput {
    userId: string;
    metadata?: Record<string, any>;
    publicMetadata?: Record<string, any>;
}

export class ClerkAuthAdapter {
    private client: any;

    constructor() {
        // Clerk client is initialized globally via @clerk/nextjs
    }

    /**
     * Get Clerk client instance
     */
    private async getClient() {
        if (!this.client) {
            this.client = await clerkClient();
        }
        return this.client;
    }

    /**
     * Create a new user in Clerk
     */
    async createUser(input: CreateClerkUserInput): Promise<ClerkUser> {
        try {
            const client = await this.getClient();

            const user = await client.users.createUser({
                emailAddress: [input.email],
                password: input.password,
                firstName: input.firstName,
                lastName: input.lastName,
                publicMetadata: input.metadata || {},
            });

            return this.mapToClerkUser(user);
        } catch (error: any) {
            console.error('Error creating Clerk user:', error);
            throw new Error(`Clerk authentication error: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<ClerkUser | null> {
        try {
            const client = await this.getClient();

            const user = await client.users.getUser(userId);
            return this.mapToClerkUser(user);
        } catch (error: any) {
            console.error('Error getting Clerk user:', error);
            return null;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<ClerkUser | null> {
        try {
            const client = await this.getClient();

            const users = await client.users.getUserList({
                emailAddress: [email],
            });

            if (users.length === 0) return null;

            return this.mapToClerkUser(users[0]);
        } catch (error: any) {
            console.error('Error getting Clerk user by email:', error);
            return null;
        }
    }

    /**
     * Update user in Clerk
     */
    async updateUser(input: UpdateClerkUserInput): Promise<ClerkUser> {
        try {
            const client = await this.getClient();

            const updateData: any = {};

            if (input.metadata) {
                updateData.privateMetadata = input.metadata;
            }

            if (input.publicMetadata) {
                updateData.publicMetadata = input.publicMetadata;
            }

            const user = await client.users.updateUser(input.userId, updateData);
            return this.mapToClerkUser(user);
        } catch (error: any) {
            console.error('Error updating Clerk user:', error);
            throw new Error(`Clerk update error: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Update user role in Clerk
     */
    async updateUserRole(userId: string, role: UserRole): Promise<ClerkUser> {
        try {
            const client = await this.getClient();

            const user = await client.users.updateUser(userId, {
                publicMetadata: { role },
            });

            return this.mapToClerkUser(user);
        } catch (error: any) {
            console.error('Error updating user role in Clerk:', error);
            throw new Error(`Clerk role update error: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Update user trust score in Clerk
     */
    async updateUserTrustScore(userId: string, trustScore: number): Promise<ClerkUser> {
        try {
            const client = await this.getClient();

            const user = await client.users.updateUser(userId, {
                publicMetadata: { trustScore },
            });

            return this.mapToClerkUser(user);
        } catch (error: any) {
            console.error('Error updating trust score in Clerk:', error);
            throw new Error(`Clerk trust score update error: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Update user verification status in Clerk
     */
    async updateUserVerification(userId: string, isVerified: boolean): Promise<ClerkUser> {
        try {
            const client = await this.getClient();

            const user = await client.users.updateUser(userId, {
                publicMetadata: { isVerified },
            });

            return this.mapToClerkUser(user);
        } catch (error: any) {
            console.error('Error updating verification in Clerk:', error);
            throw new Error(`Clerk verification update error: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Delete user from Clerk
     */
    async deleteUser(userId: string): Promise<boolean> {
        try {
            const client = await this.getClient();

            await client.users.deleteUser(userId);
            return true;
        } catch (error: any) {
            console.error('Error deleting user from Clerk:', error);
            return false;
        }
    }

    /**
     * Create a session for user
     */
    async createSession(userId: string, expiresInSeconds: number = 60 * 60 * 24 * 7): Promise<string> {
        try {
            const client = await this.getClient();

            const session = await client.sessions.createSession({
                userId,
                expiresInSeconds,
            });

            return session.getToken();
        } catch (error: any) {
            console.error('Error creating session in Clerk:', error);
            throw new Error(`Clerk session error: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Verify user authentication
     */
    async verifyAuthentication(authHeader: string): Promise<{ userId: string; metadata: any } | null> {
        try {
            const client = await this.getClient();

            // Extract token from header
            const token = authHeader.replace('Bearer ', '');

            // Verify token with Clerk
            const session = await client.sessions.verifySession(token);

            if (!session || session.status !== 'active') {
                return null;
            }

            // Get user data
            const user = await this.getUserById(session.userId);
            if (!user) return null;

            return {
                userId: user.id,
                metadata: user.publicMetadata,
            };
        } catch (error: any) {
            console.error('Error verifying authentication:', error);
            return null;
        }
    }

    /**
     * Map Clerk user to our domain model
     */
    async mapToDomainUser(clerkUser: ClerkUser): Promise<User> {
        const metadata: UserMetadata = {
            name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : undefined,
        };

        return new User(
            clerkUser.id,
            clerkUser.emailAddresses[0]?.emailAddress || '',
            clerkUser.publicMetadata?.role as UserRole || 'USER',
            clerkUser.publicMetadata?.trustScore || 0,
            clerkUser.publicMetadata?.isVerified || false,
            metadata
        );
    }

    /**
     * Map Clerk API response to ClerkUser interface
     */
    private mapToClerkUser(user: any): ClerkUser {
        return {
            id: user.id,
            emailAddresses: user.emailAddresses || [],
            firstName: user.firstName,
            lastName: user.lastName,
            publicMetadata: user.publicMetadata || {},
        };
    }
}