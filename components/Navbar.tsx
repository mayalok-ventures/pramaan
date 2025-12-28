'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { Menu, X, Bell, Search, Home, BookOpen, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TrustScoreBadge from '@/components/TrustScoreBadge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const userRole = (user?.publicMetadata?.role as string) || 'USER';

    const navigation = [
        { name: 'Home', href: '/', icon: Home, roles: ['USER', 'MEDIA', 'BUSINESS'] },
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['USER', 'MEDIA', 'BUSINESS'] },
        { name: 'Knowledge', href: '/knowledge', icon: BookOpen, roles: ['USER', 'MEDIA', 'BUSINESS'] },
        { name: 'Jobs', href: '/jobs', icon: Briefcase, roles: ['USER', 'BUSINESS'] },
        { name: 'Profile', href: '/profile', icon: User, roles: ['USER', 'MEDIA', 'BUSINESS'] },
    ];

    const filteredNav = navigation.filter(item => {
        // Show all nav items to signed out users (except dashboard)
        if (!isSignedIn) {
            return item.name === 'Home' || item.name === 'Knowledge' || item.name === 'Jobs';
        }
        return item.roles.includes(userRole);
    });

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-lg">P</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">PRAMAAN</span>
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                MVP
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:ml-10 md:flex md:space-x-1">
                            {filteredNav.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon className="h-4 w-4 mr-2" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-3">
                        {/* Search (Desktop) */}
                        <div className="hidden lg:block relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="pl-10 w-64 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {isSignedIn ? (
                            <>
                                {/* Notifications */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <Bell className="h-5 w-5" />
                                            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-80">
                                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <div className="max-h-96 overflow-y-auto">
                                            {[
                                                { title: 'Trust Score Increased', desc: 'Your trust score increased to 75', time: '2 hours ago' },
                                                { title: 'New Job Match', desc: 'Senior Developer position matches your profile', time: '1 day ago' },
                                                { title: 'Content Recommendation', desc: 'New React tutorial available', time: '2 days ago' },
                                            ].map((notification, index) => (
                                                <DropdownMenuItem key={index} className="flex flex-col items-start py-3">
                                                    <div className="font-medium">{notification.title}</div>
                                                    <div className="text-sm text-gray-600">{notification.desc}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{notification.time}</div>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-center text-indigo-600">
                                            View all notifications
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Trust Score Badge */}
                                <TrustScoreBadge
                                    score={user?.publicMetadata?.trustScore as number || 0}
                                    isVerified={user?.publicMetadata?.isVerified as boolean || false}
                                />

                                {/* User Menu */}
                                <div className="hidden md:flex items-center space-x-3">
                                    <span className="text-sm text-gray-700">
                                        {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]}
                                    </span>
                                    <UserButton
                                        afterSignOutUrl="/"
                                        appearance={{
                                            elements: {
                                                userButtonAvatarBox: 'h-8 w-8',
                                            },
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="hidden md:flex space-x-3">
                                <Link href="/login">
                                    <Button variant="ghost">Sign In</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button>Get Started</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? (
                                    <X className="block h-6 w-6" />
                                ) : (
                                    <Menu className="block h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="px-4 pt-2 pb-3 space-y-1">
                        {/* Mobile Search */}
                        <div className="px-3 mb-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <Input
                                    type="search"
                                    placeholder="Search..."
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>

                        {filteredNav.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive(item.href)
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                {item.name}
                            </Link>
                        ))}

                        {isSignedIn ? (
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center px-3 py-2">
                                    <UserButton
                                        afterSignOutUrl="/"
                                        appearance={{
                                            elements: {
                                                userButtonAvatarBox: 'h-10 w-10',
                                            },
                                        }}
                                    />
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800">
                                            {user?.firstName || 'User'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {user?.emailAddresses?.[0]?.emailAddress}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    Profile Settings
                                </Link>
                                <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-gray-200 space-y-2">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}