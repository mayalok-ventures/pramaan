'use client';

export const dynamic = 'force-dynamic';

import { useAuth, useSession } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    ListVideo,
    Filter,
    PlayCircle,
    Clock,
    Eye,
    Plus,
    Search,
    Users
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface PlaylistProgress {
    progress: number;
    isCompleted: boolean;
}

interface Playlist {
    id: string;
    title: string;
    description?: string;
    tags?: string;
    videoCount?: number;
    duration?: string;
    enrollmentCount?: number;
}

export default function PlaylistsPage() {
    const { userId } = useAuth();
    const { session } = useSession();
    const userRole = (session?.user?.publicMetadata?.role as string) || 'USER';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const isMediaUser = userRole === 'MEDIA';

    // Fetch playlists
    const { data: playlistsData, isLoading } = useQuery({
        queryKey: ['playlists', searchQuery, selectedCategory],
        queryFn: async () => {
            const url = new URL('/api/content', window.location.origin);
            url.searchParams.set('type', 'PLAYLIST');
            if (searchQuery) url.searchParams.set('search', searchQuery);
            if (selectedCategory !== 'all') url.searchParams.set('category', selectedCategory);

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error('Failed to fetch playlists');
            return response.json();
        },
    });

    // Fetch user progress
    const { data: progressData } = useQuery({
        queryKey: ['playlist-progress', userId],
        queryFn: async () => {
            const response = await fetch(`/api/users/${userId}/content-progress`);
            if (!response.ok) throw new Error('Failed to fetch progress');
            return response.json();
        },
        enabled: !!userId,
    });

    const playlists = playlistsData?.data || [];
    const userProgress = progressData?.data || {};

    const categories: string[] = [
        'all',
        ...(Array.from(new Set((playlists as Playlist[]).flatMap((p) =>
            JSON.parse(p.tags || '[]') as string[]
        ))) as string[]).slice(0, 10)
    ];

    const getPlaylistStats = () => {
        const enrolled = Object.keys(userProgress).length;
        const completed = Object.values(userProgress as Record<string, PlaylistProgress>)
            .filter((p) => p.isCompleted)
            .length;

        const totalVideos = (playlists as Playlist[]).reduce((sum: number, playlist) => {
            return sum + (playlist.videoCount || 0);
        }, 0);

        return { enrolled, completed, totalVideos };
    };

    const stats = getPlaylistStats();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Playlists</h1>
                        <p className="text-gray-600">
                            Curated learning paths and video collections for structured skill development.
                        </p>
                    </div>

                    {isMediaUser && (
                        <Link href="/knowledge/playlists/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Playlist
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Playlists</p>
                                    <p className="text-2xl font-bold">{playlists.length}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <ListVideo className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Enrolled</p>
                                    <p className="text-2xl font-bold">{stats.enrolled}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Users className="h-6 w-6 text-blue-600" />
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
                                    <p className="text-sm text-gray-600">Total Videos</p>
                                    <p className="text-2xl font-bold">{stats.totalVideos}</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-lg">
                                    <Clock className="h-6 w-6 text-yellow-600" />
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
                                placeholder="Search playlists..."
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

            {/* Playlists Grid */}
            <div>
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-gray-600">Loading playlists...</p>
                    </div>
                ) : playlists.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <ListVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Playlists Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || selectedCategory !== 'all'
                                    ? 'No playlists match your criteria. Try different filters.'
                                    : 'No playlists available yet.'}
                            </p>
                            {isMediaUser && (
                                <Link href="/knowledge/playlists/new">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Playlist
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {playlists.map((playlist: any) => (
                            <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{playlist.title}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {playlist.description?.substring(0, 100)}...
                                            </CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="ml-2">
                                            {playlist.videoCount || 0} videos
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Duration</span>
                                            <span className="font-medium">{playlist.duration || 'N/A'}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Enrolled</span>
                                            <span className="font-medium">{playlist.enrollmentCount || 0} users</span>
                                        </div>

                                        {playlist.tags && (
                                            <div className="flex flex-wrap gap-1">
                                                {JSON.parse(playlist.tags).slice(0, 3).map((tag: string, index: number) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {JSON.parse(playlist.tags).length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{JSON.parse(playlist.tags).length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            <div className="flex justify-between items-center">
                                                {userProgress[playlist.id] ? (
                                                    <>
                                                        <div className="flex-1 mr-4">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span>Progress</span>
                                                                <span>{userProgress[playlist.id].progress}%</span>
                                                            </div>
                                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-green-500"
                                                                    style={{ width: `${userProgress[playlist.id].progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        {userProgress[playlist.id].isCompleted ? (
                                                            <Badge className="bg-green-100 text-green-800">
                                                                Completed
                                                            </Badge>
                                                        ) : (
                                                            <Button size="sm">Continue</Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Button className="w-full">Enroll Now</Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}