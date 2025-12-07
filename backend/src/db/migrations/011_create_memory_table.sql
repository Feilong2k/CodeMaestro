-- Migration 011: Create memory table for persistent storage (context, preferences, reflexes, session history)

CREATE TABLE IF NOT EXISTS memory (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('context', 'preference', 'reflex', 'session')),
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id, session_id, type, key) NULLS NOT DISTINCT
);

-- Index for searching by project_id and type
CREATE INDEX IF NOT EXISTS idx_memory_project_type ON memory(project_id, type);

-- Index for searching by user_id and type
CREATE INDEX IF NOT EXISTS idx_memory_user_type ON memory(user_id, type);

-- Index for searching by session_id
CREATE INDEX IF NOT EXISTS idx_memory_session ON memory(session_id);

-- Index for searching by key (for lookups)
CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(key);

-- Index for full-text search on value (using gin on jsonb)
CREATE INDEX IF NOT EXISTS idx_memory_value_gin ON memory USING gin(value);
