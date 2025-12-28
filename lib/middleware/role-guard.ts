/**
 * Role-Based Access Control Middleware
 * Enforces role-based permissions for route access
 * @middleware
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export type UserRole = 'USER' | 'MEDIA' | 'BUSINESS';

export interface RoutePermission {
    path: string;
    methods?: string[];
    roles: UserRole[];
}

export class RoleGuard {
    private static instance: RoleGuard;
    private routePermissions: RoutePermission[] = [];

    private constructor() {
        this.initializePermissions();
    }

    static getInstance(): RoleGuard {
        if (!RoleGuard.instance) {
            RoleGuard.instance = new RoleGuard();
        }
        return RoleGuard.instance;
    }

    /**
     * Initialize route permissions
     * @timeComplexity O(1) - Constant initialization
     */
    private initializePermissions(): void {
        this.routePermissions = [
            // API Routes
            { path: '/api/content', methods: ['POST'], roles: ['MEDIA'] },
            { path: '/api/jobs', methods: ['POST'], roles: ['BUSINESS'] },
            { path: '/api/jobs/[id]/apply', methods: ['POST'], roles: ['USER', 'BUSINESS'] },

            // Page Routes
            { path: '/knowledge/videos/new', roles: ['MEDIA'] },
            { path: '/knowledge/playlists/new', roles: ['MEDIA'] },
            { path: '/jobs/new', roles: ['BUSINESS'] },
            { path: '/dashboard', roles: ['USER', 'MEDIA', 'BUSINESS'] },
            { path: '/knowledge', roles: ['USER', 'MEDIA', 'BUSINESS'] },
            { path: '/jobs', roles: ['USER', 'BUSINESS'] },

            // Profile access rules
            { path: '/profile/[id]', roles: ['USER', 'MEDIA', 'BUSINESS'] },
        ];
    }

    /**
     * Check if user has permission to access route
     * @param request Next.js request object
     * @param userRole User's role from Clerk
     * @returns boolean indicating permission
     * @timeComplexity O(n) where n is number of route permissions
     */
    async hasPermission(request: NextRequest, userRole?: UserRole): Promise<boolean> {
        const { pathname } = request.nextUrl;
        const method = request.method;

        // Public routes that don't require authentication
        const publicRoutes = ['/', '/login', '/signup', '/api/auth/(.*)'];
        if (publicRoutes.some(route => pathname.match(new RegExp(route)))) {
            return true;
        }

        // If no user role, deny access
        if (!userRole) {
            return false;
        }

        // Find matching route permission
        const matchedPermission = this.routePermissions.find(permission => {
            // Convert route pattern to regex
            const pattern = permission.path
                .replace(/\[([^\]]+)\]/g, '([^/]+)')
                .replace(/\//g, '\\/');
            const regex = new RegExp(`^${pattern}$`);

            const pathMatches = regex.test(pathname);
            const methodMatches = !permission.methods || permission.methods.includes(method);

            return pathMatches && methodMatches;
        });

        // If no specific permission, allow access
        if (!matchedPermission) {
            return true;
        }

        // Check if user role is allowed
        return matchedPermission.roles.includes(userRole);
    }

    /**
     * Middleware handler for Next.js
     * @param request Next.js request object
     * @returns NextResponse or undefined
     */
    async middleware(request: NextRequest): Promise<NextResponse | undefined> {
        try {
            const { userId, sessionClaims } = await auth();
            const userRole = (sessionClaims as { metadata?: { role?: string } })?.metadata?.role as UserRole;

            const hasAccess = await this.hasPermission(request, userRole);

            if (!hasAccess) {
                return new NextResponse(
                    JSON.stringify({
                        error: 'Access denied',
                        message: 'You do not have permission to access this resource'
                    }),
                    {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Add user role to headers for downstream use
            const response = NextResponse.next();
            if (userRole) {
                response.headers.set('X-User-Role', userRole);
            }

            return response;
        } catch (error) {
            console.error('Role guard error:', error);
            return new NextResponse(
                JSON.stringify({ error: 'Internal server error' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    /**
     * Get all permissions for a specific role
     * @param role User role
     * @returns Array of allowed routes
     */
    getPermissionsForRole(role: UserRole): RoutePermission[] {
        return this.routePermissions.filter(permission =>
            permission.roles.includes(role)
        );
    }

    /**
     * Add dynamic permission at runtime
     * @param permission Route permission to add
     */
    addPermission(permission: RoutePermission): void {
        this.routePermissions.push(permission);
    }

    /**
     * Remove permission at runtime
     * @param path Route path to remove
     */
    removePermission(path: string): void {
        this.routePermissions = this.routePermissions.filter(p => p.path !== path);
    }
}

// Export singleton instance
export const roleGuard = RoleGuard.getInstance();