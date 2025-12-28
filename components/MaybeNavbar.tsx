'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function MaybeNavbar() {
    const pathname = usePathname() || '';

    // Hide navbar on auth screens so only the Clerk auth box is visible
    const hideOn = ['/login', '/signup', '/sign-in', '/sign-up'];
    if (hideOn.includes(pathname)) return null;

    return <Navbar />;
}
