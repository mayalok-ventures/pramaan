-- Migration: 001_initial
-- Author: PRAMAAN MVP
-- Created: $(date)

-- Users table with indexes for performance
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('USER', 'MEDIA', 'BUSINESS')) DEFAULT 'USER',
    trustScore INTEGER DEFAULT 0 CHECK(trustScore >= 0 AND trustScore <= 100),
    isVerified BOOLEAN DEFAULT FALSE,
    metadata JSON DEFAULT '{}',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_user_trustScore ON User(trustScore);

-- Content table for knowledge repository
CREATE TABLE IF NOT EXISTS Content (
    id TEXT PRIMARY KEY,
    creatorId TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('VIDEO', 'PLAYLIST')) NOT NULL,
    isVerifiedByCompany BOOLEAN DEFAULT FALSE,
    tags JSON DEFAULT '[]',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creatorId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_creator ON Content(creatorId);
CREATE INDEX IF NOT EXISTS idx_content_type ON Content(type);
CREATE INDEX IF NOT EXISTS idx_content_verified ON Content(isVerifiedByCompany);

-- UserContentProgress table for tracking progress
CREATE TABLE IF NOT EXISTS UserContentProgress (
    userId TEXT NOT NULL,
    contentId TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
    isCompleted BOOLEAN DEFAULT FALSE,
    lastAccessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userId, contentId),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (contentId) REFERENCES Content(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON UserContentProgress(userId);
CREATE INDEX IF NOT EXISTS idx_progress_content ON UserContentProgress(contentId);

-- Jobs table for marketplace
CREATE TABLE IF NOT EXISTS Job (
    id TEXT PRIMARY KEY,
    companyId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    minTrustScore INTEGER DEFAULT 0 CHECK(minTrustScore >= 0 AND minTrustScore <= 100),
    skills JSON DEFAULT '[]',
    location TEXT,
    salaryRange TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (companyId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_company ON Job(companyId);
CREATE INDEX IF NOT EXISTS idx_job_minTrustScore ON Job(minTrustScore);
CREATE INDEX IF NOT EXISTS idx_job_active ON Job(isActive);

-- JobApplications table
CREATE TABLE IF NOT EXISTS JobApplication (
    id TEXT PRIMARY KEY,
    jobId TEXT NOT NULL,
    userId TEXT NOT NULL,
    resumeText TEXT,
    matchScore INTEGER CHECK(matchScore >= 0 AND matchScore <= 100),
    status TEXT CHECK(status IN ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED')) DEFAULT 'PENDING',
    appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jobId) REFERENCES Job(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(jobId, userId)
);

CREATE INDEX IF NOT EXISTS idx_application_job ON JobApplication(jobId);
CREATE INDEX IF NOT EXISTS idx_application_user ON JobApplication(userId);
CREATE INDEX IF NOT EXISTS idx_application_status ON JobApplication(status);