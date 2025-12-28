import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, BookOpen, Briefcase, TrendingUp } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                    Welcome to <span className="text-indigo-600">PRAMAAN</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                    A trust-based professional platform where your verified identity opens doors to opportunities,
                    knowledge, and career growth.
                </p>

                <SignedOut>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signup">
                            <Button size="lg" className="px-8">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="px-8">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </SignedOut>

                <SignedIn>
                    <div className="flex gap-4 justify-center items-center">
                        <Link href="/dashboard">
                            <Button size="lg" className="px-8">
                                Go to Dashboard
                            </Button>
                        </Link>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </SignedIn>
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Trust Scoring</h3>
                    <p className="text-gray-600">
                        Build your professional credibility with our multi-factor trust verification system.
                        Higher trust scores unlock better opportunities.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Knowledge Repository</h3>
                    <p className="text-gray-600">
                        Access curated learning content from industry experts. Track your progress and
                        enhance your skills systematically.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Job Marketplace</h3>
                    <p className="text-gray-600">
                        Connect with verified companies. Apply to jobs that match your skills and
                        trust score requirements.
                    </p>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { step: '1', title: 'Sign Up', desc: 'Create your account with email verification' },
                        { step: '2', title: 'Build Trust', desc: 'Complete your profile and get verified' },
                        { step: '3', title: 'Learn & Grow', desc: 'Access knowledge repository content' },
                        { step: '4', title: 'Get Hired', desc: 'Apply to jobs matching your trust score' },
                    ].map((item) => (
                        <div key={item.step} className="text-center">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">
                                {item.step}
                            </div>
                            <h4 className="font-semibold mb-2">{item.title}</h4>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust Score Explanation */}
            <div className="mt-16 text-center">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Your Trust Score Matters</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Trust scores are calculated based on identity verification, profile completeness,
                    and skill verification. Higher scores increase your chances of getting hired.
                </p>
            </div>
        </div>
    );
}