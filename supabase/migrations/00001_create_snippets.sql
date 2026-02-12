-- Snippets table
CREATE TABLE IF NOT EXISTS snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    language TEXT,
    is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
    collab_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snippet versions table
CREATE TABLE IF NOT EXISTS snippet_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    code TEXT NOT NULL,
    change_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_updated_at ON snippets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippet_versions_snippet_id ON snippet_versions(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_versions_version ON snippet_versions(snippet_id, version DESC);

-- RLS policies
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_versions ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own snippets
CREATE POLICY "Users can view own snippets" ON snippets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public snippets" ON snippets
    FOR SELECT USING (is_public = 1);

CREATE POLICY "Users can insert own snippets" ON snippets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snippets" ON snippets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snippets" ON snippets
    FOR DELETE USING (auth.uid() = user_id);

-- Snippet versions: users can read versions of snippets they can read
CREATE POLICY "Users can view snippet versions" ON snippet_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM snippets s
            WHERE s.id = snippet_versions.snippet_id
            AND (s.user_id = auth.uid() OR s.is_public = 1)
        )
    );

CREATE POLICY "Users can insert snippet versions" ON snippet_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM snippets s
            WHERE s.id = snippet_versions.snippet_id
            AND s.user_id = auth.uid()
        )
    );
