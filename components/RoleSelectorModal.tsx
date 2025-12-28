'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Video,
    Building2,
    Check,
    Shield,
    TrendingUp,
    BookOpen,
    Briefcase
} from 'lucide-react';

interface RoleSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRole: (role: 'USER' | 'MEDIA' | 'BUSINESS') => void;
    currentRole?: string;
}

export default function RoleSelectorModal({
    isOpen,
    onClose,
    onSelectRole,
    currentRole,
}: RoleSelectorModalProps) {
    const [selectedRole, setSelectedRole] = useState<string>(currentRole || '');

    const roles = [
        {
            id: 'USER',
            title: 'Professional User',
            icon: User,
            description: 'Access knowledge content, apply to jobs, build your trust profile',
            features: [
                'Browse and enroll in knowledge content',
                'Apply to jobs matching your trust score',
                'Build your professional trust profile',
                'Track learning progress',
            ],
            badge: 'Most Popular',
            badgeColor: 'bg-green-100 text-green-800',
        },
        {
            id: 'MEDIA',
            title: 'Content Creator',
            icon: Video,
            description: 'Create and manage educational content for the knowledge repository',
            features: [
                'Add YouTube videos and playlists',
                'Manage your content library',
                'Track audience engagement',
                'Get content verified by companies',
            ],
            badge: 'For Educators',
            badgeColor: 'bg-blue-100 text-blue-800',
        },
        {
            id: 'BUSINESS',
            title: 'Business/Recruiter',
            icon: Building2,
            description: 'Post jobs, review applications, and verify content',
            features: [
                'Post job listings with trust requirements',
                'Review applications with AI matching',
                'Verify educational content',
                'Access trusted candidate pool',
            ],
            badge: 'For Employers',
            badgeColor: 'bg-purple-100 text-purple-800',
        },
    ];

    const handleSelect = (roleId: string) => {
        setSelectedRole(roleId);
    };

    const handleConfirm = () => {
        if (selectedRole && ['USER', 'MEDIA', 'BUSINESS'].includes(selectedRole)) {
            onSelectRole(selectedRole as 'USER' | 'MEDIA' | 'BUSINESS');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        Select Your Role
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Choose how you want to use PRAMAAN. You can change this later in settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${selectedRole === role.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleSelect(role.id)}
                        >
                            {role.badge && (
                                <Badge className={`absolute -top-2 left-1/2 transform -translate-x-1/2 ${role.badgeColor}`}>
                                    {role.badge}
                                </Badge>
                            )}

                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 mb-4">
                                    <role.icon className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{role.title}</h3>
                                <p className="text-gray-600 text-sm">{role.description}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {role.features.map((feature, index) => (
                                    <div key={index} className="flex items-start">
                                        <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {selectedRole === role.id ? (
                                        <>
                                            <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-indigo-700">Selected</span>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelect(role.id);
                                            }}
                                        >
                                            Select
                                        </Button>
                                    )}
                                </div>

                                {selectedRole === role.id && (
                                    <div className="text-right">
                                        <Badge variant="outline" className="bg-white">
                                            {role.id === 'USER' && <TrendingUp className="h-3 w-3 mr-1" />}
                                            {role.id === 'MEDIA' && <BookOpen className="h-3 w-3 mr-1" />}
                                            {role.id === 'BUSINESS' && <Briefcase className="h-3 w-3 mr-1" />}
                                            {role.id}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                        <Shield className="h-5 w-5 text-indigo-600 mr-3" />
                        <h4 className="font-semibold">Important Information</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Your role determines what features you can access</li>
                        <li>• You can switch roles later, but some data may not transfer</li>
                        <li>• BUSINESS roles require additional verification for job posting</li>
                        <li>• MEDIA roles can add content after email verification</li>
                    </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedRole}
                        className="min-w-[120px]"
                    >
                        Confirm Selection
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}