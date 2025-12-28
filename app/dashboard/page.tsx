'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    BookOpen,
    Briefcase,
    UserCheck,
    Clock,
    Award,
    BarChart3,
    Target
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
    const { userId, isLoaded } = useAuth();
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState({
        trustScore: 0,
        contentCompleted: 0,
        jobsApplied: 0,
        profileComplete: 0,
    });

    // Fetch user data
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: async () => {
            const response = await fetch('/api/users/me');
            if (!response.ok) throw new Error('Failed to fetch user data');
            return response.json();
        },
        enabled: !!userId,
    });

    // Fetch dashboard stats
    const { data: dashboardStats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats', userId],
        queryFn: async () => {
            const response = await fetch('/api/users/me/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },
        enabled: !!userId,
    });

    useEffect(() => {
        if (user) {
            setUserData(user.data);
            setStats({
                trustScore: user.data?.trustScore || 0,
                contentCompleted: dashboardStats?.data?.contentCompleted || 0,
                jobsApplied: dashboardStats?.data?.jobsApplied || 0,
                profileComplete: user.data?.isVerified ? 100 : 0,
            });
        }
    }, [user, dashboardStats]);

    if (!isLoaded || userLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center">Loading dashboard...</div>
            </div>
        );
    }

    const getTrustLevel = (score: number) => {
        if (score >= 80) return { label: 'Premium', color: 'text-green-600', bg: 'bg-green-100' };
        if (score >= 60) return { label: 'Verified', color: 'text-blue-600', bg: 'bg-blue-100' };
        if (score >= 40) return { label: 'Basic', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { label: 'New', color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    const trustLevel = getTrustLevel(stats.trustScore);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {userData?.metadata?.name || 'User'}!
                </h1>
                <p className="text-gray-600">
                    Here&apos;s your professional dashboard. Track your progress and discover opportunities.
                </p>
            </div>

            {/* Trust Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                            Trust Score & Profile
                        </CardTitle>
                        <CardDescription>
                            Your professional credibility score
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Trust Score</span>
                                    <Badge className={`${trustLevel.bg} ${trustLevel.color}`}>
                                        {trustLevel.label}
                                    </Badge>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Progress value={stats.trustScore} className="h-3 flex-1" />
                                    <span className="text-2xl font-bold">{stats.trustScore}/100</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm">
                                        <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                                        <span>Identity Verified</span>
                                        <Badge variant={userData?.isVerified ? "default" : "outline"} className="ml-2">
                                            {userData?.isVerified ? '✓' : 'Pending'}
                                        </Badge>
                                    </div>
                                    <Progress value={userData?.isVerified ? 100 : 0} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center text-sm">
                                        <Award className="h-4 w-4 mr-2 text-blue-500" />
                                        <span>Profile Complete</span>
                                        <span className="ml-2 text-xs">{stats.profileComplete}%</span>
                                    </div>
                                    <Progress value={stats.profileComplete} className="h-2" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Link href="/profile">
                                    <Button variant="outline" size="sm">
                                        Update Profile
                                    </Button>
                                </Link>
                                <Link href="/knowledge">
                                    <Button size="sm">
                                        Boost Trust Score
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Content Completed</p>
                                    <p className="text-2xl font-bold">{stats.contentCompleted}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                    <Briefcase className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Jobs Applied</p>
                                    <p className="text-2xl font-bold">{stats.jobsApplied}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                    <Clock className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Member Since</p>
                                    <p className="text-lg font-semibold">
                                        {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <Link href="/knowledge">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold mb-2">Knowledge Repository</h3>
                                <p className="text-sm text-gray-600">Access learning content</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/jobs">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="font-semibold mb-2">Job Marketplace</h3>
                                <p className="text-sm text-gray-600">Find opportunities</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/profile">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="font-semibold mb-2">Profile Analytics</h3>
                                <p className="text-sm text-gray-600">View insights</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Trust Goals</h3>
                            <p className="text-sm text-indigo-600">Reach 80+ for premium access</p>
                            <Progress value={stats.trustScore} className="mt-4 h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent interactions on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { action: 'Applied to job', title: 'Senior Frontend Developer', time: '2 hours ago' },
                            { action: 'Completed course', title: 'React Advanced Patterns', time: '1 day ago' },
                            { action: 'Profile updated', title: 'Added new skills', time: '3 days ago' },
                            { action: 'Trust score increased', title: 'From 65 to 72', time: '1 week ago' },
                        ].map((activity, index) => (
                            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <div className="bg-gray-100 p-2 rounded-lg mr-4">
                                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div>
                                        <p className="font-medium">{activity.action}</p>
                                        <p className="text-sm text-gray-600">{activity.title}</p>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}