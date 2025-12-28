'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    User,
    Mail,
    Building,
    Phone,
    MapPin,
    Award,
    Calendar,
    Edit,
    Shield,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { apiClient } from '@/lib/api-client';

export default function ProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { userId: currentUserId } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isOwnProfile = currentUserId === id;

    // Fetch profile data
    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['profile', id],
        queryFn: async () => {
            const response = await fetch(`/api/users/${id}/profile`);
            if (!response.ok) throw new Error('Failed to fetch profile');
            return response.json();
        },
    });

    // Fetch user stats
    const { data: stats } = useQuery({
        queryKey: ['profile-stats', id],
        queryFn: async () => {
            const response = await fetch(`/api/users/${id}/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            </div>
        );
    }

    if (error || !profile?.data) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
                        <p className="text-gray-600 mb-4">
                            The requested profile could not be found or you don&apos;t have permission to view it.
                        </p>
                        <Button onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const userData = profile.data;
    const userStats = stats?.data || {};
    const metadata = userData.metadata || {};

    const trustScore = userData.trustScore || 0;
    const trustLevel = trustScore >= 80 ? 'Premium' : trustScore >= 60 ? 'Verified' : 'Basic';

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Profile Header */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start space-x-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                                    <User className="h-12 w-12 text-indigo-600" />
                                </div>
                                {userData.isVerified && (
                                    <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {metadata.name || 'Anonymous User'}
                                </h1>
                                <p className="text-gray-600">{userData.email}</p>
                                <div className="flex items-center mt-2 space-x-2">
                                    <Badge variant="outline" className="capitalize">
                                        {userData.role}
                                    </Badge>
                                    <Badge className={`${trustLevel === 'Premium' ? 'bg-green-100 text-green-800' :
                                            trustLevel === 'Verified' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {trustLevel} Trust
                                    </Badge>
                                    {userData.isVerified && (
                                        <Badge className="bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isOwnProfile && (
                            <Button onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Trust Score Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Award className="h-5 w-5 mr-2 text-indigo-600" />
                                Trust Score Analysis
                            </CardTitle>
                            <CardDescription>
                                Your professional credibility breakdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Overall Trust Score</span>
                                        <span className="text-2xl font-bold">{trustScore}/100</span>
                                    </div>
                                    <Progress value={trustScore} className="h-3" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Identity Verification</span>
                                            <span className="font-medium">{userData.isVerified ? '40/40' : '0/40'}</span>
                                        </div>
                                        <Progress value={userData.isVerified ? 100 : 0} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Profile Completeness</span>
                                            <span className="font-medium">
                                                {metadata.name && metadata.phone ? '20/20' : '0/20'}
                                            </span>
                                        </div>
                                        <Progress value={metadata.name && metadata.phone ? 100 : 0} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Skills Verification</span>
                                            <span className="font-medium">
                                                {metadata.skills?.length > 0 ? '40/40' : '0/40'}
                                            </span>
                                        </div>
                                        <Progress value={metadata.skills?.length > 0 ? 100 : 0} className="h-2" />
                                    </div>
                                </div>

                                {trustScore < 60 && (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <p className="text-sm text-yellow-800">
                                            <span className="font-semibold">Tip:</span> Complete your profile and verify
                                            your identity to increase your trust score. Higher scores unlock better opportunities.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{userData.email}</p>
                                    </div>
                                </div>

                                {metadata.phone && (
                                    <div className="flex items-center">
                                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Phone</p>
                                            <p className="font-medium">{metadata.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {metadata.company && (
                                    <div className="flex items-center">
                                        <Building className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Company</p>
                                            <p className="font-medium">{metadata.company}</p>
                                        </div>
                                    </div>
                                )}

                                {metadata.location && (
                                    <div className="flex items-center">
                                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Location</p>
                                            <p className="font-medium">{metadata.location}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center">
                                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Member Since</p>
                                        <p className="font-medium">
                                            {new Date(userData.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills Section */}
                    {metadata.skills && metadata.skills.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Skills & Expertise</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.skills.map((skill: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="px-3 py-1">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Stats */}
                <div className="space-y-8">
                    {/* Platform Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Content Completed</span>
                                <span className="font-semibold">{userStats.contentCompleted || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Jobs Applied</span>
                                <span className="font-semibold">{userStats.jobsApplied || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Trust Rank</span>
                                <Badge variant="outline">Top {Math.max(1, Math.floor(100 - trustScore))}%</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Last Active</span>
                                <span className="text-sm font-medium">
                                    {new Date(userData.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Benefits */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
                        <CardHeader>
                            <CardTitle className="text-indigo-900">Trust Benefits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {[
                                    { score: 60, benefit: 'Access to premium job listings' },
                                    { score: 75, benefit: 'Priority application review' },
                                    { score: 85, benefit: 'Direct recruiter access' },
                                    { score: 95, benefit: 'Featured profile placement' },
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${trustScore >= item.score ? 'bg-green-100' : 'bg-gray-100'
                                            }`}>
                                            {trustScore >= item.score ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                            )}
                                        </div>
                                        <span className={`text-sm ${trustScore >= item.score ? 'text-green-800 font-medium' : 'text-gray-600'
                                            }`}>
                                            {item.benefit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    {isOwnProfile && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" onClick={() => setIsEditModalOpen(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Award className="h-4 w-4 mr-2" />
                                    Boost Trust Score
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Request Verification
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isOwnProfile && (
                <ProfileEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    profile={{
                        name: metadata.name,
                        email: userData.email,
                        bio: metadata.bio,
                        location: metadata.location,
                        skills: metadata.skills,
                    }}
                />
            )}
        </div>
    );
}