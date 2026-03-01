'use client';

import { useState } from 'react';
import { HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

interface DeleteConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationTitle: string;
    onConfirm: () => Promise<void>;
}

export function DeleteConversationModal({
    isOpen,
    onClose,
    conversationTitle,
    onConfirm
}: DeleteConversationModalProps) {
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
            await onConfirm();
            onClose();
        } catch {
            // Caller handles error display
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
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <HiOutlineTrash className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Delete Conversation</h2>
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

                <div className="p-4 sm:p-6">
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{conversationTitle}&quot;</span>?
                    </p>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
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
