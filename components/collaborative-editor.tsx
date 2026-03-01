'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { getYjsProviderForRoom } from '@liveblocks/yjs';
import { MonacoBinding } from 'y-monaco';
import type { Awareness } from 'y-protocols/awareness';
import { LuCopy, LuCheck } from 'react-icons/lu';

type RoomHooks = {
    useRoom: () => ReturnType<ReturnType<typeof import('@liveblocks/react').createRoomContext>['useRoom']>;
    useOthers: () => ReturnType<ReturnType<typeof import('@liveblocks/react').createRoomContext>['useOthers']>;
    useSelf: () => ReturnType<ReturnType<typeof import('@liveblocks/react').createRoomContext>['useSelf']>;
    useStatus: () => ReturnType<ReturnType<typeof import('@liveblocks/react').createRoomContext>['useStatus']>;
};

interface CollaborativeEditorProps {
    snippetId: string;
    initialCode: string;
    language: string;
    userName: string;
    isPublic: boolean;
    readOnly?: boolean;
    collabToken?: string;
    roomHooks: RoomHooks;
}

type CollaboratorUser = { connectionId: number; info?: { name?: string; color?: string } };

function pickColor(key: string): string {
    const COLLAB_COLORS = [
        '#ef4444', '#f97316', '#eab308', '#22c55e',
        '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
    ];
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

export function CollaborativeEditor({
    snippetId,
    initialCode,
    language,
    userName,
    isPublic,
    readOnly = false,
    collabToken,
    roomHooks,
}: CollaborativeEditorProps) {
    const { useRoom, useOthers, useSelf, useStatus } = roomHooks;
    const room = useRoom();
    const others = useOthers() as CollaboratorUser[];
    const self = useSelf() as CollaboratorUser | null;
    const status = useStatus();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [copied, setCopied] = useState(false);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const providerRef = useRef<ReturnType<typeof getYjsProviderForRoom> | null>(null);
    const awarenessCleanupRef = useRef<(() => void) | null>(null);
    const lastAwarenessUserRef = useRef<string | null>(null);
    const [awarenessUsers, setAwarenessUsers] = useState<Map<number, { user?: { name?: string; color?: string } }>>(new Map());

    const isConnected = status === 'connected';
    const connectionFailed = status === 'reconnecting';

    const collaborators = [
        ...others.map((o) => ({
            id: o.connectionId.toString(),
            name: o.info?.name ?? 'Anonymous',
            color: o.info?.color ?? pickColor(o.connectionId.toString()),
        })),
        ...(self ? [{
            id: self.connectionId.toString(),
            name: self.info?.name ?? userName,
            color: self.info?.color ?? pickColor(self.connectionId.toString()),
        }] : []),
    ];

    const handleEditorMount: OnMount = useCallback((editor) => {
        editorRef.current = editor;
        if (!room) return;

        const provider = getYjsProviderForRoom(room);
        providerRef.current = provider;
        const yDoc = provider.getYDoc();
        const yText = yDoc.getText('monaco');
        const model = editor.getModel();
        if (!model) return;

        const initAndBind = () => {
            if (yText.length === 0 && initialCode) {
                yText.insert(0, initialCode);
            }
            const binding = new MonacoBinding(
                yText,
                model,
                new Set([editor]),
                provider.awareness as unknown as Awareness
            );
            bindingRef.current = binding;
        };

        const onSync = (isSynced: boolean) => {
            if (isSynced) {
                provider.off('sync', onSync);
                initAndBind();
            }
        };

        if (provider.synced) {
            initAndBind();
        } else {
            provider.on('sync', onSync);
        }

        const updateUsers = () => setAwarenessUsers(new Map(provider.awareness.getStates()) as Map<number, { user?: { name?: string; color?: string } }>);
        updateUsers();
        provider.awareness.on('change', updateUsers);
        awarenessCleanupRef.current = () => {
            provider.off('sync', onSync);
            provider.awareness.off('change', updateUsers);
        };

        editor.onDidChangeModelContent(() => {
            setHasUnsavedChanges(true);
        });
    }, [room, initialCode]);

    useEffect(() => {
        const provider = providerRef.current;
        if (!provider || !self?.info) return;
        const userInfo = self.info;
        const name = userInfo.name ?? userName;
        const color = userInfo.color ?? pickColor(self.connectionId.toString());
        const key = `${name}|${color}`;
        if (lastAwarenessUserRef.current === key) return;
        lastAwarenessUserRef.current = key;
        provider.awareness.setLocalStateField('user', { name, color });
    }, [self, userName]);


    const cursorStyles = useMemo(() => {
        let css = '';
        awarenessUsers.forEach((state, clientId) => {
            const user = state?.user;
            if (user?.color) {
                css += `
                    .yRemoteSelection-${clientId},
                    .yRemoteSelectionHead-${clientId} {
                        --user-color: ${user.color};
                    }
                    .yRemoteSelectionHead-${clientId}::after {
                        content: "${(user.name ?? 'Anonymous').replace(/"/g, '\\"')}";
                    }
                `;
            }
        });
        return css;
    }, [awarenessUsers]);

    useEffect(() => {
        return () => {
            awarenessCleanupRef.current?.();
            awarenessCleanupRef.current = null;
            bindingRef.current?.destroy();
            bindingRef.current = null;
            providerRef.current = null;
        };
    }, []);

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

            <style dangerouslySetInnerHTML={{ __html: `
                .yRemoteSelection {
                    opacity: 0.5;
                    background-color: var(--user-color);
                    margin-right: -1px;
                }
                .yRemoteSelectionHead {
                    position: absolute;
                    box-sizing: border-box;
                    height: 100%;
                    border-left: 2px solid var(--user-color);
                }
                .yRemoteSelectionHead::after {
                    position: absolute;
                    top: -1.4em;
                    left: -2px;
                    padding: 2px 6px;
                    background: var(--user-color);
                    color: #fff;
                    border: 0;
                    border-radius: 6px;
                    border-bottom-left-radius: 0;
                    line-height: normal;
                    white-space: nowrap;
                    font-size: 14px;
                    font-style: normal;
                    font-weight: 600;
                    pointer-events: none;
                    user-select: none;
                    z-index: 1000;
                }
                ${cursorStyles}
            `}} />
        </div>
    );
}
