'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface Collaborator {
    id: string;
    name: string;
    color: string;
    cursor?: { lineNumber: number; column: number };
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
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [connectionFailed, setConnectionFailed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const decorationsRef = useRef<string[]>([]);
    const pendingUpdateRef = useRef<string | null>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionIdRef = useRef<string>('');
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 15; // Increased from 10
    const cursorToRestoreRef = useRef<{ lineNumber: number; column: number } | null>(null);
    const pendingInitContentRef = useRef<string | null>(null);
    const isApplyingRemoteRef = useRef(false);
    const lastCollaboratorsRef = useRef<Collaborator[]>([]); // Store last known collaborators
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const updateCollaboratorCursor = useCallback((
        userId: string,
        cursor: { lineNumber: number; column: number },
        name: string,
        color: string
    ) => {
        setCollaborators(prev => prev.map(c =>
            c.id === userId ? { ...c, cursor, name, color } : c
        ));

        // Update cursor decorations in editor
        if (editorRef.current) {
            updateCursorDecorations();
        }
    }, [updateCursorDecorations]);

    const applyContentToEditor = useCallback((content: string) => {
        const model = editorRef.current?.getModel();
        if (!model || model.getValue() === content) return;
        const pos = editorRef.current?.getPosition();
        if (pos) cursorToRestoreRef.current = { lineNumber: pos.lineNumber, column: pos.column };
        isApplyingRemoteRef.current = true;
        try {
            model.setValue(content);
            if (editorRef.current && cursorToRestoreRef.current) {
                const { lineNumber, column } = cursorToRestoreRef.current;
                const lineCount = model.getLineCount();
                const line = Math.min(lineNumber, lineCount);
                const lineContent = model.getLineContent(line);
                const columnClamped = Math.min(column, lineContent.length + 1);
                editorRef.current.setPosition({ lineNumber: line, column: columnClamped });
                editorRef.current.revealPosition({ lineNumber: line, column: columnClamped });
                cursorToRestoreRef.current = null;
            }
        } finally {
            isApplyingRemoteRef.current = false;
        }
    }, []);

    const handleMessage = useCallback((data: { type: string;[key: string]: unknown }) => {
        switch (data.type) {
            case 'init':
                sessionIdRef.current = data.sessionId as string;
                const initContent = data.content as string | undefined;
                if (initContent != null) {
                    if (editorRef.current?.getModel()) {
                        isApplyingRemoteRef.current = true;
                        try {
                            editorRef.current.getModel()!.setValue(initContent);
                        } finally {
                            isApplyingRemoteRef.current = false;
                        }
                    } else {
                        pendingInitContentRef.current = initContent;
                    }
                }
                setCollaborators(data.users as Collaborator[]);
                lastCollaboratorsRef.current = data.users as Collaborator[];
                break;

            case 'update':
                if (data.userId !== sessionIdRef.current && typeof data.content === 'string') {
                    applyContentToEditor(data.content);
                }
                break;

            case 'user-joined':
                setCollaborators(prev => {
                    const newList = [...prev, data.user as Collaborator];
                    lastCollaboratorsRef.current = newList;
                    return newList;
                });
                break;

            case 'user-left':
                setCollaborators(prev => {
                    const newList = prev.filter(c => c.id !== data.userId);
                    lastCollaboratorsRef.current = newList;
                    return newList;
                });
                break;

            case 'cursor':
                updateCollaboratorCursor(
                    data.userId as string,
                    data.cursor as { lineNumber: number; column: number },
                    data.name as string,
                    data.color as string
                );
                break;

            case 'saved':
                setIsSaving(false);
                setSaveError(null);
                break;

            case 'pong':
                break;
        }
    }, [applyContentToEditor, updateCollaboratorCursor]);

    // Connect to collaboration room
    useEffect(() => {
        if (!isPublic) return;

        const connect = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let clientId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('collab-client-id') : null;
            if (!clientId) {
                clientId = crypto.randomUUID();
                try { sessionStorage?.setItem('collab-client-id', clientId); } catch (_) { }
            }
            const wsUrl = `${protocol}//${window.location.host}/api/collaborate/${snippetId}?name=${encodeURIComponent(userName)}&snippetId=${snippetId}&clientId=${encodeURIComponent(clientId)}`;

            try {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                const PING_INTERVAL_MS = 15_000;
                let pingInterval: ReturnType<typeof setInterval> | null = null;

                ws.onopen = () => {
                    setIsConnected(true);
                    setIsReconnecting(false);
                    setConnectionFailed(false);
                    reconnectAttempts.current = 0;
                    pingInterval = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'ping' }));
                        }
                    }, PING_INTERVAL_MS);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        handleMessage(data);
                    } catch (e) {
                        console.error('Failed to parse message:', e);
                    }
                };

                ws.onclose = () => {
                    if (pingInterval) clearInterval(pingInterval);
                    setIsConnected(false);

                    // Don't clear collaborators during reconnection - reduces flickering
                    if (reconnectAttempts.current < maxReconnectAttempts) {
                        setIsReconnecting(true);
                        reconnectAttempts.current++;
                        // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
                        reconnectTimeoutRef.current = setTimeout(connect, delay);
                    } else {
                        setIsReconnecting(false);
                        setConnectionFailed(true);
                        // Only clear collaborators after all reconnection attempts fail
                        setCollaborators([]);
                        lastCollaboratorsRef.current = [];
                    }
                };

                ws.onerror = () => {
                    // Don't immediately fail - let onclose handle reconnection
                    console.error('WebSocket error occurred');
                };
            } catch (error) {
                console.error('WebSocket connection error:', error);
                setConnectionFailed(true);
            }
        };

        connect();

        // Visibility-based reconnection: reconnect when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const ws = wsRef.current;
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    // Reset reconnection attempts and try to connect
                    reconnectAttempts.current = 0;
                    setConnectionFailed(false);
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }
                    connect();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [snippetId, userName, isPublic, handleMessage]);

    // Update decorations when collaborators change
    useEffect(() => {
        updateCursorDecorations();
    }, [collaborators, updateCursorDecorations]);

    const DEBOUNCE_MS = 150;

    const handleEditorMount: OnMount = (editor) => {
        editorRef.current = editor;

        // Apply pending init content if we connected before editor mounted
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

        // Send cursor position on cursor change
        editor.onDidChangeCursorPosition((e) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'cursor',
                    cursor: {
                        lineNumber: e.position.lineNumber,
                        column: e.position.column
                    }
                }));
            }
        });

        // Uncontrolled: send content to server on change (debounced), skip when applying remote
        editor.onDidChangeModelContent(() => {
            if (isApplyingRemoteRef.current) return;
            const value = editor.getModel()?.getValue() ?? '';
            pendingUpdateRef.current = value;
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = setTimeout(() => {
                updateTimeoutRef.current = null;
                const toSend = pendingUpdateRef.current;
                pendingUpdateRef.current = null;
                if (toSend !== null && wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'update', content: toSend }));
                }
            }, DEBOUNCE_MS);
        });
    };

    // Save handler that works both online and offline
    const handleSave = async () => {
        if (isSaving) return;

        setIsSaving(true);
        setSaveError(null);

        // Try WebSocket save first if connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'save' }));
            // The 'saved' message handler will set isSaving to false
        } else {
            // Offline save via HTTP API
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

                setIsSaving(false);
            } catch (error) {
                console.error('Error saving offline:', error);
                setSaveError(error instanceof Error ? error.message : 'Failed to save');
                setIsSaving(false);
            }
        }
    };

    // Map language to Monaco language ID
    const getMonacoLanguage = (lang: string): string => {
        const languageMap: Record<string, string> = {
            'javascript': 'javascript',
            'typescript': 'typescript',
            'python': 'python',
            'rust': 'rust',
            'go': 'go',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'csharp': 'csharp',
            'php': 'php',
            'ruby': 'ruby',
            'swift': 'swift',
            'kotlin': 'kotlin',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'yaml': 'yaml',
            'markdown': 'markdown',
            'sql': 'sql',
            'bash': 'shell',
            'shell': 'shell',
            'dockerfile': 'dockerfile'
        };
        return languageMap[lang] || 'plaintext';
    };

    // Get connection status display
    const getConnectionStatus = () => {
        if (isConnected) {
            return (
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                </span>
            );
        }
        if (isReconnecting) {
            return (
                <span className="flex items-center gap-1.5 text-xs text-yellow-600">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    Reconnecting...
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
            {/* Collaborators bar */}
            {isPublic && (
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        {getConnectionStatus()}

                        {/* Collaborator avatars - only show when connected or reconnecting */}
                        {(isConnected || isReconnecting) && collaborators.length > 0 && (
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

                        {(isConnected || isReconnecting) && collaborators.length > 1 && (
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
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-full transition-colors"
                            >
                                {isSaving ? 'Saving...' : isConnected ? 'Save' : 'Save Offline'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Monaco Editor */}
            <div className="rounded-lg overflow-hidden border border-gray-200">
                <Editor
                    key={snippetId}
                    height="400px"
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

            {/* Collaborator cursor styles */}
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
