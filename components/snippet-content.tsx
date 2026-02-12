'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CgChevronLeft } from 'react-icons/cg';
import { HiOutlineShare } from 'react-icons/hi';
import { LuTrash2 } from 'react-icons/lu';
import { EditSnippetModal } from '@/components/edit-snippet-modal';
import { SnippetHelpBar } from '@/components/snippet-help-bar';
import { CollaborativeEditor } from '@/components/collaborative-editor';
import { ShareModal } from '@/components/share-modal';
import { DeleteModal } from '@/components/delete-modal';

interface SnippetVersion {
    id: string;
    version: number;
    code: string;
    change_description: string | null;
    created_at: string;
}

interface SnippetData {
    id: string;
    title: string;
    language: string | null;
    is_public: number;
    collab_token: string | null;
    created_at: string;
    updated_at: string;
    versions: SnippetVersion[];
}

interface SnippetContentProps {
    snippet: SnippetData;
    isOwner: boolean;
    hasEditAccess: boolean;
    collabToken: string;
    userName?: string;
}

export function SnippetContent({
    snippet,
    isOwner,
    hasEditAccess,
    collabToken,
    userName = 'Anonymous'
}: SnippetContentProps) {
    const router = useRouter();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentToken, setCurrentToken] = useState(collabToken);
    const latestVersion = snippet.versions[0];
    const isPublic = snippet.is_public === 1;

    const handleTokenRegenerated = (newToken: string) => {
        setCurrentToken(newToken);
    };

    const handleDeleted = () => {
        router.push('/');
        router.refresh();
    };

    return (
        <>
            <div className="w-full pb-36 lg:pb-24">
                {/* Mobile Header - replaced by sidebar on desktop */}
                <header className="lg:hidden mb-6 flex justify-between items-center pb-4 border-b border-gray-200">
                    <Link
                        href="/"
                        className="text-sm sm:text-base transition-colors flex items-center"
                        style={{ color: '#666666' }}
                    >
                        <CgChevronLeft className="w-4 h-4 mr-2" />
                        Back to Snippets
                    </Link>
                </header>

                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-2">
                                {snippet.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                {snippet.language && (
                                    <span className="px-3 py-1 text-sm font-medium bg-gray-200 rounded-full" style={{ color: '#2c2c2c' }}>
                                        {snippet.language}
                                    </span>
                                )}
                                {isPublic && (
                                    <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Collaborative
                                    </span>
                                )}
                                {isPublic && !hasEditAccess && !isOwner && (
                                    <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                        View Only
                                    </span>
                                )}
                                <span className="text-sm" style={{ color: '#777777' }}>
                                    Version {latestVersion.version}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {isPublic && isOwner && (
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto justify-center"
                                >
                                    <HiOutlineShare className="w-4 h-4" />
                                    Share
                                </button>
                            )}
                            {isOwner && !isPublic && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="app-button-primary w-full sm:w-auto"
                                >
                                    Edit Snippet
                                </button>
                            )}
                            {isOwner && (
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-full transition-colors w-full sm:w-auto justify-center"
                                    title="Delete snippet"
                                >
                                    <LuTrash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="text-xs sm:text-sm" style={{ color: '#777777' }}>
                        Created {new Date(snippet.created_at).toLocaleString()} •
                        {' '}Last updated {new Date(snippet.updated_at).toLocaleString()}
                    </div>
                </div>

                <div className="app-card">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-semibold">
                            Code
                        </h2>
                        {snippet.versions.length > 1 && (
                            <details className="relative">
                                <summary className="text-sm cursor-pointer" style={{ color: '#666666' }}>
                                    View History ({snippet.versions.length} versions)
                                </summary>
                                <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 max-h-96 overflow-y-auto">
                                    <div className="space-y-2">
                                        {snippet.versions.map((version) => (
                                            <div
                                                key={version.id}
                                                className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">
                                                        Version {version.version}
                                                    </span>
                                                    <span className="text-xs" style={{ color: '#777777' }}>
                                                        {new Date(version.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                {version.change_description && (
                                                    <p className="text-xs mb-2" style={{ color: '#666666' }}>
                                                        {version.change_description}
                                                    </p>
                                                )}
                                                <pre className="text-xs font-mono line-clamp-3" style={{ color: '#666666' }}>
                                                    {version.code}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </details>
                        )}
                    </div>

                    {/* Use collaborative editor for public snippets */}
                    {isPublic ? (
                        <CollaborativeEditor
                            snippetId={snippet.id}
                            initialCode={latestVersion.code}
                            language={snippet.language || 'javascript'}
                            userName={userName}
                            isPublic={true}
                            readOnly={!hasEditAccess && !isOwner}
                            collabToken={currentToken}
                        />
                    ) : (
                        <pre className="font-mono text-sm sm:text-base bg-gray-900 text-white p-4 sm:p-6 rounded-lg overflow-x-auto">
                            <code>{latestVersion.code}</code>
                        </pre>
                    )}
                </div>

                {/* Fixed AI Help Bar */}
                <SnippetHelpBar
                    snippetTitle={snippet.title}
                    snippetCode={latestVersion.code}
                    snippetLanguage={snippet.language}
                />
            </div>

            {/* Share Modal - for public snippets (owner only) */}
            {isOwner && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    snippetId={snippet.id}
                    snippetTitle={snippet.title}
                    collabToken={currentToken}
                    isOwner={isOwner}
                    onTokenRegenerated={handleTokenRegenerated}
                />
            )}

            {/* Delete Modal - owner only */}
            {isOwner && (
                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    snippetId={snippet.id}
                    snippetTitle={snippet.title}
                    onDeleted={handleDeleted}
                />
            )}

            {/* Edit Modal - for private snippets */}
            {!isPublic && (
                <EditSnippetModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    snippet={{
                        id: snippet.id,
                        title: snippet.title,
                        language: snippet.language,
                        is_public: snippet.is_public,
                    }}
                    latestCode={latestVersion.code}
                />
            )}
        </>
    );
}
