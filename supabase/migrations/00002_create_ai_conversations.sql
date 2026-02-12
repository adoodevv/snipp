-- AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI messages table
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON ai_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own messages" ON ai_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own messages" ON ai_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own messages" ON ai_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
        )
    );
