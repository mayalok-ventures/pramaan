'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Building2,
    MapPin,
    DollarSign,
    Clock,
    TrendingUp,
    CheckCircle,
    Briefcase,
    Calendar,
    Users
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface JobCardProps {
    job: {
        id: string;
        title: string;
        companyId: string;
        companyName?: string;
        description: string;
        minTrustScore: number;
        skills: string[];
        location?: string;
        salaryRange?: string;
        type?: string;
        experience?: string;
        isActive: boolean;
        createdAt: string;
        applicationCount?: number;
    };
    userTrustScore: number;
    onApplySuccess?: () => void;
    compact?: boolean;
}

export default function JobCard({
    job,
    userTrustScore,
    onApplySuccess,
    compact = false,
}: JobCardProps) {
    const { isSignedIn } = useAuth();
    const [isApplying, setIsApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    const isEligible = userTrustScore >= job.minTrustScore;
    const postedDate = new Date(job.createdAt);
    const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

    const handleApply = async () => {
        if (!isSignedIn) {
            window.location.href = `/login?redirect=/jobs/${job.id}`;
            return;
        }

        if (!isEligible) {
            alert(`You need a trust score of ${job.minTrustScore} to apply. Your score is ${userTrustScore}.`);
            return;
        }

        setIsApplying(true);
        try {
            // In a real implementation, this would call the API
            const response = await fetch(`/api/jobs/${job.id}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText: '' }),
            });

            if (response.ok) {
                setHasApplied(true);
                onApplySuccess?.();
            }
        } catch (error) {
            console.error('Application failed:', error);
        } finally {
            setIsApplying(false);
        }
    };

    if (compact) {
        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                    {job.type || 'Full-time'}
                                </Badge>
                                {!job.isActive && (
                                    <Badge variant="secondary" className="text-xs">
                                        Closed
                                    </Badge>
                                )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                                <Building2 className="h-4 w-4 mr-2" />
                                {job.companyName || 'Company'}
                                {job.location && (
                                    <>
                                        <MapPin className="h-4 w-4 ml-4 mr-2" />
                                        {job.location}
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className={`text-sm font-medium ${isEligible ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        Trust: {job.minTrustScore}+
                                    </span>
                                </div>
                                <Link href={`/jobs/${job.id}`}>
                                    <Button size="sm" variant="outline">
                                        View Details
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                                {job.type || 'Full-time'}
                            </Badge>
                            {!job.isActive && (
                                <Badge variant="secondary">Closed</Badge>
                            )}
                            {job.salaryRange && (
                                <Badge className="bg-green-100 text-green-800">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {job.salaryRange}
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="flex items-center flex-wrap gap-4">
                            <span className="flex items-center">
                                <Building2 className="h-4 w-4 mr-2" />
                                {job.companyName || 'Company'}
                            </span>
                            {job.location && (
                                <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {job.location}
                                </span>
                            )}
                            <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                            </span>
                        </CardDescription>
                    </div>

                    <div className="flex-shrink-0">
                        {job.applicationCount !== undefined && (
                            <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                {job.applicationCount} applications
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-6">
                    {/* Job Description Preview */}
                    <div>
                        <p className="text-gray-700 line-clamp-3">
                            {job.description}
                        </p>
                        <Link href={`/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center mt-2">
                            Read full description
                            <span className="ml-1">→</span>
                        </Link>
                    </div>

                    {/* Skills */}
                    {job.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.slice(0, 5).map((skill, index) => (
                                    <Badge key={index} variant="secondary">
                                        {skill}
                                    </Badge>
                                ))}
                                {job.skills.length > 5 && (
                                    <Badge variant="outline">
                                        +{job.skills.length - 5} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trust Score Requirement */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Trust Score Requirement</h4>
                                <p className="text-sm text-gray-600">
                                    Minimum trust score needed to apply
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{job.minTrustScore}</div>
                                <div className={`text-sm font-medium ${isEligible ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {isEligible ? 'You are eligible!' : 'Not eligible'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Your Score: {userTrustScore}</span>
                                <span>Required: {job.minTrustScore}</span>
                            </div>
                            <div className="relative">
                                <Progress
                                    value={Math.min(userTrustScore, 100)}
                                    className="h-2"
                                />
                                <div
                                    className="absolute top-0 h-2 bg-red-500 rounded-full"
                                    style={{
                                        left: `${Math.min(userTrustScore, 100)}%`,
                                        width: `${Math.max(0, Math.min(job.minTrustScore - userTrustScore, 100 - userTrustScore))}%`,
                                    }}
                                />
                            </div>
                            {!isEligible && (
                                <p className="text-sm text-red-600 mt-1">
                                    You need {job.minTrustScore - userTrustScore} more points to apply
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Experience & Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {job.experience && (
                            <div className="flex items-center">
                                <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Experience</p>
                                    <p className="font-medium">{job.experience}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Posted</p>
                                <p className="font-medium">
                                    {postedDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="border-t border-gray-100 pt-6">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {hasApplied ? (
                        <div className="flex items-center justify-center w-full py-2 bg-green-50 text-green-700 rounded-lg">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Applied Successfully
                        </div>
                    ) : (
                        <>
                            <Link href={`/jobs/${job.id}`} className="sm:flex-1">
                                <Button variant="outline" className="w-full">
                                    View Details
                                </Button>
                            </Link>
                            <Button
                                onClick={handleApply}
                                disabled={!isEligible || isApplying || !job.isActive}
                                className="sm:flex-1"
                            >
                                {isApplying ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                        Applying...
                                    </>
                                ) : (
                                    'Apply Now'
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}