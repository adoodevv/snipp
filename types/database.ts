export interface SnippetVersion {
    id: string;
    snippet_id: string;
    version: number;
    code: string;
    change_description: string | null;
    created_at: string;
}

export interface Snippet {
    id: string;
    user_id: string;
    title: string;
    language: string | null;
    is_public: number;
    collab_token: string | null;
    created_at: string;
    updated_at: string;
}

export interface SnippetWithLatestVersion extends Snippet {
    latest_code: string;
    latest_version: number;
}

export interface SnippetWithVersions extends Snippet {
    versions: SnippetVersion[];
}

export interface AiMessage {
    id: string;
    conversation_id: string;
    role: 'user' | 'model';
    content: string;
    created_at: string;
}

export interface AiConversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface AiConversationWithMessages extends AiConversation {
    messages: AiMessage[];
}
