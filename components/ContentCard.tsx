'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    PlayCircle,
    Clock,
    User,
    CheckCircle,
    ExternalLink,
    Bookmark,
    TrendingUp,
    Eye
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface ContentCardProps {
    content: {
        id: string;
        title: string;
        description?: string;
        url: string;
        type: 'VIDEO' | 'PLAYLIST';
        creatorId: string;
        creatorEmail?: string;
        isVerifiedByCompany: boolean;
        tags: string[];
        duration?: string;
        videoCount?: number;
        enrollmentCount: number;
        avgProgress: number;
        createdAt: string;
    };
    progress?: {
        progress: number;
        isCompleted: boolean;
        lastAccessed: string;
    };
    onEnroll: (contentId: string) => Promise<void>;
    onProgressUpdate?: (contentId: string, progress: number) => Promise<void>;
}

export default function ContentCard({
    content,
    progress,
    onEnroll,
    onProgressUpdate,
}: ContentCardProps) {
    const { isSignedIn } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(!!progress);

    const isYouTube = content.url.includes('youtube.com') || content.url.includes('youtu.be');
    const youtubeId = isYouTube
        ? content.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]
        : null;

    const handleEnroll = async () => {
        if (!isSignedIn) {
            // Redirect to login
            window.location.href = `/login?redirect=/knowledge`;
            return;
        }

        setIsLoading(true);
        try {
            await onEnroll(content.id);
            setIsEnrolled(true);
        } catch (error) {
            console.error('Enrollment failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProgressUpdate = async (newProgress: number) => {
        if (!isSignedIn || !onProgressUpdate) return;

        setIsLoading(true);
        try {
            await onProgressUpdate(content.id, newProgress);
        } catch (error) {
            console.error('Progress update failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getContentIcon = () => {
        if (content.type === 'VIDEO') {
            return <PlayCircle className="h-5 w-5 text-red-500" />;
        }
        return <div className="h-5 w-5 text-purple-500">📚</div>;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            {/* YouTube Thumbnail Preview */}
            {youtubeId && (
                <div className="relative aspect-video bg-gray-900">
                    <img
                        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                        alt={content.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-white opacity-80" />
                    </div>
                    {content.type === 'PLAYLIST' && (
                        <Badge className="absolute top-2 right-2 bg-black bg-opacity-70 text-white">
                            {content.videoCount || 0} videos
                        </Badge>
                    )}
                </div>
            )}

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                                {getContentIcon()}
                                <Badge variant="outline" className="ml-2 text-xs capitalize">
                                    {content.type.toLowerCase()}
                                </Badge>
                            </div>
                            {content.isVerifiedByCompany && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                            {content.description || 'No description available'}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                {/* Tags */}
                {content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {content.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {content.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{content.tags.length - 3} more
                            </Badge>
                        )}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                            {content.duration || 'N/A'}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                            {content.enrollmentCount} enrolled
                        </span>
                    </div>
                    <div className="flex items-center col-span-2">
                        <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                            Avg. progress: {Math.round(content.avgProgress)}%
                        </span>
                    </div>
                </div>

                {/* Progress Section */}
                {isEnrolled && progress && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Your progress</span>
                            <span className="font-medium">{progress.progress}%</span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                        {progress.isCompleted && (
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed {formatDate(progress.lastAccessed)}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-3 border-t border-gray-100">
                <div className="flex gap-2 w-full">
                    {isEnrolled ? (
                        <>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.open(content.url, '_blank')}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Watch Now
                            </Button>
                            {!progress?.isCompleted && onProgressUpdate && (
                                <Button
                                    size="sm"
                                    onClick={() => handleProgressUpdate(progress?.progress === 100 ? 0 : 100)}
                                    disabled={isLoading}
                                >
                                    {progress?.progress === 100 ? 'Mark Incomplete' : 'Mark Complete'}
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button
                            className="flex-1"
                            onClick={handleEnroll}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                    Enrolling...
                                </>
                            ) : (
                                <>
                                    <Bookmark className="h-4 w-4 mr-2" />
                                    Enroll Now
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}