'use client';

import { useState } from 'react';
import { HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    snippetId: string;
    snippetTitle: string;
    onDeleted: () => void;
}

export function DeleteModal({
    isOpen,
    onClose,
    snippetId,
    snippetTitle,
    onDeleted
}: DeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isDeleting) {
            onClose();
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/snippet/${snippetId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            onClose();
            onDeleted();
        } catch (err) {
            console.error(err);
            alert('Failed to delete snippet');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <HiOutlineTrash className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Delete Snippet</h2>
                            <p className="text-sm text-gray-500">This cannot be undone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <HiOutlineX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{snippetTitle}&quot;</span>? All versions will be permanently removed.
                    </p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
