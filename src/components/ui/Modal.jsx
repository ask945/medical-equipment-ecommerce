import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modern Modal Component
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    footer
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} my-8 overflow-hidden`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(title || showCloseButton) && (
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-gray-50 to-white">
                                    {title && (
                                        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
                                    )}
                                    {showCloseButton && (
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={onClose}
                                            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                                        >
                                            <X className="w-5 h-5 text-text-secondary" />
                                        </motion.button>
                                    )}
                                </div>
                            )}

                            <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {children}
                            </div>

                            {footer && (
                                <div className="px-6 py-4 border-t border-border bg-gray-50">
                                    {footer}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
