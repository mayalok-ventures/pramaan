'use client';

export const dynamic = 'force-dynamic';

import { SignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column - Benefits */}
                    <div className="space-y-8">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                            className="mb-6"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>

                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                Join PRAMAAN
                            </h1>
                            <p className="text-lg text-gray-600">
                                Build your professional identity, access exclusive content,
                                and connect with verified opportunities.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                'Build your trust score with verified credentials',
                                'Access curated knowledge from industry experts',
                                'Apply to jobs matching your trust profile',
                                'Track your learning progress',
                                'Connect with verified companies',
                            ].map((benefit, index) => (
                                <div key={index} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-indigo-50 p-6 rounded-lg">
                            <h3 className="font-semibold text-indigo-900 mb-2">
                                Trust Score Benefits
                            </h3>
                            <p className="text-indigo-700 text-sm">
                                Higher trust scores unlock premium features, better job matches,
                                and increased credibility with employers.
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Signup Form */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <SignUp
                            routing="path"
                            path="/signup"
                            redirectUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'shadow-none border-0 p-0',
                                    headerTitle: 'text-2xl font-bold text-gray-900 mb-2',
                                    headerSubtitle: 'text-gray-600 mb-6',
                                    formButtonPrimary:
                                        'bg-indigo-600 hover:bg-indigo-700 w-full py-3 text-sm font-medium',
                                    formFieldInput:
                                        'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                                    footerActionLink: 'text-indigo-600 hover:text-indigo-500',
                                    identityPreviewEditButton: 'text-indigo-600',
                                },
                            }}
                        />

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link
                                        href="/login"
                                        className="font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 text-xs text-gray-500 text-center">
                            <p>
                                By signing up, you agree to our{' '}
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
            </div>
        </div>
    );
}