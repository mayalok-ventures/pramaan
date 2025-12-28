'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Shield,
    TrendingUp,
    Award,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { useState } from 'react';

interface TrustScoreBadgeProps {
    score: number;
    isVerified: boolean;
    showTooltip?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function TrustScoreBadge({
    score,
    isVerified,
    showTooltip = true,
    size = 'md'
}: TrustScoreBadgeProps) {
    const [isHovered, setIsHovered] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
        if (score >= 60) return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
        if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    };

    const getScoreLevel = (score: number) => {
        if (score >= 90) return { label: 'Elite', icon: Award, color: 'text-green-600' };
        if (score >= 80) return { label: 'Premium', icon: TrendingUp, color: 'text-green-500' };
        if (score >= 70) return { label: 'Advanced', icon: TrendingUp, color: 'text-blue-500' };
        if (score >= 60) return { label: 'Verified', icon: CheckCircle, color: 'text-blue-400' };
        if (score >= 40) return { label: 'Basic', icon: Shield, color: 'text-yellow-500' };
        return { label: 'New', icon: AlertCircle, color: 'text-gray-500' };
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'px-2 py-0.5 text-xs';
            case 'lg': return 'px-4 py-2 text-base';
            default: return 'px-3 py-1 text-sm';
        }
    };

    const colors = getScoreColor(score);
    const level = getScoreLevel(score);
    const sizeClasses = getSizeClasses();

    const badgeContent = (
        <Badge
            className={`${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} font-medium border flex items-center gap-1 transition-all duration-200 ${isHovered && showTooltip ? 'scale-105' : ''
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <level.icon className={`h-3 w-3 ${level.color}`} />
            <span className="font-bold">{score}</span>
            <span className="hidden sm:inline">/100</span>
        </Badge>
    );

    if (!showTooltip) {
        return badgeContent;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {badgeContent}
                </TooltipTrigger>
                <TooltipContent className="w-80 p-4">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Shield className="h-5 w-5 text-indigo-600 mr-2" />
                                <h4 className="font-semibold">Trust Score</h4>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{score}/100</div>
                                <div className={`text-sm font-medium ${level.color}`}>
                                    {level.label} Level
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Progress to Next Level</span>
                                <span>
                                    {score >= 80 ? 'Max Level' :
                                        score >= 60 ? `${80 - score} to Premium` :
                                            score >= 40 ? `${60 - score} to Verified` :
                                                `${40 - score} to Basic`}
                                </span>
                            </div>
                            <Progress
                                value={score}
                                className="h-2"
                            />
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Identity Verified</span>
                                <span className="font-medium">
                                    {isVerified ? '40/40' : '0/40'}
                                    {isVerified && <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Profile Complete</span>
                                <span className="font-medium">
                                    {score >= 60 ? '20/20' : '0/20'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Skills Verified</span>
                                <span className="font-medium">
                                    {score >= 80 ? '40/40' : '0/40'}
                                </span>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="pt-2 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-700 mb-2">Current Benefits:</h5>
                            <ul className="space-y-1 text-xs text-gray-600">
                                {score >= 40 && (
                                    <li className="flex items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></div>
                                        Access to basic job listings
                                    </li>
                                )}
                                {score >= 60 && (
                                    <li className="flex items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
                                        Apply to verified jobs
                                    </li>
                                )}
                                {score >= 80 && (
                                    <li className="flex items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-2"></div>
                                        Priority application review
                                    </li>
                                )}
                                {score >= 90 && (
                                    <li className="flex items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-2"></div>
                                        Direct recruiter access
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                                Need a higher score? Complete your profile and verify your identity.
                            </div>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}