-- Snippet folders table (create first for FK)
CREATE TABLE IF NOT EXISTS snippet_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snippet_folders_user_id ON snippet_folders(user_id);

ALTER TABLE snippet_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own folders" ON snippet_folders
    FOR ALL USING (auth.uid() = user_id);

-- Add tags and folder to snippets
ALTER TABLE snippets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE snippets ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES snippet_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_snippets_folder_id ON snippets(folder_id);
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON snippets USING GIN(tags);
