'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { createClient } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { LuCopy, LuCheck } from 'react-icons/lu';

interface Collaborator {
    id: string;
    name: string;
    color: string;
    cursor?: { lineNumber: number; column: number };
}

const COLLAB_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

function pickColor(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

interface CollaborativeEditorProps {
    snippetId: string;
    initialCode: string;
    language: string;
    userName: string;
    isPublic: boolean;
    readOnly?: boolean;
    collabToken?: string;
}

export function CollaborativeEditor({
    snippetId,
    initialCode,
    language,
    userName,
    isPublic,
    readOnly = false,
    collabToken
}: CollaborativeEditorProps) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionFailed, setConnectionFailed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [copied, setCopied] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const decorationsRef = useRef<string[]>([]);
    const pendingUpdateRef = useRef<string | null>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionIdRef = useRef<string>('');
    const pendingInitContentRef = useRef<string | null>(null);
    const isApplyingRemoteRef = useRef(false);
    const cursorCacheRef = useRef<Map<string, { lineNumber: number; column: number }>>(new Map());

    const updateCursorDecorations = useCallback(() => {
        if (!editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        const decorations: editor.IModelDeltaDecoration[] = collaborators
            .filter(c => c.id !== sessionIdRef.current && c.cursor)
            .map(c => ({
                range: {
                    startLineNumber: c.cursor!.lineNumber,
                    startColumn: c.cursor!.column,
                    endLineNumber: c.cursor!.lineNumber,
                    endColumn: c.cursor!.column + 1
                },
                options: {
                    className: `collaborator-cursor-${c.id}`,
                    beforeContentClassName: 'collaborator-cursor-line',
                    hoverMessage: { value: c.name },
                    stickiness: 1
                }
            }));

        decorationsRef.current = editorRef.current.deltaDecorations(
            decorationsRef.current,
            decorations
        );
    }, [collaborators]);

    const applyContentToEditor = useCallback((content: string) => {
        const model = editorRef.current?.getModel();
        if (!model || model.getValue() === content) return;
        const pos = editorRef.current?.getPosition();
        const cursorToRestore = pos ? { lineNumber: pos.lineNumber, column: pos.column } : null;
        isApplyingRemoteRef.current = true;
        try {
            model.setValue(content);
            if (editorRef.current && cursorToRestore) {
                const { lineNumber, column } = cursorToRestore;
                const lineCount = model.getLineCount();
                const line = Math.min(lineNumber, lineCount);
                const lineContent = model.getLineContent(line);
                const columnClamped = Math.min(column, lineContent.length + 1);
                editorRef.current.setPosition({ lineNumber: line, column: columnClamped });
                editorRef.current.revealPosition({ lineNumber: line, column: columnClamped });
            }
        } finally {
            isApplyingRemoteRef.current = false;
        }
    }, []);

    const buildCollaboratorsFromPresence = useCallback((state: Record<string, Array<{ id: string; name: string; color: string }>>) => {
        const list: Collaborator[] = [];
        for (const key of Object.keys(state)) {
            const payloads = state[key];
            if (payloads?.[0]) {
                const p = payloads[0];
                const cursor = cursorCacheRef.current.get(p.id);
                list.push({
                    id: p.id,
                    name: p.name,
                    color: p.color,
                    cursor
                });
            }
        }
        return list;
    }, []);

    // Single channel for content broadcast + presence (cursors, avatars)
    useEffect(() => {
        if (!isPublic) return;

        const clientId = crypto.randomUUID();
        sessionIdRef.current = clientId;
        const color = pickColor(clientId);

        const supabase = createClient();
        const channelName = `snippet:${snippetId}`;
        const channel = supabase.channel(channelName, {
            config: { broadcast: { self: false } }
        });

        channel
            .on('broadcast', { event: 'update' }, (payload) => {
                const { userId, content } = payload.payload as { userId: string; content: string };
                if (userId !== sessionIdRef.current && typeof content === 'string') {
                    applyContentToEditor(content);
                }
            })
            .on('broadcast', { event: 'cursor' }, (payload) => {
                const { userId, cursor, name, color: c } = payload.payload as {
                    userId: string;
                    cursor: { lineNumber: number; column: number };
                    name: string;
                    color: string;
                };
                if (userId !== sessionIdRef.current && cursor) {
                    cursorCacheRef.current.set(userId, cursor);
                    setCollaborators(prev => {
                        const has = prev.some(x => x.id === userId);
                        if (has) {
                            return prev.map(x =>
                                x.id === userId ? { ...x, cursor, name: name ?? x.name, color: c ?? x.color } : x
                            );
                        }
                        return [...prev, { id: userId, name: name ?? 'Anonymous', color: c ?? '#666', cursor }];
                    });
                }
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState() as Record<string, Array<{ id: string; name: string; color: string }>>;
                setCollaborators(buildCollaboratorsFromPresence(state));
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setConnectionFailed(false);
                    channel.track({ id: clientId, name: userName, color });
                    setCollaborators(prev => {
                        const hasUs = prev.some(c => c.id === clientId);
                        if (hasUs) return prev;
                        return [...prev, { id: clientId, name: userName, color, cursor: undefined }];
                    });
                } else if (status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    setConnectionFailed(true);
                }
            });

        channelRef.current = channel;

        return () => {
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            supabase.removeChannel(channel);
            channelRef.current = null;
            setIsConnected(false);
        };
    }, [snippetId, userName, isPublic, applyContentToEditor, buildCollaboratorsFromPresence]);

    useEffect(() => {
        updateCursorDecorations();
    }, [collaborators, updateCursorDecorations]);

    const DEBOUNCE_MS = 150;

    const handleEditorMount: OnMount = (editor) => {
        editorRef.current = editor;

        const pending = pendingInitContentRef.current;
        if (pending != null) {
            pendingInitContentRef.current = null;
            isApplyingRemoteRef.current = true;
            try {
                editor.getModel()?.setValue(pending);
            } finally {
                isApplyingRemoteRef.current = false;
            }
        }

        editor.onDidChangeCursorPosition((e) => {
            const ch = channelRef.current;
            if (ch?.state === 'joined') {
                ch.send({
                    type: 'broadcast',
                    event: 'cursor',
                    payload: {
                        userId: sessionIdRef.current,
                        cursor: { lineNumber: e.position.lineNumber, column: e.position.column },
                        name: userName,
                        color: pickColor(sessionIdRef.current)
                    }
                });
            }
        });

        editor.onDidChangeModelContent(() => {
            if (isApplyingRemoteRef.current) return;
            setHasUnsavedChanges(true);
            const value = editor.getModel()?.getValue() ?? '';
            pendingUpdateRef.current = value;
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = setTimeout(() => {
                updateTimeoutRef.current = null;
                const toSend = pendingUpdateRef.current;
                pendingUpdateRef.current = null;
                const ch = channelRef.current;
                if (toSend !== null && ch?.state === 'joined') {
                    ch.send({
                        type: 'broadcast',
                        event: 'update',
                        payload: { userId: sessionIdRef.current, content: toSend }
                    });
                }
            }, DEBOUNCE_MS);
        });
    };

    const handleCopy = async () => {
        const code = editorRef.current?.getValue();
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setSaveError(null);

        try {
            const code = editorRef.current?.getValue();
            if (!code) {
                setIsSaving(false);
                return;
            }

            const tokenParam = collabToken ? `?token=${encodeURIComponent(collabToken)}` : '';
            const response = await fetch(`/api/snippet/${snippetId}/save${tokenParam}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                const data = await response.json() as { error?: string };
                throw new Error(data.error || 'Failed to save');
            }
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving:', error);
            setSaveError(error instanceof Error ? error.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const getMonacoLanguage = (lang: string): string => {
        const languageMap: Record<string, string> = {
            'javascript': 'javascript', 'typescript': 'typescript', 'python': 'python',
            'rust': 'rust', 'go': 'go', 'java': 'java', 'cpp': 'cpp', 'c': 'c',
            'csharp': 'csharp', 'php': 'php', 'ruby': 'ruby', 'swift': 'swift',
            'kotlin': 'kotlin', 'html': 'html', 'css': 'css', 'scss': 'scss',
            'json': 'json', 'yaml': 'yaml', 'markdown': 'markdown', 'sql': 'sql',
            'bash': 'shell', 'shell': 'shell', 'dockerfile': 'dockerfile'
        };
        return languageMap[lang] || 'plaintext';
    };

    const getConnectionStatus = () => {
        if (isConnected) {
            return (
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                </span>
            );
        }
        if (connectionFailed) {
            return (
                <span className="flex items-center gap-1.5 text-xs text-orange-500">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Offline Mode
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Connecting...
            </span>
        );
    };

    return (
        <div className="relative">
            {isPublic && (
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        {getConnectionStatus()}
                        {isConnected && collaborators.length > 0 && (
                            <div className="flex items-center -space-x-2 ml-3">
                                {collaborators.map((c) => (
                                    <div
                                        key={c.id}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white shadow-sm"
                                        style={{ backgroundColor: c.color }}
                                        title={c.name}
                                    >
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        )}
                        {isConnected && collaborators.length > 1 && (
                            <span className="text-xs text-gray-500 ml-2">
                                {collaborators.length} editing
                            </span>
                        )}
                    </div>

                    {!readOnly && (
                        <div className="flex items-center gap-2">
                            {saveError && (
                                <span className="text-xs text-red-500">{saveError}</span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !hasUnsavedChanges}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed rounded-full transition-colors"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="rounded-lg overflow-hidden border border-gray-200 relative group">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-700/90 hover:bg-gray-600 text-white text-xs font-medium transition-colors"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <LuCheck className="w-3.5 h-3.5" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <LuCopy className="w-3.5 h-3.5" />
                            Copy
                        </>
                    )}
                </button>
                <Editor
                    key={snippetId}
                    height="min(400px, 60vh)"
                    language={getMonacoLanguage(language)}
                    defaultValue={initialCode}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                        readOnly: readOnly,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        wordWrap: 'on'
                    }}
                />
            </div>

            <style jsx global>{`
                ${collaborators.map(c => `
                    .collaborator-cursor-${c.id} {
                        background-color: ${c.color}40;
                        border-left: 2px solid ${c.color};
                    }
                `).join('\n')}
                .collaborator-cursor-line::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -2px;
                    width: 2px;
                    height: 100%;
                }
            `}</style>
        </div>
    );
}
