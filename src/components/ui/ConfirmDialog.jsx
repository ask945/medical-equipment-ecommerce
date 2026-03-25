import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * In-app confirmation dialog to replace window.confirm()
 * Usage:
 *   <ConfirmDialog
 *     isOpen={showConfirm}
 *     onClose={() => setShowConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="Delete Item"
 *     message="Are you sure? This cannot be undone."
 *     variant="danger"        // "danger" | "warning" | "info"
 *     confirmText="Delete"
 *     cancelText="Cancel"
 *   />
 */
const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    variant = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
}) => {
    const variantStyles = {
        danger: {
            icon: <Trash2 className="w-6 h-6 text-red-500" />,
            bg: 'bg-red-50',
            ring: 'ring-red-100',
            btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
            bg: 'bg-amber-50',
            ring: 'ring-amber-100',
            btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        },
        info: {
            icon: <AlertTriangle className="w-6 h-6 text-blue-500" />,
            bg: 'bg-blue-50',
            ring: 'ring-blue-100',
            btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        },
    };

    const v = variantStyles[variant] || variantStyles.danger;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${v.bg} ring-1 ${v.ring} flex items-center justify-center shrink-0`}>
                                        {v.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-slate-900">{title}</h3>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
                                    </div>
                                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer">
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 pb-5 flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => { onConfirm(); onClose(); }}
                                    disabled={loading}
                                    className={`px-4 py-2 text-sm font-semibold text-white ${v.btn} rounded-xl transition-colors focus:ring-2 focus:ring-offset-2 cursor-pointer`}
                                >
                                    {loading ? 'Processing...' : confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
