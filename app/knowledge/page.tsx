'use client';

import { useAuth, useSession } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    BookOpen,
    Video,
    ListVideo,
    Clock,
    TrendingUp,
    Search,
    Filter,
    Plus
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import ContentCard from '@/components/ContentCard';
import { Input } from '@/components/ui/input';

export default function KnowledgePage() {
    const { userId } = useAuth();
    const { session } = useSession();
    const userRole = (session?.user?.publicMetadata?.role as string) || 'USER';
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const isMediaUser = userRole === 'MEDIA';

    // Fetch content
    const { data: contentData, isLoading } = useQuery({
        queryKey: ['knowledge-content', activeTab, searchQuery],
        queryFn: async () => {
            const url = new URL('/api/content', window.location.origin);
            if (activeTab !== 'all') url.searchParams.set('type', activeTab);
            if (searchQuery) url.searchParams.set('search', searchQuery);

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error('Failed to fetch content');
            return response.json();
        },
    });

    // Fetch user progress
    const { data: progressData } = useQuery({
        queryKey: ['content-progress', userId],
        queryFn: async () => {
            const response = await fetch(`/api/users/${userId}/content-progress`);
            if (!response.ok) throw new Error('Failed to fetch progress');
            return response.json();
        },
        enabled: !!userId,
    });

    const content = contentData?.data || [];
    const userProgress = progressData?.data || {};

    const getContentStats = () => {
        const videos = content.filter((item: any) => item.type === 'VIDEO');
        const playlists = content.filter((item: any) => item.type === 'PLAYLIST');

        const completed = Object.values(userProgress).filter((p: any) => p.isCompleted).length;
        const inProgress = Object.values(userProgress).filter((p: any) => !p.isCompleted && p.progress > 0).length;

        return { videos: videos.length, playlists: playlists.length, completed, inProgress };
    };

    const stats = getContentStats();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Repository</h1>
                <p className="text-gray-600">
                    Access curated learning content. Track your progress and enhance your skills.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Content</p>
                                <p className="text-2xl font-bold">{content.length}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Videos</p>
                                <p className="text-2xl font-bold">{stats.videos}</p>
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
                                <p className="text-sm text-gray-600">Playlists</p>
                                <p className="text-2xl font-bold">{stats.playlists}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <ListVideo className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold">{stats.inProgress}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Section */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                        Your Learning Progress
                    </CardTitle>
                    <CardDescription>
                        Track your completion rate and continue learning
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Overall Progress</span>
                                <span>{stats.completed}/{content.length} completed</span>
                            </div>
                            <Progress
                                value={content.length > 0 ? (stats.completed / content.length) * 100 : 0}
                                className="h-3"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Completed</span>
                                    <span className="font-medium">{stats.completed}</span>
                                </div>
                                <Progress
                                    value={content.length > 0 ? (stats.completed / content.length) * 100 : 0}
                                    className="h-2"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>In Progress</span>
                                    <span className="font-medium">{stats.inProgress}</span>
                                </div>
                                <Progress
                                    value={content.length > 0 ? (stats.inProgress / content.length) * 100 : 0}
                                    className="h-2"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Section */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Browse Content</CardTitle>
                            <CardDescription>
                                {content.length} pieces of content available
                            </CardDescription>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search content..."
                                    className="pl-10 w-full sm:w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>

                            {isMediaUser && (
                                <Link href="/knowledge/videos/new">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Content
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-6">
                            <TabsTrigger value="all">All Content</TabsTrigger>
                            <TabsTrigger value="VIDEO">Videos</TabsTrigger>
                            <TabsTrigger value="PLAYLIST">Playlists</TabsTrigger>
                            <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
                        </TabsList>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <p className="mt-4 text-gray-600">Loading content...</p>
                            </div>
                        ) : (
                            <>
                                <TabsContent value={activeTab} className="mt-0">
                                    {content.length === 0 ? (
                                        <div className="text-center py-12">
                                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
                                            <p className="text-gray-600 mb-6">
                                                {searchQuery
                                                    ? 'No content matches your search. Try different keywords.'
                                                    : 'No content available yet.'}
                                            </p>
                                            {isMediaUser && (
                                                <Link href="/knowledge/videos/new">
                                                    <Button>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add First Content
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {content.map((item: any) => (
                                                <ContentCard
                                                    key={item.id}
                                                    content={item}
                                                    progress={userProgress[item.id]}
                                                    onEnroll={async () => {
                                                        // Handle enrollment
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}