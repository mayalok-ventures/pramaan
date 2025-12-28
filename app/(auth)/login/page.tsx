'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';
    const [isLoading, setIsLoading] = useState(false);

    const handleOAuthLogin = (strategy: string) => {
        setIsLoading(true);
        // Clerk handles OAuth flow automatically
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Button>

                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Welcome back to PRAMAAN
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to access your trust profile, knowledge repository, and job opportunities
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-gray-200">
                    <SignIn
                        routing="path"
                        path="/login"
                        redirectUrl={redirect}
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'shadow-none border-0 p-0',
                                headerTitle: 'hidden',
                                headerSubtitle: 'hidden',
                                socialButtonsBlockButton: 'w-full',
                                formButtonPrimary:
                                    'bg-indigo-600 hover:bg-indigo-700 text-sm font-medium',
                                formFieldInput:
                                    'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                                footerActionLink: 'text-indigo-600 hover:text-indigo-500',
                            },
                        }}
                    />

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href="/signup"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Create one now
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                    <p>
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className="underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}