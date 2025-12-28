'use client';

export const dynamic = 'force-dynamic';

import { useAuth, useSession } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Video,
    Filter,
    PlayCircle,
    Clock,
    Eye,
    Plus,
    Search
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import ContentCard from '@/components/ContentCard';

interface VideoProgress {
    progress: number;
    isCompleted: boolean;
}

interface Video {
    id: string;
    title: string;
    description?: string;
    tags?: string;
    duration?: number;
}

export default function VideosPage() {
    const { userId } = useAuth();
    const { session } = useSession();
    const userRole = (session?.user?.publicMetadata?.role as string) || 'USER';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const isMediaUser = userRole === 'MEDIA';

    // Fetch videos
    const { data: videosData, isLoading } = useQuery({
        queryKey: ['videos', searchQuery, selectedCategory],
        queryFn: async () => {
            const url = new URL('/api/content', window.location.origin);
            url.searchParams.set('type', 'VIDEO');
            if (searchQuery) url.searchParams.set('search', searchQuery);
            if (selectedCategory !== 'all') url.searchParams.set('category', selectedCategory);

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error('Failed to fetch videos');
            return response.json();
        },
    });

    // Fetch user progress
    const { data: progressData } = useQuery({
        queryKey: ['video-progress', userId],
        queryFn: async () => {
            const response = await fetch(`/api/users/${userId}/content-progress`);
            if (!response.ok) throw new Error('Failed to fetch progress');
            return response.json();
        },
        enabled: !!userId,
    });

    const videos = videosData?.data || [];
    const userProgress = progressData?.data || {};

    const categories: string[] = [
        'all',
        ...(Array.from(new Set((videos as Video[]).flatMap((v) =>
            JSON.parse(v.tags || '[]') as string[]
        ))) as string[]).slice(0, 10)
    ];

    const getVideoStats = () => {
        const completed = Object.entries(userProgress as Record<string, VideoProgress>)
            .filter(([, p]) => p.isCompleted)
            .length;
        const totalDuration = (videos as Video[]).reduce((sum: number, video) => {
            return sum + (video.duration || 0);
        }, 0);

        return { completed, totalDuration };
    };

    const stats = getVideoStats();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Library</h1>
                        <p className="text-gray-600">
                            Watch curated videos from industry experts. Track your learning progress.
                        </p>
                    </div>

                    {isMediaUser && (
                        <Link href="/knowledge/videos/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Video
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
                                    <p className="text-sm text-gray-600">Total Videos</p>
                                    <p className="text-2xl font-bold">{videos.length}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <Video className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Completed</p>
                                    <p className="text-2xl font-bold">{stats.completed}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <PlayCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Duration</p>
                                    <p className="text-2xl font-bold">{stats.totalDuration}m</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Clock className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search videos..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                            {categories.map((category) => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(category)}
                                    className="whitespace-nowrap"
                                >
                                    {category === 'all' ? 'All Categories' : category}
                                </Button>
                            ))}
                        </div>

                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            More Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Videos Grid */}
            <div>
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-gray-600">Loading videos...</p>
                    </div>
                ) : videos.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Videos Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || selectedCategory !== 'all'
                                    ? 'No videos match your criteria. Try different filters.'
                                    : 'No videos available yet.'}
                            </p>
                            {isMediaUser && (
                                <Link href="/knowledge/videos/new">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Video
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video: any) => (
                            <ContentCard
                                key={video.id}
                                content={video}
                                progress={userProgress[video.id]}
                                onEnroll={async () => {
                                    // Handle enrollment
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}