-- ============================================================================
-- ConnectHub Database Schema Initialization (PostgreSQL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    department VARCHAR(100),
    phone VARCHAR(30),
    gender VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    due_date VARCHAR(50),
    story_points INTEGER DEFAULT 1,
    labels VARCHAR(255),
    subtasks TEXT,
    comments TEXT,
    project VARCHAR(100) DEFAULT 'ConnectHub Core',
    linked_channel VARCHAR(100),
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    disabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS chat_group_members (
    group_id BIGINT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    sender VARCHAR(100) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'CHAT',
    timestamp VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    file_url VARCHAR(500),
    file_type VARCHAR(100),
    file_name VARCHAR(255),
    attachment_id VARCHAR(100),
    parent_message_id BIGINT
);

CREATE TABLE IF NOT EXISTS message_reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL,
    username VARCHAR(100) NOT NULL,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action_log TEXT NOT NULL,
    actor VARCHAR(100),
    action_type VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    previous_value TEXT,
    new_value TEXT,
    timestamp VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
