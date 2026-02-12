'use client';

import { useState } from 'react';
import { LuX } from 'react-icons/lu';
import { updateSnippetAction } from '@/app/actions/snippetActions';
import { useRouter } from 'next/navigation';

interface EditSnippetModalProps {
    isOpen: boolean;
    onClose: () => void;
    snippet: {
        id: string;
        title: string;
        language: string | null;
        is_public: number;
    };
    latestCode: string;
}

export function EditSnippetModal({ isOpen, onClose, snippet, latestCode }: EditSnippetModalProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await updateSnippetAction(formData);

        if (result.success) {
            onClose();
            router.refresh();
        } else {
            setError(result.error || 'Failed to update snippet');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-6 z-10">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Edit Snippet</h2>
                        <p className="text-sm text-gray-500">Changes will create a new version</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <LuX className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
                    <input type="hidden" name="snippetId" value={snippet.id} />

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className="app-input-label">
                            Title
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            required
                            defaultValue={snippet.title}
                            placeholder="My awesome snippet"
                            className="app-input"
                        />
                    </div>

                    <div>
                        <label htmlFor="language" className="app-input-label">
                            Language
                        </label>
                        <select
                            id="language"
                            name="language"
                            className="app-input"
                            defaultValue={snippet.language || 'javascript'}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="rust">Rust</option>
                            <option value="go">Go</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                            <option value="csharp">C#</option>
                            <option value="php">PHP</option>
                            <option value="ruby">Ruby</option>
                            <option value="swift">Swift</option>
                            <option value="kotlin">Kotlin</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="scss">SCSS</option>
                            <option value="json">JSON</option>
                            <option value="yaml">YAML</option>
                            <option value="markdown">Markdown</option>
                            <option value="sql">SQL</option>
                            <option value="bash">Bash</option>
                            <option value="shell">Shell</option>
                            <option value="dockerfile">Dockerfile</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="code" className="app-input-label">
                            Code
                        </label>
                        <textarea
                            id="code"
                            name="code"
                            rows={10}
                            required
                            defaultValue={latestCode}
                            placeholder="// Your code here..."
                            className="app-input font-mono text-sm resize-y min-h-[200px]"
                        />
                    </div>

                    <div>
                        <label htmlFor="changeDescription" className="app-input-label">
                            Change Description (Optional)
                        </label>
                        <input
                            id="changeDescription"
                            name="changeDescription"
                            type="text"
                            placeholder="What changed in this version?"
                            className="app-input"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Describe what you changed in this version
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isPublic"
                            name="isPublic"
                            defaultChecked={snippet.is_public === 1}
                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 focus:ring-2 cursor-pointer"
                        />
                        <label
                            htmlFor="isPublic"
                            className="text-sm text-gray-700 cursor-pointer"
                        >
                            Make public (shareable link)
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="app-button-primary"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center w-full sm:w-auto rounded-full border border-gray-300 bg-white text-gray-700 font-semibold tracking-tight px-5 py-3 text-sm hover:bg-gray-50 transition-colors duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
