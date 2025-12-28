'use client';

import { useAuth, useSession } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Briefcase,
    Filter,
    MapPin,
    DollarSign,
    Clock,
    TrendingUp,
    Search,
    Plus
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import JobCard from '@/components/JobCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function JobsPage() {
    const { userId } = useAuth();
    const { session } = useSession();
    const userRole = (session?.user?.publicMetadata?.role as string) || 'USER';
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [trustScoreFilter, setTrustScoreFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const isBusinessUser = userRole === 'BUSINESS';

    // Fetch jobs
    const { data: jobsData, isLoading } = useQuery({
        queryKey: ['jobs', searchQuery, locationFilter, trustScoreFilter, sortBy],
        queryFn: async () => {
            const url = new URL('/api/jobs', window.location.origin);
            if (searchQuery) url.searchParams.set('search', searchQuery);
            if (locationFilter) url.searchParams.set('location', locationFilter);
            if (trustScoreFilter) url.searchParams.set('minTrustScore', trustScoreFilter);
            if (sortBy) url.searchParams.set('sort', sortBy);

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error('Failed to fetch jobs');
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

    const jobs = jobsData?.data || [];
    const userTrustScore = userData?.data?.trustScore || 0;
    const pagination = jobsData?.pagination || {};

    const getJobStats = () => {
        const total = jobs.length;
        const eligible = jobs.filter((job: any) => userTrustScore >= job.minTrustScore).length;
        const applied = 0; // This would come from user-specific data

        return { total, eligible, applied };
    };

    const stats = getJobStats();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Marketplace</h1>
                        <p className="text-gray-600">
                            Find opportunities that match your skills and trust profile.
                        </p>
                    </div>

                    {isBusinessUser && (
                        <Link href="/jobs/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Post a Job
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Jobs</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Briefcase className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Eligible for You</p>
                                    <p className="text-2xl font-bold">{stats.eligible}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Your Trust Score</p>
                                    <p className="text-2xl font-bold">{userTrustScore}/100</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <Badge variant="outline" className="text-lg font-bold">
                                        {userTrustScore >= 80 ? 'Premium' : userTrustScore >= 60 ? 'Verified' : 'Basic'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search jobs..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Location"
                                className="pl-10"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            />
                        </div>

                        <Select value={trustScoreFilter} onValueChange={setTrustScoreFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Max Trust Score" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any Trust Score</SelectItem>
                                <SelectItem value="30">Up to 30</SelectItem>
                                <SelectItem value="50">Up to 50</SelectItem>
                                <SelectItem value="70">Up to 70</SelectItem>
                                <SelectItem value="90">Up to 90</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="trustScore">Lowest Trust First</SelectItem>
                                <SelectItem value="salary">Highest Salary</SelectItem>
                                <SelectItem value="relevance">Relevance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Remote Only
                        </Button>
                        <Button variant="outline" size="sm">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Salary Range
                        </Button>
                        <Button variant="outline" size="sm">
                            <Clock className="h-4 w-4 mr-2" />
                            Posted Last Week
                        </Button>
                        <Button variant="outline" size="sm">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            High Trust Jobs
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Jobs Grid */}
            <div>
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-gray-600">Loading jobs...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || locationFilter || trustScoreFilter
                                    ? 'No jobs match your criteria. Try different filters.'
                                    : 'No jobs available yet.'}
                            </p>
                            {isBusinessUser && (
                                <Link href="/jobs/new">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Post First Job
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-6 mb-8">
                            {jobs.map((job: any) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    userTrustScore={userTrustScore}
                                    onApplySuccess={() => {
                                        // Refresh data or show success message
                                    }}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{pagination.page}</span> of{' '}
                                    <span className="font-medium">{pagination.pages}</span> pages
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={pagination.page === 1}>
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm" disabled={pagination.page === pagination.pages}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}