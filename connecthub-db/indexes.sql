-- ============================================================================
-- ConnectHub High-Performance Database Indexes (PostgreSQL)
-- Optimized for high-throughput query filtering, chat retrieval, and audit ledgers
-- ============================================================================

-- 1. Tasks Table Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status 
    ON tasks(status);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user 
    ON tasks(assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_priority 
    ON tasks(priority);

CREATE INDEX IF NOT EXISTS idx_tasks_project 
    ON tasks(project);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at 
    ON tasks(created_at DESC);


-- 2. Chat Messages Table Indexes (Composite & Foreign Key Indexes)
CREATE INDEX IF NOT EXISTS idx_chat_recipient 
    ON chat_messages(recipient);

CREATE INDEX IF NOT EXISTS idx_chat_recipient_timestamp 
    ON chat_messages(recipient, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_sender_recipient 
    ON chat_messages(sender, recipient);

CREATE INDEX IF NOT EXISTS idx_chat_parent_id 
    ON chat_messages(parent_message_id);

CREATE INDEX IF NOT EXISTS idx_chat_id_desc 
    ON chat_messages(id DESC);


-- 3. Audit Logs Table Indexes
CREATE INDEX IF NOT EXISTS idx_audit_created_at 
    ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_entity_type 
    ON audit_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_audit_action_type 
    ON audit_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_audit_actor 
    ON audit_logs(actor);


-- 4. Message Reactions Index
CREATE INDEX IF NOT EXISTS idx_reactions_message_id 
    ON message_reactions(message_id);
