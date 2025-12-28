'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Building2,
    MapPin,
    DollarSign,
    Clock,
    Users,
    TrendingUp,
    ArrowLeft,
    CheckCircle,
    Briefcase,
    Calendar
} from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { applyToJob } from '@/lib/api/jobs';

export default function JobDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { userId, isLoaded } = useAuth();
    const [resumeText, setResumeText] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Fetch job details
    const { data: jobData, isLoading } = useQuery({
        queryKey: ['job', id],
        queryFn: async () => {
            const response = await fetch(`/api/jobs/${id}`);
            if (!response.ok) throw new Error('Failed to fetch job details');
            return response.json();
        },
    });

    // Fetch user trust score
    const { data: userData } = useQuery({
        queryKey: ['user-trust-score', userId],
        queryFn: async () => {
            const response = await fetch('/api/users/me');
            if (!response.ok) throw new Error('Failed to fetch user data');
            return response.json();
        },
        enabled: !!userId,
    });

    // Check if user has already applied
    const { data: applicationData } = useQuery({
        queryKey: ['job-application', id, userId],
        queryFn: async () => {
            const response = await fetch(`/api/jobs/${id}/application-status`);
            if (!response.ok) return { hasApplied: false };
            return response.json();
        },
        enabled: !!userId && !!id,
    });

    if (!isLoaded || isLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center">Loading job details...</div>
            </div>
        );
    }

    if (!jobData?.data) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <h3 className="text-lg font-semibold mb-2">Job Not Found</h3>
                        <p className="text-gray-600 mb-4">
                            The requested job could not be found or has been removed.
                        </p>
                        <Button onClick={() => router.push('/jobs')}>
                            Back to Jobs
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const job = jobData.data;
    const userTrustScore = userData?.data?.trustScore || 0;
    const hasApplied = applicationData?.hasApplied || false;
    const isEligible = userTrustScore >= job.minTrustScore;

    const handleApply = async () => {
        if (!userId) {
            router.push(`/login?redirect=/jobs/${id}`);
            return;
        }

        if (!isEligible) {
            alert(`You need a trust score of ${job.minTrustScore} to apply. Your score is ${userTrustScore}.`);
            return;
        }

        setIsApplying(true);
        setApplicationStatus('idle');

        try {
            const result = await applyToJob(job.id, { resumeUrl: resumeText }) as { success: boolean; error?: string };

            if (result.success) {
                setApplicationStatus('success');
            } else {
                setApplicationStatus('error');
                alert(result.error || 'Failed to apply. Please try again.');
            }
        } catch (error) {
            console.error('Application error:', error);
            setApplicationStatus('error');
            alert('An error occurred. Please try again.');
        } finally {
            setIsApplying(false);
        }
    };

    const skills = JSON.parse(job.skills || '[]');
    const postedDate = new Date(job.createdAt);
    const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.push('/jobs')}
                className="mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Job Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Job Header */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                                            <div className="flex items-center flex-wrap gap-2 mb-4">
                                                <div className="flex items-center text-gray-600">
                                                    <Building2 className="h-4 w-4 mr-2" />
                                                    <span>{job.companyName || 'Company'}</span>
                                                </div>
                                                {job.location && (
                                                    <div className="flex items-center text-gray-600">
                                                        <MapPin className="h-4 w-4 mr-2" />
                                                        <span>{job.location}</span>
                                                    </div>
                                                )}
                                                <Badge variant="outline" className="capitalize">
                                                    {job.type || 'Full-time'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {job.salaryRange && (
                                                <div className="flex items-center justify-end text-lg font-bold text-green-600 mb-2">
                                                    <DollarSign className="h-5 w-5 mr-1" />
                                                    {job.salaryRange}
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-500">
                                                <Clock className="h-4 w-4 inline mr-1" />
                                                Posted {daysAgo === 0 ? 'today' : `${daysAgo} days ago`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trust Score Requirement */}
                                    <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100">
                                        <CardContent className="pt-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-indigo-900 mb-1">Trust Score Requirement</h3>
                                                    <p className="text-sm text-indigo-700">
                                                        Minimum trust score required to apply for this position
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-indigo-600 mb-1">
                                                        {job.minTrustScore}
                                                    </div>
                                                    <div className={`text-sm font-medium ${isEligible ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {isEligible ? 'You are eligible!' : `You need ${job.minTrustScore - userTrustScore} more points`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Your Score: {userTrustScore}</span>
                                                    <span>Required: {job.minTrustScore}</span>
                                                </div>
                                                <Progress
                                                    value={Math.min(userTrustScore, 100)}
                                                    className="h-2 mb-1"
                                                />
                                                <Progress
                                                    value={Math.min(job.minTrustScore, 100)}
                                                    className="h-2 bg-red-100 [&>div]:bg-red-500"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Job Description */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                                    </div>
                                </div>

                                {/* Skills Required */}
                                {skills.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Skills Required</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((skill: string, index: number) => (
                                                <Badge key={index} variant="secondary" className="px-3 py-1">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Job Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold">Job Details</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm">
                                                <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                                                <span>Type: {job.type || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Users className="h-4 w-4 mr-3 text-gray-400" />
                                                <span>Experience: {job.experience || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                                                <span>Posted: {postedDate.toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-semibold">Application Information</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm">
                                                <TrendingUp className="h-4 w-4 mr-3 text-gray-400" />
                                                <span>Trust Score Required: {job.minTrustScore}+</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Clock className="h-4 w-4 mr-3 text-gray-400" />
                                                <span>Applications: {job.applicationCount || 0} received</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Application */}
                <div className="space-y-8">
                    {/* Application Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Apply for this Position</CardTitle>
                            <CardDescription>
                                Submit your application with resume details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {applicationStatus === 'success' ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Application Submitted!</h3>
                                    <p className="text-gray-600 mb-6">
                                        Your application has been submitted successfully. The employer will review it shortly.
                                    </p>
                                    <Button variant="outline" onClick={() => router.push('/jobs')}>
                                        Browse More Jobs
                                    </Button>
                                </div>
                            ) : hasApplied ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Already Applied</h3>
                                    <p className="text-gray-600 mb-6">
                                        You have already submitted an application for this position.
                                    </p>
                                    <Button variant="outline" onClick={() => router.push('/jobs')}>
                                        Browse Other Jobs
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {!isEligible && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-red-800 mb-1">Not Eligible</h4>
                                            <p className="text-sm text-red-700">
                                                Your trust score ({userTrustScore}) is below the required minimum ({job.minTrustScore}).
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 text-red-700 border-red-300"
                                                onClick={() => router.push('/profile')}
                                            >
                                                Improve Your Score
                                            </Button>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Resume Text
                                        </label>
                                        <Textarea
                                            placeholder="Paste your resume text here (or key skills and experience)..."
                                            value={resumeText}
                                            onChange={(e) => setResumeText(e.target.value)}
                                            rows={6}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            AI will analyze your resume to calculate a match score with this job.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            onClick={handleApply}
                                            disabled={!isEligible || isApplying}
                                            className="w-full"
                                        >
                                            {isApplying ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                                    Applying...
                                                </>
                                            ) : (
                                                'Submit Application'
                                            )}
                                        </Button>

                                        <p className="text-xs text-gray-500 mt-3 text-center">
                                            By applying, you agree to share your profile and trust score with the employer.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Trust Score Tips */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
                        <CardHeader>
                            <CardTitle className="text-indigo-900">Trust Score Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {[
                                    'Complete your profile with all details',
                                    'Verify your identity for +40 points',
                                    'Add verified skills for +40 points',
                                    'Complete learning content for bonus points',
                                    'Maintain positive platform activity',
                                ].map((tip, index) => (
                                    <li key={index} className="flex items-start">
                                        <div className="bg-indigo-100 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-xs font-semibold text-indigo-600">{index + 1}</span>
                                        </div>
                                        <span className="text-sm text-indigo-800">{tip}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button variant="outline" className="w-full mt-4 border-indigo-300 text-indigo-700">
                                Boost Your Score
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}