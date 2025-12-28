@echo off
setlocal enabledelayedexpansion

echo ============================================
echo PRAMAAN MVP Project Structure Generator
echo ============================================

REM Create main project directory
echo Creating main project directory...
mkdir "pramaan-mvp"
cd "pramaan-mvp"

echo Creating folder structure...

REM Create app directory and subdirectories
mkdir "app"
mkdir "app\(auth)"
mkdir "app\(auth)\login"
mkdir "app\(auth)\signup"
mkdir "app\dashboard"
mkdir "app\profile"
mkdir "app\profile\[id]"
mkdir "app\knowledge"
mkdir "app\knowledge\videos"
mkdir "app\knowledge\playlists"
mkdir "app\jobs"
mkdir "app\jobs\[id]"
mkdir "app\api"
mkdir "app\api\auth"
mkdir "app\api\auth\signup"
mkdir "app\api\auth\login"
mkdir "app\api\users"
mkdir "app\api\users\me"
mkdir "app\api\users\[id]"
mkdir "app\api\users\[id]\profile"
mkdir "app\api\content"
mkdir "app\api\jobs"
mkdir "app\api\jobs\[id]"
mkdir "app\api\jobs\[id]\apply"

REM Create components directory
mkdir "components"
mkdir "components\ui"

REM Create core directory structure
mkdir "core"
mkdir "core\domain"
mkdir "core\domain\entities"
mkdir "core\domain\value-objects"
mkdir "core\domain\repositories"
mkdir "core\domain\services"
mkdir "core\application"
mkdir "core\application\use-cases"
mkdir "core\application\dto"
mkdir "core\infrastructure"
mkdir "core\infrastructure\database"
mkdir "core\infrastructure\auth"
mkdir "core\infrastructure\external"

REM Create lib directory
mkdir "lib"
mkdir "lib\middleware"

REM Create other directories
mkdir "migrations"
mkdir "tests"

echo Creating files...

REM Create all TypeScript/TSX files
type nul > "app\(auth)\login\page.tsx"
type nul > "app\(auth)\signup\page.tsx"
type nul > "app\dashboard\page.tsx"
type nul > "app\profile\[id]\page.tsx"
type nul > "app\knowledge\page.tsx"
type nul > "app\knowledge\videos\page.tsx"
type nul > "app\knowledge\playlists\page.tsx"
type nul > "app\jobs\page.tsx"
type nul > "app\jobs\[id]\page.tsx"

type nul > "app\api\auth\signup\route.ts"
type nul > "app\api\auth\login\route.ts"
type nul > "app\api\users\me\route.ts"
type nul > "app\api\users\[id]\profile\route.ts"
type nul > "app\api\content\route.ts"
type nul > "app\api\jobs\route.ts"
type nul > "app\api\jobs\[id]\apply\route.ts"

type nul > "app\layout.tsx"
type nul > "app\page.tsx"
type nul > "app\globals.css"

REM Create component files
type nul > "components\Navbar.tsx"
type nul > "components\RoleSelectorModal.tsx"
type nul > "components\ContentCard.tsx"
type nul > "components\JobCard.tsx"
type nul > "components\TrustScoreBadge.tsx"

REM Create core domain files
type nul > "core\domain\entities\user.ts"
type nul > "core\domain\entities\content.ts"
type nul > "core\domain\entities\job.ts"
type nul > "core\domain\value-objects\trust-score.ts"
type nul > "core\domain\repositories\user-repository.ts"
type nul > "core\domain\repositories\content-repository.ts"
type nul > "core\domain\repositories\job-repository.ts"
type nul > "core\domain\services\trust-engine.ts"

REM Create application files
type nul > "core\application\use-cases\calculate-trust-score.ts"
type nul > "core\application\use-cases\create-content.ts"
type nul > "core\application\use-cases\apply-to-job.ts"
type nul > "core\application\dto\user.dto.ts"
type nul > "core\application\dto\content.dto.ts"
type nul > "core\application\dto\job.dto.ts"

REM Create infrastructure files
type nul > "core\infrastructure\database\d1-user-repository.ts"
type nul > "core\infrastructure\database\d1-content-repository.ts"
type nul > "core\infrastructure\database\d1-job-repository.ts"
type nul > "core\infrastructure\auth\clerk-adapter.ts"
type nul > "core\infrastructure\external\gemini-client.ts"

REM Create lib files
type nul > "lib\db.ts"
type nul > "lib\llm.ts"
type nul > "lib\trust-engine.ts"
type nul > "lib\validation.ts"
type nul > "lib\middleware\role-guard.ts"

REM Create migration file
type nul > "migrations\001_initial.sql"

REM Create test files
type nul > "tests\auth.test.ts"
type nul > "tests\jobs.test.ts"
type nul > "tests\trust-engine.test.ts"
type nul > "tests\llm.test.ts"

REM Create configuration files
type nul > ".env.example"
type nul > "next.config.js"
type nul > "tailwind.config.js"
type nul > "postcss.config.js"
type nul > "package.json"
type nul > "tsconfig.json"
type nul > "README.md"

echo.
echo ============================================
echo Generating file contents...
echo ============================================

REM Create .env.example with content
(
echo # Clerk Authentication
echo NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
echo CLERK_SECRET_KEY=sk_test_xxx
echo CLERK_WEBHOOK_SECRET=whsec_xxx
echo.
echo # Cloudflare D1 Database
echo CLOUDFLARE_ACCOUNT_ID=your_account_id
echo CLOUDFLARE_D1_DATABASE_ID=your_database_id
echo CLOUDFLARE_API_TOKEN=your_api_token
echo.
echo # Gemini AI API
echo GEMINI_API_KEY=your_gemini_api_key_here
echo.
echo # Application
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
echo NODE_ENV=development
echo.
echo # Optional: DigiLocker API (Placeholder for future)
echo DIGILOCKER_CLIENT_ID=your_client_id
echo DIGILOCKER_CLIENT_SECRET=your_client_secret
echo DIGILOCKER_REDIRECT_URI=http://localhost:3000/api/auth/digilocker/callback
) > ".env.example"

REM Create package.json with content
(
echo {
echo   "name": "pramaan-mvp",
echo   "version": "1.0.0",
echo   "private": true,
echo   "scripts": {
echo     "dev": "next dev",
echo     "build": "next build",
echo     "start": "next start",
echo     "lint": "next lint",
echo     "test": "vitest run",
echo     "test:watch": "vitest",
echo     "test:coverage": "vitest run --coverage",
echo     "db:migrate": "wrangler d1 migrations apply pramaan-db --local",
echo     "db:migrate:prod": "wrangler d1 migrations apply pramaan-db --remote",
echo     "db:generate": "wrangler d1 migrations create",
echo     "type-check": "tsc --noEmit",
echo     "format": "prettier --write \"**/*.{ts,tsx,md}\"",
echo     "prepare": "husky install"
echo   },
echo   "dependencies": {
echo     "@clerk/nextjs": "^5.0.0",
echo     "@google/generative-ai": "^0.21.0",
echo     "@radix-ui/react-accordion": "^1.1.2",
echo     "@radix-ui/react-alert-dialog": "^1.0.5",
echo     "@radix-ui/react-avatar": "^1.0.4",
echo     "@radix-ui/react-button": "^1.0.3",
echo     "@radix-ui/react-checkbox": "^1.0.4",
echo     "@radix-ui/react-dialog": "^1.0.5",
echo     "@radix-ui/react-dropdown-menu": "^2.0.6",
echo     "@radix-ui/react-label": "^2.0.2",
echo     "@radix-ui/react-select": "^2.0.0",
echo     "@radix-ui/react-separator": "^1.0.3",
echo     "@radix-ui/react-slot": "^1.0.2",
echo     "@radix-ui/react-switch": "^1.0.3",
echo     "@radix-ui/react-tabs": "^1.0.4",
echo     "@radix-ui/react-toast": "^1.1.5",
echo     "@tanstack/react-query": "^5.0.0",
echo     "class-variance-authority": "^0.7.0",
echo     "clsx": "^2.0.0",
echo     "lucide-react": "^0.309.0",
echo     "next": "15.0.0",
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "tailwind-merge": "^2.0.0",
echo     "tailwindcss-animate": "^1.0.7",
echo     "zod": "^3.22.0",
echo     "zustand": "^4.4.0"
echo   },
echo   "devDependencies": {
echo     "@cloudflare/workers-types": "^4.20231025.0",
echo     "@types/node": "^20.0.0",
echo     "@types/react": "^18.2.0",
echo     "@types/react-dom": "^18.2.0",
echo     "@types/supertest": "^2.0.12",
echo     "@vitest/coverage-v8": "^1.0.0",
echo     "autoprefixer": "^10.0.0",
echo     "eslint": "^8.0.0",
echo     "eslint-config-next": "15.0.0",
echo     "husky": "^8.0.0",
echo     "node-mocks-http": "^1.13.0",
echo     "postcss": "^8.0.0",
echo     "prettier": "^3.0.0",
echo     "supertest": "^6.3.3",
echo     "tailwindcss": "^3.3.0",
echo     "typescript": "^5.0.0",
echo     "vitest": "^1.0.0",
echo     "wrangler": "^3.0.0"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0"
echo   }
echo }
) > "package.json"

REM Create tsconfig.json
(
echo {
echo   "compilerOptions": {
echo     "target": "es5",
echo     "lib": ["dom", "dom.iterable", "esnext"],
echo     "allowJs": true,
echo     "skipLibCheck": true,
echo     "strict": true,
echo     "noEmit": true,
echo     "esModuleInterop": true,
echo     "module": "esnext",
echo     "moduleResolution": "bundler",
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "jsx": "preserve",
echo     "incremental": true,
echo     "plugins": [
echo       {
echo         "name": "next"
echo       }
echo     ],
echo     "paths": {
echo       "@/*": ["./*"]
echo     }
echo   },
echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
echo   "exclude": ["node_modules"]
echo }
) > "tsconfig.json"

REM Create next.config.js
(
echo /** @type {import('next').NextConfig} */
echo const nextConfig = {
echo   experimental: {
echo     serverActions: {
echo       bodySizeLimit: '2mb',
echo     },
echo   },
echo   images: {
echo     remotePatterns: [
echo       {
echo         protocol: 'https',
echo         hostname: 'img.clerk.com',
echo       },
echo       {
echo         protocol: 'https',
echo         hostname: 'images.clerk.dev',
echo       },
echo       {
echo         protocol: 'https',
echo         hostname: 'i.ytimg.com',
echo       },
echo       {
echo         protocol: 'https',
echo         hostname: 'yt3.ggpht.com',
echo       },
echo     ],
echo   },
echo   async headers() {
echo     return [
echo       {
echo         source: '/(.*)',
echo         headers: [
echo           {
echo             key: 'X-Content-Type-Options',
echo             value: 'nosniff',
echo           },
echo           {
echo             key: 'X-Frame-Options',
echo             value: 'DENY',
echo           },
echo           {
echo             key: 'X-XSS-Protection',
echo             value: '1; mode=block',
echo           },
echo         ],
echo       },
echo     ];
echo   },
echo   env: {
echo     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
echo     NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
echo   },
echo };
echo 
echo module.exports = nextConfig;
) > "next.config.js"

REM Create tailwind.config.js
(
echo /** @type {import('tailwindcss').Config} */
echo module.exports = {
echo   darkMode: ["class"],
echo   content: [
echo     './pages/**/*.{ts,tsx}',
echo     './components/**/*.{ts,tsx}',
echo     './app/**/*.{ts,tsx}',
echo     './src/**/*.{ts,tsx}',
echo   ],
echo   theme: {
echo     container: {
echo       center: true,
echo       padding: "2rem",
echo       screens: {
echo         "2xl": "1400px",
echo       },
echo     },
echo     extend: {
echo       colors: {
echo         border: "hsl(var(--border))",
echo         input: "hsl(var(--input))",
echo         ring: "hsl(var(--ring))",
echo         background: "hsl(var(--background))",
echo         foreground: "hsl(var(--foreground))",
echo         primary: {
echo           DEFAULT: "hsl(var(--primary))",
echo           foreground: "hsl(var(--primary-foreground))",
echo         },
echo         secondary: {
echo           DEFAULT: "hsl(var(--secondary))",
echo           foreground: "hsl(var(--secondary-foreground))",
echo         },
echo         destructive: {
echo           DEFAULT: "hsl(var(--destructive))",
echo           foreground: "hsl(var(--destructive-foreground))",
echo         },
echo         muted: {
echo           DEFAULT: "hsl(var(--muted))",
echo           foreground: "hsl(var(--muted-foreground))",
echo         },
echo         accent: {
echo           DEFAULT: "hsl(var(--accent))",
echo           foreground: "hsl(var(--accent-foreground))",
echo         },
echo         popover: {
echo           DEFAULT: "hsl(var(--popover))",
echo           foreground: "hsl(var(--popover-foreground))",
echo         },
echo         card: {
echo           DEFAULT: "hsl(var(--card))",
echo           foreground: "hsl(var(--card-foreground))",
echo         },
echo       },
echo       borderRadius: {
echo         lg: "var(--radius)",
echo         md: "calc(var(--radius) - 2px)",
echo         sm: "calc(var(--radius) - 4px)",
echo       },
echo       keyframes: {
echo         "accordion-down": {
echo           from: { height: 0 },
echo           to: { height: "var(--radix-accordion-content-height)" },
echo         },
echo         "accordion-up": {
echo           from: { height: "var(--radix-accordion-content-height)" },
echo           to: { height: 0 },
echo         },
echo       },
echo       animation: {
echo         "accordion-down": "accordion-down 0.2s ease-out",
echo         "accordion-up": "accordion-up 0.2s ease-out",
echo       },
echo     },
echo   },
echo   plugins: [require("tailwindcss-animate")],
echo }
) > "tailwind.config.js"

REM Create postcss.config.js
(
echo module.exports = {
echo   plugins: {
echo     tailwindcss: {},
echo     autoprefixer: {},
echo   },
echo }
) > "postcss.config.js"

REM Create initial migration file
(
echo -- Migration: 001_initial
echo -- Author: PRAMAAN MVP
echo -- Created: $(date)
echo 
echo -- Users table with indexes for performance
echo CREATE TABLE IF NOT EXISTS User (
echo     id TEXT PRIMARY KEY,
echo     email TEXT UNIQUE NOT NULL,
echo     role TEXT CHECK(role IN ('USER', 'MEDIA', 'BUSINESS')) DEFAULT 'USER',
echo     trustScore INTEGER DEFAULT 0 CHECK(trustScore >= 0 AND trustScore <= 100),
echo     isVerified BOOLEAN DEFAULT FALSE,
echo     metadata JSON DEFAULT '{}',
echo     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
echo );
echo 
echo CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
echo CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
echo CREATE INDEX IF NOT EXISTS idx_user_trustScore ON User(trustScore);
echo 
echo -- Content table for knowledge repository
echo CREATE TABLE IF NOT EXISTS Content (
echo     id TEXT PRIMARY KEY,
echo     creatorId TEXT NOT NULL,
echo     url TEXT NOT NULL,
echo     title TEXT NOT NULL,
echo     description TEXT,
echo     type TEXT CHECK(type IN ('VIDEO', 'PLAYLIST')) NOT NULL,
echo     isVerifiedByCompany BOOLEAN DEFAULT FALSE,
echo     tags JSON DEFAULT '[]',
echo     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     FOREIGN KEY (creatorId) REFERENCES User(id) ON DELETE CASCADE
echo );
echo 
echo CREATE INDEX IF NOT EXISTS idx_content_creator ON Content(creatorId);
echo CREATE INDEX IF NOT EXISTS idx_content_type ON Content(type);
echo CREATE INDEX IF NOT EXISTS idx_content_verified ON Content(isVerifiedByCompany);
echo 
echo -- UserContentProgress table for tracking progress
echo CREATE TABLE IF NOT EXISTS UserContentProgress (
echo     userId TEXT NOT NULL,
echo     contentId TEXT NOT NULL,
echo     progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
echo     isCompleted BOOLEAN DEFAULT FALSE,
echo     lastAccessed DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     PRIMARY KEY (userId, contentId),
echo     FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
echo     FOREIGN KEY (contentId) REFERENCES Content(id) ON DELETE CASCADE
echo );
echo 
echo CREATE INDEX IF NOT EXISTS idx_progress_user ON UserContentProgress(userId);
echo CREATE INDEX IF NOT EXISTS idx_progress_content ON UserContentProgress(contentId);
echo 
echo -- Jobs table for marketplace
echo CREATE TABLE IF NOT EXISTS Job (
echo     id TEXT PRIMARY KEY,
echo     companyId TEXT NOT NULL,
echo     title TEXT NOT NULL,
echo     description TEXT NOT NULL,
echo     minTrustScore INTEGER DEFAULT 0 CHECK(minTrustScore >= 0 AND minTrustScore <= 100),
echo     skills JSON DEFAULT '[]',
echo     location TEXT,
echo     salaryRange TEXT,
echo     isActive BOOLEAN DEFAULT TRUE,
echo     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     FOREIGN KEY (companyId) REFERENCES User(id) ON DELETE CASCADE
echo );
echo 
echo CREATE INDEX IF NOT EXISTS idx_job_company ON Job(companyId);
echo CREATE INDEX IF NOT EXISTS idx_job_minTrustScore ON Job(minTrustScore);
echo CREATE INDEX IF NOT EXISTS idx_job_active ON Job(isActive);
echo 
echo -- JobApplications table
echo CREATE TABLE IF NOT EXISTS JobApplication (
echo     id TEXT PRIMARY KEY,
echo     jobId TEXT NOT NULL,
echo     userId TEXT NOT NULL,
echo     resumeText TEXT,
echo     matchScore INTEGER CHECK(matchScore >= 0 AND matchScore <= 100),
echo     status TEXT CHECK(status IN ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED')) DEFAULT 'PENDING',
echo     appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     FOREIGN KEY (jobId) REFERENCES Job(id) ON DELETE CASCADE,
echo     FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
echo     UNIQUE(jobId, userId)
echo );
echo 
echo CREATE INDEX IF NOT EXISTS idx_application_job ON JobApplication(jobId);
echo CREATE INDEX IF NOT EXISTS idx_application_user ON JobApplication(userId);
echo CREATE INDEX IF NOT EXISTS idx_application_status ON JobApplication(status);
) > "migrations\001_initial.sql"

REM Create app/layout.tsx with basic content
(
echo import type { Metadata } from 'next';
echo import { Inter } from 'next/font/google';
echo import './globals.css';
echo import Navbar from '@/components/Navbar';
echo import { ClerkProvider } from '@clerk/nextjs';
echo 
echo const inter = Inter({ subsets: ['latin'] });
echo 
echo export const metadata: Metadata = {
echo   title: 'PRAMAAN MVP',
echo   description: 'Trust-Based Professional Platform',
echo };
echo 
echo export default function RootLayout({
echo   children,
echo }: Readonly<{
echo   children: React.ReactNode;
echo }>) {
echo   return (
echo     <ClerkProvider>
echo       <html lang="en">
echo         <body className=\{inter.className\}>
echo           <Navbar />
echo           <main className="container mx-auto px-4 py-8">
echo             {children}
echo           </main>
echo         </body>
echo       </html>
echo     </ClerkProvider>
echo   );
echo }
) > "app\layout.tsx"

REM Create app/globals.css
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo 
echo @layer base {
echo   :root {
echo     --background: 0 0% 100%;
echo     --foreground: 222.2 84% 4.9%;
echo     --card: 0 0% 100%;
echo     --card-foreground: 222.2 84% 4.9%;
echo     --popover: 0 0% 100%;
echo     --popover-foreground: 222.2 84% 4.9%;
echo     --primary: 222.2 47.4% 11.2%;
echo     --primary-foreground: 210 40% 98%;
echo     --secondary: 210 40% 96.1%;
echo     --secondary-foreground: 222.2 47.4% 11.2%;
echo     --muted: 210 40% 96.1%;
echo     --muted-foreground: 215.4 16.3% 46.9%;
echo     --accent: 210 40% 96.1%;
echo     --accent-foreground: 222.2 47.4% 11.2%;
echo     --destructive: 0 84.2% 60.2%;
echo     --destructive-foreground: 210 40% 98%;
echo     --border: 214.3 31.8% 91.4%;
echo     --input: 214.3 31.8% 91.4%;
echo     --ring: 222.2 84% 4.9%;
echo     --radius: 0.5rem;
echo   }
echo 
echo   .dark {
echo     --background: 222.2 84% 4.9%;
echo     --foreground: 210 40% 98%;
echo     --card: 222.2 84% 4.9%;
echo     --card-foreground: 210 40% 98%;
echo     --popover: 222.2 84% 4.9%;
echo     --popover-foreground: 210 40% 98%;
echo     --primary: 210 40% 98%;
echo     --primary-foreground: 222.2 47.4% 11.2%;
echo     --secondary: 217.2 32.6% 17.5%;
echo     --secondary-foreground: 210 40% 98%;
echo     --muted: 217.2 32.6% 17.5%;
echo     --muted-foreground: 215 20.2% 65.1%;
echo     --accent: 217.2 32.6% 17.5%;
echo     --accent-foreground: 210 40% 98%;
echo     --destructive: 0 62.8% 30.6%;
echo     --destructive-foreground: 210 40% 98%;
echo     --border: 217.2 32.6% 17.5%;
echo     --input: 217.2 32.6% 17.5%;
echo     --ring: 212.7 26.8% 83.9%;
echo   }
echo }
echo 
echo @layer base {
echo   * {
echo     @apply border-border;
echo   }
echo   body {
echo     @apply bg-background text-foreground;
echo   }
echo }
) > "app\globals.css"

echo.
echo ============================================
echo Project structure created successfully!
echo ============================================
echo.
echo Next steps:
echo 1. Navigate to the project directory: cd pramaan-mvp
echo 2. Install dependencies: npm install
echo 3. Set up environment variables in .env.local
echo 4. Run the development server: npm run dev
echo.
pause