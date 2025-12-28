import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import MaybeNavbar from '@/components/MaybeNavbar';
import { Toaster } from '@/components/ui/toaster';
import { ReactQueryProvider } from '@/lib/providers/react-query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PRAMAAN - Trust-Based Professional Platform',
    description: 'MVP for trust scoring, knowledge repository, and job marketplace',
    keywords: ['trust', 'verification', 'jobs', 'knowledge', 'professional'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const content = (
        <html lang="en">
            <body className={inter.className}>
                <ReactQueryProvider>
                    <MaybeNavbar />
                    <main className="min-h-screen bg-gray-50">
                        {children}
                    </main>
                    <Toaster />
                </ReactQueryProvider>
            </body>
        </html>
    );

    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        return content;
    }

    return <ClerkProvider>{content}</ClerkProvider>;
}