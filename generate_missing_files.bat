@echo off
setlocal enabledelayedexpansion

echo Generating all missing files...

REM Create lib\middleware\role-guard.ts
(
echo /**
echo  * Role-Based Access Control Middleware
echo  * Enforces role-based permissions for route access
echo  * @middleware
echo  */
echo import { NextResponse } from 'next/server';
echo import type { NextRequest } from 'next/server';
echo import { auth } from '@clerk/nextjs/server';
echo 
echo export type UserRole = 'USER' | 'MEDIA' | 'BUSINESS';
echo 
echo export interface RoutePermission {
echo   path: string;
echo   methods?: string[];
echo   roles: UserRole[];
echo }
echo 
echo export class RoleGuard {
echo   private static instance: RoleGuard;
echo   private routePermissions: RoutePermission[] = [];
echo 
echo   private constructor() {
echo     this.initializePermissions();
echo   }
echo 
echo   static getInstance(): RoleGuard {
echo     if (!RoleGuard.instance) {
echo       RoleGuard.instance = new RoleGuard();
echo     }
echo     return RoleGuard.instance;
echo   }
echo 
echo   /**
echo    * Initialize route permissions
echo    * @timeComplexity O(1) - Constant initialization
echo    */
echo   private initializePermissions(): void {
echo     this.routePermissions = [
echo       // API Routes
echo       { path: '/api/content', methods: ['POST'], roles: ['MEDIA'] },
echo       { path: '/api/jobs', methods: ['POST'], roles: ['BUSINESS'] },
echo       { path: '/api/jobs/[id]/apply', methods: ['POST'], roles: ['USER', 'BUSINESS'] },
echo       
echo       // Page Routes
echo       { path: '/knowledge/videos/new', roles: ['MEDIA'] },
echo       { path: '/knowledge/playlists/new', roles: ['MEDIA'] },
echo       { path: '/jobs/new', roles: ['BUSINESS'] },
echo       { path: '/dashboard', roles: ['USER', 'MEDIA', 'BUSINESS'] },
echo       { path: '/knowledge', roles: ['USER', 'MEDIA', 'BUSINESS'] },
echo       { path: '/jobs', roles: ['USER', 'BUSINESS'] },
echo       
echo       // Profile access rules
echo       { path: '/profile/[id]', roles: ['USER', 'MEDIA', 'BUSINESS'] },
echo     ];
echo   }
echo 
echo   /**
echo    * Check if user has permission to access route
echo    * @param request Next.js request object
echo    * @param userRole User's role from Clerk
echo    * @returns boolean indicating permission
echo    * @timeComplexity O(n) where n is number of route permissions
echo    */
echo   async hasPermission(request: NextRequest, userRole?: UserRole): Promise<boolean> {
echo     const { pathname, method } = request.nextUrl;
echo     
echo     // Public routes that don't require authentication
echo     const publicRoutes = ['/', '/login', '/signup', '/api/auth/(.*)'];
echo     if (publicRoutes.some(route => pathname.match(new RegExp(route)))) {
echo       return true;
echo     }
echo 
echo     // If no user role, deny access
echo     if (!userRole) {
echo       return false;
echo     }
echo 
echo     // Find matching route permission
echo     const matchedPermission = this.routePermissions.find(permission => {
echo       // Convert route pattern to regex
echo       const pattern = permission.path
echo         .replace(/\[([^\]]+)\]/g, '([^/]+)')
echo         .replace(/\//g, '\\/');
echo       const regex = new RegExp(`^${pattern}$`);
echo       
echo       const pathMatches = regex.test(pathname);
echo       const methodMatches = !permission.methods || permission.methods.includes(method);
echo       
echo       return pathMatches && methodMatches;
echo     });
echo 
echo     // If no specific permission, allow access
echo     if (!matchedPermission) {
echo       return true;
echo     }
echo 
echo     // Check if user role is allowed
echo     return matchedPermission.roles.includes(userRole);
echo   }
echo 
echo   /**
echo    * Middleware handler for Next.js
echo    * @param request Next.js request object
echo    * @returns NextResponse or undefined
echo    */
echo   async middleware(request: NextRequest): Promise<NextResponse | undefined> {
echo     try {
echo       const { userId, sessionClaims } = auth();
echo       const userRole = sessionClaims?.metadata?.role as UserRole;
echo       
echo       const hasAccess = await this.hasPermission(request, userRole);
echo       
echo       if (!hasAccess) {
echo         return new NextResponse(
echo           JSON.stringify({ 
echo             error: 'Access denied', 
echo             message: 'You do not have permission to access this resource' 
echo           }),
echo           { 
echo             status: 403, 
echo             headers: { 'Content-Type': 'application/json' } 
echo           }
echo         );
echo       }
echo       
echo       // Add user role to headers for downstream use
echo       const response = NextResponse.next();
echo       if (userRole) {
echo         response.headers.set('X-User-Role', userRole);
echo       }
echo       
echo       return response;
echo     } catch (error) {
echo       console.error('Role guard error:', error);
echo       return new NextResponse(
echo         JSON.stringify({ error: 'Internal server error' }),
echo         { status: 500, headers: { 'Content-Type': 'application/json' } }
echo       );
echo     }
echo   }
echo 
echo   /**
echo    * Get all permissions for a specific role
echo    * @param role User role
echo    * @returns Array of allowed routes
echo    */
echo   getPermissionsForRole(role: UserRole): RoutePermission[] {
echo     return this.routePermissions.filter(permission => 
echo       permission.roles.includes(role)
echo     );
echo   }
echo 
echo   /**
echo    * Add dynamic permission at runtime
echo    * @param permission Route permission to add
echo    */
echo   addPermission(permission: RoutePermission): void {
echo     this.routePermissions.push(permission);
echo   }
echo 
echo   /**
echo    * Remove permission at runtime
echo    * @param path Route path to remove
echo    */
echo   removePermission(path: string): void {
echo     this.routePermissions = this.routePermissions.filter(p => p.path !== path);
echo   }
echo }
echo 
echo // Export singleton instance
echo export const roleGuard = RoleGuard.getInstance();
) > "lib\middleware\role-guard.ts"

REM Create core\domain\value-objects\trust-score.ts
(
echo /**
echo  * Trust Score Value Object
echo  * Immutable value object representing a trust score with validation
echo  * @domain Value Object
echo  */
echo export class TrustScore {
echo   private readonly score: number;
echo   private readonly MAX_SCORE = 100;
echo   private readonly MIN_SCORE = 0;
echo 
echo   /**
echo    * Create a new TrustScore instance
echo    * @param score Numeric trust score (0-100)
echo    * @throws {Error} if score is invalid
echo    */
echo   constructor(score: number) {
echo     if (!this.isValid(score)) {
echo       throw new Error(`Trust score must be between ${this.MIN_SCORE} and ${this.MAX_SCORE}`);
echo     }
echo     
echo     this.score = Math.round(score);
echo     Object.freeze(this); // Make immutable
echo   }
echo 
echo   /**
echo    * Validate trust score
echo    * @param score Score to validate
echo    * @returns boolean indicating validity
echo    * @timeComplexity O(1)
echo    */
echo   private isValid(score: number): boolean {
echo     return Number.isFinite(score) && 
echo            score >= this.MIN_SCORE && 
echo            score <= this.MAX_SCORE;
echo   }
echo 
echo   /**
echo    * Get numeric value of trust score
echo    * @returns Trust score number
echo    */
echo   get value(): number {
echo     return this.score;
echo   }
echo 
echo   /**
echo    * Get trust level category
echo    * @returns Trust level category
echo    */
echo   get level(): TrustLevel {
echo     if (this.score >= 90) return TrustLevel.EXCELLENT;
echo     if (this.score >= 75) return TrustLevel.HIGH;
echo     if (this.score >= 50) return TrustLevel.MEDIUM;
echo     if (this.score >= 25) return TrustLevel.LOW;
echo     return TrustLevel.VERY_LOW;
echo   }
echo 
echo   /**
echo    * Check if trust score meets minimum requirement
echo    * @param minimum Minimum required score
echo    * @returns boolean indicating if requirement is met
echo    */
echo   meetsRequirement(minimum: number): boolean {
echo     return this.score >= minimum;
echo   }
echo 
echo   /**
echo    * Calculate percentage difference from another score
echo    * @param otherScore Other trust score to compare
echo    * @returns Percentage difference
echo    */
echo   differenceFrom(otherScore: TrustScore): number {
echo     return Math.abs(this.score - otherScore.value);
echo   }
echo 
echo   /**
echo    * Create a new TrustScore with increment
echo    * @param increment Amount to increase score by
echo    * @returns New TrustScore instance
echo    */
echo   increment(increment: number): TrustScore {
echo     const newScore = Math.min(this.score + increment, this.MAX_SCORE);
echo     return new TrustScore(newScore);
echo   }
echo 
echo   /**
echo    * Create a new TrustScore with decrement
echo    * @param decrement Amount to decrease score by
echo    * @returns New TrustScore instance
echo    */
echo   decrement(decrement: number): TrustScore {
echo     const newScore = Math.max(this.score - decrement, this.MIN_SCORE);
echo     return new TrustScore(newScore);
echo   }
echo 
echo   /**
echo    * Calculate weighted trust score based on factors
echo    * @param factors Trust calculation factors
echo    * @returns Calculated TrustScore
echo    */
echo   static calculate(factors: TrustFactors): TrustScore {
echo     let totalScore = 0;
echo     const { weights = DEFAULT_WEIGHTS } = factors;
echo 
echo     // Identity verification
echo     if (factors.identityVerified) {
echo       totalScore += weights.identityVerified;
echo     }
echo 
echo     // Profile completeness
echo     if (factors.profileComplete) {
echo       totalScore += weights.profileComplete;
echo     }
echo 
echo     // Skill verification
echo     if (factors.skillVerified) {
echo       totalScore += weights.skillVerified;
echo     }
echo 
echo     // Additional verification methods
echo     if (factors.digiLockerVerified) {
echo       totalScore += weights.additionalVerification;
echo     }
echo 
echo     if (factors.workExperienceVerified) {
echo       totalScore += weights.additionalVerification;
echo     }
echo 
echo     // Cap at maximum score
echo     const finalScore = Math.min(totalScore, MAX_TRUST_SCORE);
echo     
echo     return new TrustScore(finalScore);
echo   }
echo 
echo   /**
echo    * Parse trust score from string
echo    * @param scoreString String representation of score
echo    * @returns TrustScore instance
echo    * @throws {Error} if parsing fails
echo    */
echo   static fromString(scoreString: string): TrustScore {
echo     const score = parseFloat(scoreString);
echo     
echo     if (isNaN(score)) {
echo       throw new Error('Invalid trust score string');
echo     }
echo     
echo     return new TrustScore(score);
echo   }
echo 
echo   /**
echo    * Convert to JSON representation
echo    * @returns JSON object
echo    */
echo   toJSON(): TrustScoreJSON {
echo     return {
echo       score: this.score,
echo       level: this.level,
echo       meetsMinimum: (min: number) => this.meetsRequirement(min)
echo     };
echo   }
echo 
echo   /**
echo    * String representation
echo    * @returns String representation
echo    */
echo   toString(): string {
echo     return `TrustScore(${this.score} - ${this.level})`;
echo   }
echo 
echo   /**
echo    * Equality check
echo    * @param other Other TrustScore to compare
echo    * @returns boolean indicating equality
echo    */
echo   equals(other: TrustScore): boolean {
echo     return this.score === other.value;
echo   }
echo }
echo 
echo /**
echo  * Trust level enum
echo  */
echo export enum TrustLevel {
echo   VERY_LOW = 'VERY_LOW',
echo   LOW = 'LOW',
echo   MEDIUM = 'MEDIUM',
echo   HIGH = 'HIGH',
echo   EXCELLENT = 'EXCELLENT'
echo }
echo 
echo /**
echo  * Trust calculation factors interface
echo  */
echo export interface TrustFactors {
echo   identityVerified: boolean;
echo   profileComplete: boolean;
echo   skillVerified: boolean;
echo   digiLockerVerified?: boolean;
echo   workExperienceVerified?: boolean;
echo   weights?: TrustWeights;
echo }
echo 
echo /**
echo  * Trust calculation weights interface
echo  */
echo export interface TrustWeights {
echo   identityVerified: number;
echo   profileComplete: number;
echo   skillVerified: number;
echo   additionalVerification: number;
echo }
echo 
echo /**
echo  * Default trust calculation weights
echo  */
echo export const DEFAULT_WEIGHTS: TrustWeights = {
echo   identityVerified: 40,
echo   profileComplete: 20,
echo   skillVerified: 40,
echo   additionalVerification: 10
echo };
echo 
echo /**
echo  * Maximum trust score constant
echo  */
echo export const MAX_TRUST_SCORE = 100;
echo 
echo /**
echo  * JSON representation interface
echo  */
echo export interface TrustScoreJSON {
echo   score: number;
echo   level: TrustLevel;
echo   meetsMinimum: (min: number) => boolean;
echo }
echo 
echo /**
echo  * Trust score validation utility functions
echo  */
echo export const TrustScoreUtils = {
echo   /**
echo    * Validate if number can be converted to TrustScore
echo    * @param score Potential trust score
echo    * @returns Validation result
echo    */
echo   validate: (score: number): { isValid: boolean; error?: string } => {
echo     if (!Number.isFinite(score)) {
echo       return { isValid: false, error: 'Score must be a finite number' };
echo     }
echo     
echo     if (score < 0 || score > 100) {
echo       return { isValid: false, error: 'Score must be between 0 and 100' };
echo     }
echo     
echo     return { isValid: true };
echo   },
echo 
echo   /**
echo    * Calculate average of multiple trust scores
echo    * @param scores Array of TrustScore instances
echo    * @returns Average TrustScore
echo    */
echo   average: (scores: TrustScore[]): TrustScore => {
echo     if (scores.length === 0) {
echo       return new TrustScore(0);
echo     }
echo     
echo     const total = scores.reduce((sum, score) => sum + score.value, 0);
echo     const average = total / scores.length;
echo     
echo     return new TrustScore(average);
echo   },
echo 
echo   /**
echo    * Get color representation for trust level
echo    * @param level Trust level
echo    * @returns Tailwind CSS color class
echo    */
echo   getColorForLevel: (level: TrustLevel): string => {
echo     const colors = {
echo       [TrustLevel.VERY_LOW]: 'text-red-600 bg-red-50',
echo       [TrustLevel.LOW]: 'text-orange-600 bg-orange-50',
echo       [TrustLevel.MEDIUM]: 'text-yellow-600 bg-yellow-50',
echo       [TrustLevel.HIGH]: 'text-green-600 bg-green-50',
echo       [TrustLevel.EXCELLENT]: 'text-emerald-600 bg-emerald-50'
echo     };
echo     
echo     return colors[level];
echo   }
echo };
) > "core\domain\value-objects\trust-score.ts"

REM Create Shadcn UI components directory
mkdir "components\ui"

REM Create button.tsx
(
echo /**
echo  * Button Component (Shadcn Style)
echo  * Reusable button component with variants and sizes
echo  * @component
echo  */
echo import * as React from "react"
echo import { cva, type VariantProps } from "class-variance-authority"
echo import { cn } from "@/lib/utils"
echo 
echo const buttonVariants = cva(
echo   "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
echo   {
echo     variants: {
echo       variant: {
echo         default: "bg-primary text-primary-foreground hover:bg-primary/90",
echo         destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
echo         outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
echo         secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
echo         ghost: "hover:bg-accent hover:text-accent-foreground",
echo         link: "text-primary underline-offset-4 hover:underline",
echo         success: "bg-green-600 text-white hover:bg-green-700",
echo         warning: "bg-yellow-500 text-white hover:bg-yellow-600",
echo       },
echo       size: {
echo         default: "h-10 px-4 py-2",
echo         sm: "h-9 rounded-md px-3",
echo         lg: "h-11 rounded-md px-8",
echo         xl: "h-14 rounded-md px-10 text-base",
echo         icon: "h-10 w-10",
echo       },
echo     },
echo     defaultVariants: {
echo       variant: "default",
echo       size: "default",
echo     },
echo   }
echo )
echo 
echo export interface ButtonProps
echo   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
echo     VariantProps<typeof buttonVariants> {
echo   asChild?: boolean
echo   loading?: boolean
echo   leftIcon?: React.ReactNode
echo   rightIcon?: React.ReactNode
echo }
echo 
echo const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
echo   ({ className, variant, size, loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
echo     return (
echo       <button
echo         className={cn(buttonVariants({ variant, size, className }))}
echo         ref={ref}
echo         disabled={disabled || loading}
echo         {...props}
echo       >
echo         {loading && (
echo           <svg
echo             className="mr-2 h-4 w-4 animate-spin"
echo             xmlns="http://www.w3.org/2000/svg"
echo             fill="none"
echo             viewBox="0 0 24 24"
echo           >
echo             <circle
echo               className="opacity-25"
echo               cx="12"
echo               cy="12"
echo               r="10"
echo               stroke="currentColor"
echo               strokeWidth="4"
echo             />
echo             <path
echo               className="opacity-75"
echo               fill="currentColor"
echo               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
echo             />
echo           </svg>
echo         )}
echo         {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
echo         {children}
echo         {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
echo       </button>
echo     )
echo   }
echo )
echo Button.displayName = "Button"
echo 
echo export { Button, buttonVariants }
) > "components\ui\button.tsx"

REM Create badge.tsx
(
echo /**
echo  * Badge Component (Shadcn Style)
echo  * Reusable badge component for status indicators
echo  * @component
echo  */
echo import * as React from "react"
echo import { cva, type VariantProps } from "class-variance-authority"
echo import { cn } from "@/lib/utils"
echo 
echo const badgeVariants = cva(
echo   "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
echo   {
echo     variants: {
echo       variant: {
echo         default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
echo         secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
echo         destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
echo         outline: "text-foreground",
echo         success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
echo         warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
echo         info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
echo         trust_high: "border-transparent bg-emerald-100 text-emerald-800",
echo         trust_medium: "border-transparent bg-yellow-100 text-yellow-800",
echo         trust_low: "border-transparent bg-red-100 text-red-800",
echo       },
echo       size: {
echo         sm: "px-2 py-0.5 text-xs",
echo         default: "px-2.5 py-0.5 text-sm",
echo         lg: "px-3 py-1 text-base",
echo       },
echo     },
echo     defaultVariants: {
echo       variant: "default",
echo       size: "default",
echo     },
echo   }
echo )
echo 
echo export interface BadgeProps
echo   extends React.HTMLAttributes<HTMLDivElement>,
echo     VariantProps<typeof badgeVariants> {}
echo 
echo function Badge({ className, variant, size, ...props }: BadgeProps) {
echo   return (
echo     <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
echo   )
echo }
echo 
echo export { Badge, badgeVariants }
) > "components\ui\badge.tsx"

REM Create card.tsx
(
echo /**
echo  * Card Component (Shadcn Style)
echo  * Reusable card container component
echo  * @component
echo  */
echo import * as React from "react"
echo import { cn } from "@/lib/utils"
echo 
echo const Card = React.forwardRef<
echo   HTMLDivElement,
echo   React.HTMLAttributes<HTMLDivElement>
echo >(({ className, ...props }, ref) => (
echo   <div
echo     ref={ref}
echo     className={cn(
echo       "rounded-lg border bg-card text-card-foreground shadow-sm",
echo       className
echo     )}
echo     {...props}
echo   />
echo ))
echo Card.displayName = "Card"
echo 
echo const CardHeader = React.forwardRef<
echo   HTMLDivElement,
echo   React.HTMLAttributes<HTMLDivElement>
echo >(({ className, ...props }, ref) => (
echo   <div
echo     ref={ref}
echo     className={cn("flex flex-col space-y-1.5 p-6", className)}
echo     {...props}
echo   />
echo ))
echo CardHeader.displayName = "CardHeader"
echo 
echo const CardTitle = React.forwardRef<
echo   HTMLParagraphElement,
echo   React.HTMLAttributes<HTMLHeadingElement>
echo >(({ className, ...props }, ref) => (
echo   <h3
echo     ref={ref}
echo     className={cn(
echo       "text-2xl font-semibold leading-none tracking-tight",
echo       className
echo     )}
echo     {...props}
echo   />
echo ))
echo CardTitle.displayName = "CardTitle"
echo 
echo const CardDescription = React.forwardRef<
echo   HTMLParagraphElement,
echo   React.HTMLAttributes<HTMLParagraphElement>
echo >(({ className, ...props }, ref) => (
echo   <p
echo     ref={ref}
echo     className={cn("text-sm text-muted-foreground", className)}
echo     {...props}
echo   />
echo ))
echo CardDescription.displayName = "CardDescription"
echo 
echo const CardContent = React.forwardRef<
echo   HTMLDivElement,
echo   React.HTMLAttributes<HTMLDivElement>
echo >(({ className, ...props }, ref) => (
echo   <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
echo ))
echo CardContent.displayName = "CardContent"
echo 
echo const CardFooter = React.forwardRef<
echo   HTMLDivElement,
echo   React.HTMLAttributes<HTMLDivElement>
echo >(({ className, ...props }, ref) => (
echo   <div
echo     ref={ref}
echo     className={cn("flex items-center p-6 pt-0", className)}
echo     {...props}
echo   />
echo ))
echo CardFooter.displayName = "CardFooter"
echo 
echo export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
) > "components\ui\card.tsx"

REM Create lib/utils.ts
(
echo /**
echo  * Utility Functions
echo  * Common utilities for the application
echo  * @utils
echo  */
echo import { type ClassValue, clsx } from "clsx"
echo import { twMerge } from "tailwind-merge"
echo 
echo /**
echo  * Merge Tailwind CSS classes efficiently
echo  * @param inputs Class values to merge
echo  * @returns Merged class string
echo  */
echo export function cn(...inputs: ClassValue[]) {
echo   return twMerge(clsx(inputs))
echo }
echo 
echo /**
echo  * Format date to human-readable string
echo  * @param date Date to format
echo  * @returns Formatted date string
echo  */
echo export function formatDate(date: Date | string): string {
echo   const d = new Date(date)
echo   const now = new Date()
echo   const diffMs = now.getTime() - d.getTime()
echo   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
echo 
echo   if (diffDays === 0) {
echo     return 'Today'
echo   } else if (diffDays === 1) {
echo     return 'Yesterday'
echo   } else if (diffDays < 7) {
echo     return `${diffDays} days ago`
echo   } else if (diffDays < 30) {
echo     const weeks = Math.floor(diffDays / 7)
echo     return `${weeks} week${weeks > 1 ? 's' : ''} ago`
echo   } else {
echo     return d.toLocaleDateString('en-US', {
echo       month: 'short',
echo       day: 'numeric',
echo       year: 'numeric'
echo     })
echo   }
echo }
echo 
echo /**
echo  * Truncate text with ellipsis
echo  * @param text Text to truncate
echo  * @param maxLength Maximum length before truncation
echo  * @returns Truncated text
echo  */
echo export function truncateText(text: string, maxLength: number): string {
echo   if (text.length <= maxLength) return text
echo   return text.substring(0, maxLength) + '...'
echo }
echo 
echo /**
echo  * Generate random ID
echo  * @param prefix Optional prefix for ID
echo  * @returns Random ID string
echo  */
echo export function generateId(prefix: string = 'id'): string {
echo   return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
echo }
echo 
echo /**
echo  * Debounce function for performance optimization
echo  * @param func Function to debounce
echo  * @param wait Wait time in milliseconds
echo  * @returns Debounced function
echo  */
echo export function debounce<T extends (...args: any[]) => any>(
echo   func: T,
echo   wait: number
echo ): (...args: Parameters<T>) => void {
echo   let timeout: NodeJS.Timeout
echo   
echo   return (...args: Parameters<T>) => {
echo     clearTimeout(timeout)
echo     timeout = setTimeout(() => func(...args), wait)
echo   }
echo }
echo 
echo /**
echo  * Validate email address
echo  * @param email Email to validate
echo  * @returns boolean indicating validity
echo  */
echo export function isValidEmail(email: string): boolean {
echo   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
echo   return emailRegex.test(email)
echo }
echo 
echo /**
echo  * Calculate percentage
echo  * @param value Current value
echo  * @param total Total value
echo  * @returns Percentage (0-100)
echo  */
echo export function calculatePercentage(value: number, total: number): number {
echo   if (total === 0) return 0
echo   return Math.round((value / total) * 100)
echo }
echo 
echo /**
echo  * Safe JSON parse with error handling
echo  * @param str JSON string to parse
echo  * @param defaultValue Default value if parsing fails
echo  * @returns Parsed object or default value
echo  */
echo export function safeJsonParse<T>(str: string, defaultValue: T): T {
echo   try {
echo     return JSON.parse(str) as T
echo   } catch {
echo     return defaultValue
echo   }
echo }
echo 
echo /**
echo  * Generate array of numbers for pagination
echo  * @param currentPage Current page number
echo  * @param totalPages Total number of pages
echo  * @returns Array of page numbers to display
echo  */
echo export function generatePagination(currentPage: number, totalPages: number): number[] {
echo   const delta = 2
echo   const range = []
echo   const rangeWithDots = []
echo   
echo   for (let i = 1; i <= totalPages; i++) {
echo     if (
echo       i === 1 ||
echo       i === totalPages ||
echo       (i >= currentPage - delta && i <= currentPage + delta)
echo     ) {
echo       range.push(i)
echo     }
echo   }
echo   
echo   let prev = 0
echo   for (const i of range) {
echo     if (prev) {
echo       if (i - prev === 2) {
echo         rangeWithDots.push(prev + 1)
echo       } else if (i - prev !== 1) {
echo         rangeWithDots.push('...')
echo       }
echo     }
echo     rangeWithDots.push(i)
echo     prev = i
echo   }
echo   
echo   return rangeWithDots.filter(n => typeof n === 'number') as number[]
echo }
echo 
echo /**
echo  * Convert object to URL query string
echo  * @param params Object to convert
echo  * @returns URL query string
echo  */
echo export function objectToQueryString(params: Record<string, any>): string {
echo   const searchParams = new URLSearchParams()
echo   
echo   Object.entries(params).forEach(([key, value]) => {
echo     if (value !== undefined && value !== null) {
echo       if (Array.isArray(value)) {
echo         value.forEach(v => searchParams.append(key, v.toString()))
echo       } else {
echo         searchParams.append(key, value.toString())
echo       }
echo     }
echo   })
echo   
echo   return searchParams.toString()
echo }
) > "lib\utils.ts"

REM Create tests\trust-engine.test.ts
(
echo /**
echo  * Trust Engine Test Suite
echo  * Comprehensive unit tests for trust score calculation
echo  * @testing Vitest
echo  */
echo import { describe, it, expect, beforeEach } from 'vitest';
echo import { TrustEngine } from '@/core/domain/services/trust-engine';
echo import { TrustScore, TrustLevel, TrustFactors, DEFAULT_WEIGHTS } from '@/core/domain/value-objects/trust-score';
echo 
echo describe('Trust Engine & Trust Score Value Object', () => {
echo   let trustEngine: TrustEngine;
echo 
echo   beforeEach(() => {
echo     trustEngine = new TrustEngine();
echo   });
echo 
echo   describe('TrustScore Value Object', () => {
echo     it('should create valid TrustScore instance', () => {
echo       const score = new TrustScore(75);
echo       expect(score.value).toBe(75);
echo       expect(score.level).toBe(TrustLevel.HIGH);
echo     });
echo 
echo     it('should throw error for invalid score', () => {
echo       expect(() => new TrustScore(-10)).toThrow();
echo       expect(() => new TrustScore(150)).toThrow();
echo       expect(() => new TrustScore(NaN)).toThrow();
echo     });
echo 
echo     it('should correctly determine trust levels', () => {
echo       expect(new TrustScore(95).level).toBe(TrustLevel.EXCELLENT);
echo       expect(new TrustScore(80).level).toBe(TrustLevel.HIGH);
echo       expect(new TrustScore(60).level).toBe(TrustLevel.MEDIUM);
echo       expect(new TrustScore(30).level).toBe(TrustLevel.LOW);
echo       expect(new TrustScore(10).level).toBe(TrustLevel.VERY_LOW);
echo     });
echo 
echo     it('should check minimum requirements', () => {
echo       const score = new TrustScore(70);
echo       expect(score.meetsRequirement(50)).toBe(true);
echo       expect(score.meetsRequirement(70)).toBe(true);
echo       expect(score.meetsRequirement(80)).toBe(false);
echo     });
echo 
echo     it('should correctly increment and decrement', () => {
echo       const score = new TrustScore(50);
echo       const incremented = score.increment(20);
echo       const decremented = score.decrement(30);
echo 
echo       expect(incremented.value).toBe(70);
echo       expect(decremented.value).toBe(20);
echo     });
echo 
echo     it('should cap at maximum and minimum scores', () => {
echo       const highScore = new TrustScore(95);
echo       const lowScore = new TrustScore(5);
echo 
echo       expect(highScore.increment(10).value).toBe(100);
echo       expect(lowScore.decrement(10).value).toBe(0);
echo     });
echo 
echo     it('should calculate from string', () => {
echo       const score = TrustScore.fromString('85.5');
echo       expect(score.value).toBe(86); // Rounded
echo     });
echo 
echo     it('should throw when parsing invalid string', () => {
echo       expect(() => TrustScore.fromString('invalid')).toThrow();
echo     });
echo 
echo     it('should correctly convert to JSON', () => {
echo       const score = new TrustScore(75);
echo       const json = score.toJSON();
echo       
echo       expect(json.score).toBe(75);
echo       expect(json.level).toBe(TrustLevel.HIGH);
echo       expect(json.meetsMinimum(50)).toBe(true);
echo     });
echo 
echo     it('should check equality correctly', () => {
echo       const score1 = new TrustScore(75);
echo       const score2 = new TrustScore(75);
echo       const score3 = new TrustScore(80);
echo 
echo       expect(score1.equals(score2)).toBe(true);
echo       expect(score1.equals(score3)).toBe(false);
echo     });
echo 
echo     it('should calculate using static method', () => {
echo       const factors: TrustFactors = {
echo         identityVerified: true,
echo         profileComplete: true,
echo         skillVerified: false
echo       };
echo 
echo       const score = TrustScore.calculate(factors);
echo       expect(score.value).toBe(60); // 40 + 20 + 0
echo     });
echo 
echo     it('should handle additional verification factors', () => {
echo       const factors: TrustFactors = {
echo         identityVerified: true,
echo         profileComplete: true,
echo         skillVerified: true,
echo         digiLockerVerified: true,
echo         workExperienceVerified: true
echo       };
echo 
echo       const score = TrustScore.calculate(factors);
echo       expect(score.value).toBe(100); // 40 + 20 + 40 + 10 + 10 = 120, capped at 100
echo     });
echo   });
echo 
echo   describe('TrustScoreUtils', () => {
echo     it('should validate scores correctly', () => {
echo       expect(TrustScoreUtils.validate(50).isValid).toBe(true);
echo       expect(TrustScoreUtils.validate(-10).isValid).toBe(false);
echo       expect(TrustScoreUtils.validate(150).isValid).toBe(false);
echo       expect(TrustScoreUtils.validate(NaN).isValid).toBe(false);
echo     });
echo 
echo     it('should calculate average of scores', () => {
echo       const scores = [
echo         new TrustScore(70),
echo         new TrustScore(80),
echo         new TrustScore(90)
echo       ];
echo 
echo       const average = TrustScoreUtils.average(scores);
echo       expect(average.value).toBe(80);
echo     });
echo 
echo     it('should return zero for empty array', () => {
echo       const average = TrustScoreUtils.average([]);
echo       expect(average.value).toBe(0);
echo     });
echo 
echo     it('should return correct colors for trust levels', () => {
echo       expect(TrustScoreUtils.getColorForLevel(TrustLevel.EXCELLENT))
echo         .toContain('emerald');
echo       expect(TrustScoreUtils.getColorForLevel(TrustLevel.HIGH))
echo         .toContain('green');
echo       expect(TrustScoreUtils.getColorForLevel(TrustLevel.MEDIUM))
echo         .toContain('yellow');
echo       expect(TrustScoreUtils.getColorForLevel(TrustLevel.LOW))
echo         .toContain('orange');
echo       expect(TrustScoreUtils.getColorForLevel(TrustLevel.VERY_LOW))
echo         .toContain('red');
echo     });
echo   });
echo 
echo   describe('TrustEngine Integration', () => {
echo     it('should calculate trust score with default weights', () => {
echo       const factors = {
echo         identityVerified: true,
echo         profileComplete: true,
echo         skillVerified: true
echo       };
echo 
echo       const score = trustEngine.calculateScore(factors);
echo       expect(score).toBe(100);
echo     });
echo 
echo     it('should calculate partial trust scores', () => {
echo       const factors = {
echo         identityVerified: true,
echo         profileComplete: false,
echo         skillVerified: true
echo       };
echo 
echo       const score = trustEngine.calculateScore(factors);
echo       expect(score).toBe(80); // 40 + 0 + 40
echo     });
echo 
echo     it('should detect profile completeness', () => {
echo       const completeProfile = { name: 'John Doe', phone: '+1234567890' };
echo       const incompleteProfile = { name: 'John Doe' };
echo 
echo       expect(trustEngine.isProfileComplete(completeProfile)).toBe(true);
echo       expect(trustEngine.isProfileComplete(incompleteProfile)).toBe(false);
echo     });
echo 
echo     it('should recalculate trust score for user', () => {
echo       const mockUser = {
echo         isVerified: true,
echo         metadata: { 
echo           name: 'Test User',
echo           phone: '1234567890',
echo           skills: ['JavaScript', 'TypeScript']
echo         }
echo       };
echo 
echo       const score = trustEngine.recalculateForUser(mockUser);
echo       expect(score).toBe(100); // All factors true
echo     });
echo 
echo     it('should handle user without skills', () => {
echo       const mockUser = {
echo         isVerified: true,
echo         metadata: { 
echo           name: 'Test User',
echo           phone: '1234567890'
echo         }
echo       };
echo 
echo       const score = trustEngine.recalculateForUser(mockUser);
echo       expect(score).toBe(60); // Verified + Profile complete
echo     });
echo 
echo     it('should handle edge cases in profile completeness', () => {
echo       expect(trustEngine.isProfileComplete({})).toBe(false);
echo       expect(trustEngine.isProfileComplete({ name: '', phone: '' })).toBe(false);
echo       expect(trustEngine.isProfileComplete({ name: '   ', phone: '   ' })).toBe(false);
echo       expect(trustEngine.isProfileComplete({ name: 'John', phone: '123' })).toBe(true);
echo     });
echo 
echo     it('should maintain score between 0 and 100', () => {
echo       // Test with all factors false
echo       const zeroFactors = {
echo         identityVerified: false,
echo         profileComplete: false,
echo         skillVerified: false
echo       };
echo 
echo       const zeroScore = trustEngine.calculateScore(zeroFactors);
echo       expect(zeroScore).toBe(0);
echo       expect(zeroScore).toBeGreaterThanOrEqual(0);
echo       expect(zeroScore).toBeLessThanOrEqual(100);
echo 
echo       // Test with all factors true
echo       const maxFactors = {
echo         identityVerified: true,
echo         profileComplete: true,
echo         skillVerified: true
echo       };
echo 
echo       const maxScore = trustEngine.calculateScore(maxFactors);
echo       expect(maxScore).toBe(100);
echo     });
echo   });
echo 
echo   describe('Performance Tests', () => {
echo     it('should handle 1000 calculations efficiently', () => {
echo       const startTime = performance.now();
echo       
echo       for (let i = 0; i < 1000; i++) {
echo         const factors = {
echo           identityVerified: i % 2 === 0,
echo           profileComplete: i % 3 === 0,
echo           skillVerified: i % 5 === 0
echo         };
echo         trustEngine.calculateScore(factors);
echo       }
echo       
echo       const endTime = performance.now();
echo       const executionTime = endTime - startTime;
echo       
echo       // Should complete in less than 50ms for 1000 calculations
echo       expect(executionTime).toBeLessThan(50);
echo     });
echo 
echo     it('should handle concurrent calculations', async () => {
echo       const promises = Array(100)
echo         .fill(null)
echo         .map(async (_, i) => {
echo           const factors = {
echo             identityVerified: true,
echo             profileComplete: i % 2 === 0,
echo             skillVerified: true
echo           };
echo           return trustEngine.calculateScore(factors);
echo         });
echo 
echo       const results = await Promise.all(promises);
echo       
echo       // All results should be valid scores
echo       results.forEach(score => {
echo         expect(score).toBeGreaterThanOrEqual(0);
echo         expect(score).toBeLessThanOrEqual(100);
echo       });
echo     });
echo   });
echo });
) > "tests\trust-engine.test.ts"

REM Create tests\llm.test.ts
(
echo /**
echo  * LLM Integration Test Suite
echo  * Unit tests for Gemini API integration and resume parsing
echo  * @testing Vitest
echo  */
echo import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
echo import { GeminiClient, parseResume, stubParseResume, type MatchScore } from '@/lib/llm';
echo 
echo // Mock environment variables
echo vi.mock('@/lib/llm', async () => {
echo   const actual = await vi.importActual('@/lib/llm');
echo   return {
echo     ...actual,
echo     GeminiClient: {
echo       ...actual.GeminiClient,
echo       initialize: vi.fn(),
echo       getInstance: vi.fn()
echo     }
echo   };
echo });
echo 
echo describe('LLM Integration - Resume Parsing', () => {
echo   let geminiClient: any;
echo 
echo   beforeEach(() => {
echo     vi.clearAllMocks();
echo     process.env.GEMINI_API_KEY = 'test-api-key';
echo   });
echo 
echo   afterEach(() => {
echo     delete process.env.GEMINI_API_KEY;
echo   });
echo 
echo   describe('Stub Implementation', () => {
echo     it('should parse resume with stub implementation', () => {
echo       const resumeText = `
echo         John Doe
echo         Senior Software Engineer
echo         Skills: JavaScript, TypeScript, React, Node.js, AWS
echo         Experience: 5 years at Tech Corp
echo         Education: B.S. Computer Science
echo       `;
echo 
echo       const result = stubParseResume(resumeText);
echo       
echo       expect(result).toHaveProperty('overall');
echo       expect(result).toHaveProperty('breakdown');
echo       expect(result).toHaveProperty('parsedData');
echo       
echo       expect(result.overall).toBeGreaterThanOrEqual(0);
echo       expect(result.overall).toBeLessThanOrEqual(100);
echo       
echo       expect(result.parsedData.skills).toBeInstanceOf(Array);
echo       expect(result.parsedData.experience).toBeInstanceOf(Array);
echo       expect(result.parsedData.education).toBeInstanceOf(Array);
echo       expect(typeof result.parsedData.summary).toBe('string');
echo     });
echo 
echo     it('should extract skills from resume text', () => {
echo       const resumeText = 'Expert in React, Node.js, TypeScript, and AWS cloud services.';
echo       const result = stubParseResume(resumeText);
echo       
echo       expect(result.parsedData.skills.length).toBeGreaterThan(0);
echo       expect(result.breakdown.skills).toBeGreaterThan(0);
echo       
echo       // Should find React, Node, TypeScript, AWS
echo       const foundSkills = result.parsedData.skills.map((s: string) => s.toLowerCase());
echo       expect(foundSkills.some(skill => skill.includes('react'))).toBe(true);
echo       expect(foundSkills.some(skill => skill.includes('node'))).toBe(true);
echo     });
echo 
echo     it('should handle empty resume text', () => {
echo       const result = stubParseResume('');
echo       
echo       expect(result.overall).toBe(0);
echo       expect(result.parsedData.skills).toEqual(['General Skills']);
echo       expect(result.parsedData.summary).toBe('Stub parsing complete');
echo     });
echo 
echo     it('should calculate match scores based on keywords', () => {
echo       const resumeText = 'React developer with AWS experience';
echo       const result = stubParseResume(resumeText);
echo       
echo       // Should match React and AWS (2/5 keywords = 40% base)
echo       expect(result.overall).toBeGreaterThanOrEqual(20);
echo       expect(result.overall).toBeLessThanOrEqual(100);
echo     });
echo   });
echo 
echo   describe('GeminiClient Mock Tests', () => {
echo     beforeEach(() => {
echo       geminiClient = {
echo         initialize: vi.fn(),
echo         parseResume: vi.fn()
echo       };
echo       
echo       vi.mocked(GeminiClient.getInstance).mockReturnValue(geminiClient);
echo       vi.mocked(GeminiClient.initialize).mockImplementation(() => {});
echo     });
echo 
echo     it('should initialize with API key', () => {
echo       const apiKey = 'test-api-key-123';
echo       GeminiClient.initialize({
echo         apiKey,
echo         model: 'gemini-pro',
echo         temperature: 0.2
echo       });
echo       
echo       expect(GeminiClient.initialize).toHaveBeenCalledWith({
echo         apiKey,
echo         model: 'gemini-pro',
echo         temperature: 0.2
echo       });
echo     });
echo 
echo     it('should throw error when not initialized', () => {
echo       vi.mocked(GeminiClient.getInstance).mockImplementation(() => {
echo         throw new Error('GeminiClient not initialized');
echo       });
echo       
echo       expect(() => GeminiClient.getInstance()).toThrow('GeminiClient not initialized');
echo     });
echo   });
echo 
echo   describe('parseResume Function', () => {
echo     it('should use stub when API key is missing', async () => {
echo       delete process.env.GEMINI_API_KEY;
echo       
echo       const resumeText = 'Test resume';
echo       const result = await parseResume(resumeText);
echo       
echo       expect(result.parsedData.summary).toContain('Stub');
echo     });
echo 
echo     it('should handle Gemini API errors gracefully', async () => {
echo       process.env.GEMINI_API_KEY = 'invalid-key';
echo       
echo       // Mock GeminiClient to throw error
echo       vi.mocked(GeminiClient.getInstance).mockImplementation(() => {
echo         throw new Error('API error');
echo       });
echo       
echo       const resumeText = 'Test resume content';
echo       const result = await parseResume(resumeText);
echo       
echo       // Should fall back to stub implementation
echo       expect(result.parsedData.summary).toContain('Stub');
echo     });
echo 
echo     it('should parse resume with actual API when available', async () => {
echo       process.env.GEMINI_API_KEY = 'valid-key';
echo       
echo       const mockParseResult: MatchScore = {
echo         overall: 85,
echo         breakdown: {
echo           skills: 90,
echo           experience: 80,
echo           education: 85,
echo           relevance: 75
echo         },
echo         parsedData: {
echo           skills: ['React', 'TypeScript', 'Node.js'],
echo           experience: ['5 years at Tech Company'],
echo           education: ['B.S. Computer Science'],
echo           summary: 'Experienced software engineer'
echo         }
echo       };
echo       
echo       geminiClient.parseResume.mockResolvedValue(mockParseResult);
echo       
echo       const resumeText = 'Professional software engineer resume';
echo       const result = await parseResume(resumeText);
echo       
echo       expect(result.overall).toBe(85);
echo       expect(result.parsedData.skills).toContain('React');
echo       expect(geminiClient.parseResume).toHaveBeenCalledWith(resumeText);
echo     });
echo   });
echo 
echo   describe('Match Score Calculations', () => {
echo     it('should calculate skill match percentage', () => {
echo       const resumeText = `
echo         Skills: React, Vue.js, Angular, TypeScript, JavaScript, Node.js, Python, Django
echo         Experience: Full Stack Developer at ABC Corp (3 years)
echo         Education: Master in Computer Science
echo       `;
echo       
echo       const result = stubParseResume(resumeText);
echo       
echo       // Should match many skills from the common skills list
echo       expect(result.breakdown.skills).toBeGreaterThan(50);
echo       expect(result.overall).toBeGreaterThan(50);
echo     });
echo 
echo     it('should handle resume with no common skills', () => {
echo       const resumeText = `
echo         Skills: Cooking, Gardening, Painting, Writing
echo         Experience: Chef at Restaurant
echo         Education: Culinary Arts Degree
echo       `;
echo       
echo       const result = stubParseResume(resumeText);
echo       
echo       // No technical skills found
echo       expect(result.breakdown.skills).toBe(0);
echo       expect(result.overall).toBeLessThan(50);
echo     });
echo 
echo     it('should maintain score boundaries', () => {
echo       const longResume = 'React '.repeat(100) + 'Node '.repeat(100);
echo       const result = stubParseResume(longResume);
echo       
echo       expect(result.overall).toBeGreaterThanOrEqual(0);
echo       expect(result.overall).toBeLessThanOrEqual(100);
echo       
echo       expect(result.breakdown.skills).toBeGreaterThanOrEqual(0);
echo       expect(result.breakdown.skills).toBeLessThanOrEqual(100);
echo       
echo       expect(result.breakdown.experience).toBeGreaterThanOrEqual(0);
echo       expect(result.breakdown.experience).toBeLessThanOrEqual(100);
echo       
echo       expect(result.breakdown.education).toBeGreaterThanOrEqual(0);
echo       expect(result.breakdown.education).toBeLessThanOrEqual(100);
echo       
echo       expect(result.breakdown.relevance).toBeGreaterThanOrEqual(0);
echo       expect(result.breakdown.relevance).toBeLessThanOrEqual(100);
echo     });
echo   });
echo 
echo   describe('Performance & Edge Cases', () => {
echo     it('should handle very long resume text', () => {
echo       const longText = 'A'.repeat(10000) + ' React ' + 'B'.repeat(10000);
echo       const startTime = performance.now();
echo       
echo       const result = stubParseResume(longText);
echo       const endTime = performance.now();
echo       
echo       expect(result.overall).toBeDefined();
echo       expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
echo     });
echo 
echo     it('should handle special characters and formatting', () => {
echo       const resumeText = `
echo         Name: John "JD" Doe
echo         Email: john.doe@company.com
echo         Phone: +1 (555) 123-4567
echo         LinkedIn: https://linkedin.com/in/johndoe
echo         
echo         SKILLS:
echo         • JavaScript/ES6+
echo         • React.js & Redux
echo         • Node.js/Express
echo         • AWS (S3, EC2, Lambda)
echo         • Docker 🐳 & Kubernetes
echo         • CI/CD: Jenkins, GitHub Actions
echo         
echo         EXPERIENCE:
echo         → Senior Developer @TechCorp (2020-Present)
echo         → Junior Developer @Startup (2018-2020)
echo         
echo         EDUCATION:
echo         🎓 B.S. Computer Science, Stanford University (2014-2018)
echo         GPA: 3.8/4.0
echo         
echo         CERTIFICATIONS:
echo         - AWS Certified Solutions Architect
echo         - Google Cloud Professional Developer
echo       `;
echo       
echo       const result = stubParseResume(resumeText);
echo       
echo       expect(result.parsedData.skills.length).toBeGreaterThan(0);
echo       expect(result.parsedData.experience.length).toBeGreaterThan(0);
echo       expect(result.parsedData.education.length).toBeGreaterThan(0);
echo       expect(result.parsedData.summary.length).toBeGreaterThan(0);
echo     });
echo 
echo     it('should handle multiple languages', () => {
echo       const multilingualResume = `
echo         Nombre: Juan Pérez
echo         Habilidades: JavaScript, React, Node.js
echo         Experiencia: Desarrollador en Empresa Tech
echo         Educación: Ingeniería en Sistemas
echo         
echo         Name: Juan Pérez
echo         Skills: JavaScript, React, Node.js
echo         Experience: Developer at Tech Company
echo         Education: Systems Engineering
echo       `;
echo       
echo       const result = stubParseResume(multilingualResume);
echo       
echo       expect(result.parsedData.skills).toContain('JavaScript');
echo       expect(result.overall).toBeGreaterThan(0);
echo     });
echo 
echo     it('should handle malformed JSON in API response', async () => {
echo       // Mock a malformed API response
echo       geminiClient.parseResume.mockRejectedValue(new SyntaxError('Unexpected token'));
echo       
echo       const resumeText = 'Test resume';
echo       const result = await parseResume(resumeText);
echo       
echo       // Should fall back to stub
echo       expect(result.parsedData.summary).toContain('Stub');
echo     });
echo   });
echo 
echo   describe('Integration with Job Matching', () => {
echo     it('should calculate job match based on parsed skills', () => {
echo       const resumeText = 'Skills: React, TypeScript, Node.js, AWS';
echo       const jobSkills = ['React', 'TypeScript', 'Next.js', 'AWS'];
echo       
echo       const result = stubParseResume(resumeText);
echo       const resumeSkills = new Set(result.parsedData.skills.map((s: string) => s.toLowerCase()));
echo       const jobSkillsSet = new Set(jobSkills.map(s => s.toLowerCase()));
echo       
echo       const intersection = new Set(
echo         [...resumeSkills].filter(skill => jobSkillsSet.has(skill))
echo       );
echo       
echo       const matchPercentage = (intersection.size / jobSkillsSet.size) * 100;
echo       
echo       // Should match 3 out of 4 skills (75%)
echo       expect(matchPercentage).toBe(75);
echo     });
echo 
echo     it('should handle job with no skills requirement', () => {
echo       const resumeText = 'Skills: Many skills listed';
echo       const jobSkills: string[] = [];
echo       
echo       const result = stubParseResume(resumeText);
echo       
echo       // When job has no skills, match should be based on other factors
echo       expect(result.overall).toBeGreaterThan(0);
echo       expect(result.breakdown.skills).toBeGreaterThan(0);
echo     });
echo   });
echo });
) > "tests\llm.test.ts"

REM Create lib\validation.ts
(
echo /**
echo  * Validation Utilities
echo  * Centralized validation functions for the application
echo  * @utils
echo  */
echo import { z } from 'zod';
echo 
echo /**
echo  * Common validation schemas
echo  */
echo export const validationSchemas = {
echo   email: z.string().email('Invalid email address'),
echo   password: z.string().min(8, 'Password must be at least 8 characters'),
echo   phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
echo   url: z.string().url('Invalid URL'),
echo   trustScore: z.number().min(0).max(100, 'Trust score must be between 0-100'),
echo   userId: z.string().uuid('Invalid user ID'),
echo   jobId: z.string().regex(/^job_\w+$/, 'Invalid job ID format'),
echo   contentId: z.string().regex(/^content_\w+$/, 'Invalid content ID format'),
echo };
echo 
echo /**
echo  * User validation schemas
echo  */
echo export const userSchemas = {
echo   create: z.object({
echo     email: validationSchemas.email,
echo     password: validationSchemas.password,
echo     role: z.enum(['USER', 'MEDIA', 'BUSINESS']),
echo     metadata: z.record(z.any()).optional(),
echo   }),
echo 
echo   update: z.object({
echo     email: validationSchemas.email.optional(),
echo     role: z.enum(['USER', 'MEDIA', 'BUSINESS']).optional(),
echo     metadata: z.record(z.any()).optional(),
echo   }),
echo 
echo   profile: z.object({
echo     name: z.string().min(2, 'Name must be at least 2 characters'),
echo     phone: validationSchemas.phone,
echo     company: z.string().optional(),
echo     skills: z.array(z.string()).optional(),
echo     digiLockerId: z.string().optional(),
echo   }),
echo };
echo 
echo /**
echo  * Job validation schemas
echo  */
echo export const jobSchemas = {
echo   create: z.object({
echo     title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
echo     description: z.string().min(1, 'Description is required').max(5000),
echo     minTrustScore: validationSchemas.trustScore.default(0),
echo     skills: z.array(z.string()).default([]),
echo     location: z.string().optional(),
echo     salaryRange: z.string().optional(),
echo     isActive: z.boolean().default(true),
echo   }),
echo 
echo   apply: z.object({
echo     resumeText: z.string().max(10000, 'Resume text too long'),
echo     coverLetter: z.string().max(2000, 'Cover letter too long').optional(),
echo   }),
echo };
echo 
echo /**
echo  * Content validation schemas
echo  */
echo export const contentSchemas = {
echo   create: z.object({
echo     url: validationSchemas.url,
echo     title: z.string().min(1, 'Title is required').max(200),
echo     description: z.string().optional(),
echo     type: z.enum(['VIDEO', 'PLAYLIST']),
echo     tags: z.array(z.string()).default([]),
echo     isVerifiedByCompany: z.boolean().default(false),
echo   }),
echo 
echo   progress: z.object({
echo     progress: z.number().min(0).max(100, 'Progress must be between 0-100'),
echo     isCompleted: z.boolean().optional(),
echo   }),
echo };
echo 
echo /**
echo  * Validation utility functions
echo  */
echo export const ValidationUtils = {
echo   /**
echo    * Validate data against schema
echo    * @param schema Zod schema
echo    * @param data Data to validate
echo    * @returns Validation result
echo    */
echo   validate<T>(schema: z.ZodSchema<T>, data: unknown): {
echo     success: boolean;
echo     data?: T;
echo     errors?: z.ZodError['errors'];
echo   } {
echo     try {
echo       const validatedData = schema.parse(data);
echo       return { success: true, data: validatedData };
echo     } catch (error) {
echo       if (error instanceof z.ZodError) {
echo         return { success: false, errors: error.errors };
echo       }
echo       throw error;
echo     }
echo   },
echo 
echo   /**
echo    * Sanitize input string
echo    * @param input Input string
echo    * @returns Sanitized string
echo    */
echo   sanitizeString(input: string): string {
echo     return input
echo       .trim()
echo       .replace(/[<>]/g, '') // Remove HTML tags
echo       .replace(/[&<>"']/g, '') // Remove special characters
echo       .substring(0, 10000); // Limit length
echo   },
echo 
echo   /**
echo    * Sanitize object recursively
echo    * @param obj Object to sanitize
echo    * @returns Sanitized object
echo    */
echo   sanitizeObject<T extends Record<string, any>>(obj: T): T {
echo     const sanitized: Record<string, any> = {};
echo     
echo     Object.entries(obj).forEach(([key, value]) => {
echo       if (typeof value === 'string') {
echo         sanitized[key] = this.sanitizeString(value);
echo       } else if (typeof value === 'object' && value !== null) {
echo         sanitized[key] = this.sanitizeObject(value);
echo       } else {
echo         sanitized[key] = value;
echo       }
echo     });
echo     
echo     return sanitized as T;
echo   },
echo 
echo   /**
echo    * Validate YouTube URL
echo    * @param url YouTube URL
echo    * @returns boolean indicating validity
echo    */
echo   isValidYouTubeUrl(url: string): boolean {
echo     const patterns = [
echo       /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
echo       /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+$/,
echo       /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+(&\S*)?$/,
echo     ];
echo     
echo     return patterns.some(pattern => pattern.test(url));
echo   },
echo 
echo   /**
echo    * Extract YouTube video ID from URL
echo    * @param url YouTube URL
echo    * @returns Video ID or null
echo    */
echo   extractYouTubeId(url: string): string | null {
echo     const patterns = [
echo       /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/,
echo       /youtube\.com\/v\/([\w-]+)/,
echo     ];
echo     
echo     for (const pattern of patterns) {
echo       const match = url.match(pattern);
echo       if (match) return match[1];
echo     }
echo     
echo     return null;
echo   },
echo 
echo   /**
echo    * Validate trust score factors
echo    * @param factors Trust score factors
echo    * @returns Validation result
echo    */
echo   validateTrustFactors(factors: any): { isValid: boolean; error?: string } {
echo     const requiredFields = ['identityVerified', 'profileComplete', 'skillVerified'];
echo     
echo     for (const field of requiredFields) {
echo       if (typeof factors[field] !== 'boolean') {
echo         return { 
echo           isValid: false, 
echo           error: `${field} must be a boolean` 
echo         };
echo       }
echo     }
echo     
echo     return { isValid: true };
echo   },
echo 
echo   /**
echo    * Generate validation error messages
echo    * @param errors Zod errors
echo    * @returns User-friendly error messages
echo    */
echo   formatErrorMessages(errors: z.ZodError['errors']): string[] {
echo     return errors.map(error => {
echo       const field = error.path.join('.');
echo       return `${field ? `${field}: ` : ''}${error.message}`;
echo     });
echo   },
echo 
echo   /**
echo    * Validate array of skills
echo    * @param skills Skills array
echo    * @returns Validation result
echo    */
echo   validateSkills(skills: any[]): { isValid: boolean; error?: string } {
echo     if (!Array.isArray(skills)) {
echo       return { isValid: false, error: 'Skills must be an array' };
echo     }
echo     
echo     if (skills.length > 50) {
echo       return { isValid: false, error: 'Maximum 50 skills allowed' };
echo     }
echo     
echo     for (const skill of skills) {
echo       if (typeof skill !== 'string') {
echo         return { isValid: false, error: 'Each skill must be a string' };
echo       }
echo       
echo       if (skill.length > 100) {
echo         return { isValid: false, error: 'Skill name too long' };
echo       }
echo     }
echo     
echo     return { isValid: true };
echo   },
echo };
echo 
echo /**
echo  * Custom validation decorators
echo  */
echo export function Validate(schema: z.ZodSchema) {
echo   return function (
echo     target: any,
echo     propertyKey: string,
echo     descriptor: PropertyDescriptor
echo   ) {
echo     const originalMethod = descriptor.value;
echo     
echo     descriptor.value = function (...args: any[]) {
echo       const result = ValidationUtils.validate(schema, args[0]);
echo       
echo       if (!result.success) {
echo         throw new Error(
echo           `Validation failed: ${ValidationUtils.formatErrorMessages(result.errors!).join(', ')}`
echo         );
echo       }
echo       
echo       return originalMethod.apply(this, [result.data, ...args.slice(1)]);
echo     };
echo     
echo     return descriptor;
echo   };
echo }
echo 
echo /**
echo  * Async validation middleware for API routes
echo  */
echo export const validateRequest = (schema: z.ZodSchema) => {
echo   return async (request: Request) => {
echo     try {
echo       const body = await request.json();
echo       return schema.parse(body);
echo     } catch (error) {
echo       if (error instanceof z.ZodError) {
echo         throw new Error(
echo           `Request validation failed: ${ValidationUtils.formatErrorMessages(error.errors).join(', ')}`
echo         );
echo       }
echo       throw error;
echo     }
echo   };
echo };
) > "lib\validation.ts"

echo.
echo ============================================
echo All missing files generated successfully!
echo ============================================
echo.
echo Generated files:
echo 1. lib\middleware\role-guard.ts
echo 2. core\domain\value-objects\trust-score.ts
echo 3. components\ui\button.tsx
echo 4. components\ui\badge.tsx
echo 5. components\ui\card.tsx
echo 6. lib\utils.ts
echo 7. tests\trust-engine.test.ts
echo 8. tests\llm.test.ts
echo 9. lib\validation.ts
echo.
echo Project is now complete and ready for development!
pause