'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { LuUpload, LuX, LuFileCode } from 'react-icons/lu';

const POPULAR_TAGS = [
    'react', 'javascript', 'typescript', 'python', 'hooks', 'utils',
    'api', 'css', 'node', 'nextjs', 'sql', 'regex', 'async', 'testing'
];

interface SnippetFolder {
    id: string;
    name: string;
}

interface NewSnippetFormProps {
    folders: SnippetFolder[];
    submitAction: (formData: FormData) => Promise<void>;
    error?: string;
    created?: string;
}

export function NewSnippetForm({ folders, submitAction, error, created }: NewSnippetFormProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [code, setCode] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadFileName, setUploadFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        const tag = customTagInput.trim().toLowerCase();
        if (tag && !selectedTags.includes(tag)) {
            setSelectedTags(prev => [...prev, tag]);
            setCustomTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setSelectedTags(prev => prev.filter(t => t !== tag));
    };

    const handleFile = (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                setCode(text);
                setUploadFileName(file.name);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith('text/') || /\.(js|ts|tsx|jsx|py|rb|go|rs|java|cpp|c|php|css|scss|html|json|yaml|yml|md|sql|sh|bash|txt)$/i.test(file.name))) {
            handleFile(file);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    return (
        <div className="app-card">
            {error && (
                <div className="mb-4 sm:mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {created && (
                <div className="mb-4 sm:mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    Snippet created successfully! Redirecting...
                </div>
            )}

            <form action={submitAction} className="space-y-4 sm:space-y-6">
                <div>
                    <label htmlFor="title" className="app-input-label">
                        Title
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        placeholder="My awesome snippet"
                        className="app-input"
                    />
                </div>

                {/* Tags with popular badges */}
                <div>
                    <label htmlFor="tags" className="app-input-label">
                        Tags
                    </label>
                    <input
                        id="tags"
                        name="tags"
                        type="hidden"
                        value={selectedTags.join(', ')}
                    />
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                                    aria-label={`Remove ${tag}`}
                                >
                                    <LuX className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {POPULAR_TAGS.filter(t => !selectedTags.includes(t)).map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                            placeholder="Add custom tag..."
                            className="app-input flex-1"
                        />
                        <button
                            type="button"
                            onClick={addCustomTag}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Folder inputs side by side */}
                <div>
                    <label htmlFor="folderId" className="app-input-label">
                        Folder
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select id="folderId" name="folderId" className="app-input">
                            <option value="">No folder</option>
                            {folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                        <input
                            id="newFolderName"
                            name="newFolderName"
                            type="text"
                            placeholder="Or create new folder"
                            className="app-input"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="language" className="app-input-label">
                        Language
                    </label>
                    <select
                        id="language"
                        name="language"
                        className="app-input"
                        defaultValue="javascript"
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

                {/* Code with upload */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="code" className="app-input-label mb-0">
                            Code
                        </label>
                        <div className="flex items-center gap-2">
                            {uploadFileName && (
                                <span className="text-xs text-gray-500 truncate max-w-[120px]" title={uploadFileName}>
                                    From: {uploadFileName}
                                </span>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".js,.ts,.tsx,.jsx,.py,.rb,.go,.rs,.java,.cpp,.c,.php,.css,.scss,.html,.json,.yaml,.yml,.md,.sql,.sh,.bash,.txt"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                            >
                                <LuUpload className="w-3.5 h-3.5" />
                                Upload file
                            </button>
                        </div>
                    </div>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`relative rounded-lg border-2 border-dashed transition-colors ${
                            isDragging
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        <textarea
                            id="code"
                            name="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            rows={12}
                            required
                            placeholder="// Your code here... or drag & drop a file"
                            className="app-input font-mono text-sm sm:text-base resize-y min-h-[200px] sm:min-h-[300px] border-0 focus:ring-0 rounded-lg"
                        />
                        <div
                            className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none rounded-lg transition-opacity ${
                                isDragging ? 'opacity-100 bg-orange-50/90' : 'opacity-0'
                            }`}
                        >
                            <LuFileCode className="w-12 h-12 text-orange-500 mb-2" />
                            <span className="text-sm font-medium text-orange-700">Drop file to upload</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <input
                        type="checkbox"
                        id="isPublic"
                        name="isPublic"
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 focus:ring-2 cursor-pointer"
                    />
                    <label
                        htmlFor="isPublic"
                        className="text-sm sm:text-base text-slate-700 cursor-pointer"
                    >
                        Make public (shareable link)
                    </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                    <button type="submit" className="app-button-primary">
                        Save Snippet
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center w-full sm:w-auto rounded-full border border-slate-300 bg-white text-slate-700 font-semibold tracking-tight px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base hover:bg-slate-50 transition-colors duration-300"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
