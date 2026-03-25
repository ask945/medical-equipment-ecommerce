import React from 'react';
import { motion } from 'framer-motion';

/**
 * Enhanced Input Component
 */
const Input = ({
    label,
    error,
    helpText,
    icon,
    iconPosition = 'left',
    required = false,
    className = '',
    type,
    onInput,
    onWheel,
    ...props
}) => {
    const hasError = !!error;

    const baseInputClasses = 'w-full px-4 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2';
    const normalClasses = 'border-border focus:border-primary focus:ring-primary/20';
    const errorClasses = 'border-danger focus:border-danger focus:ring-danger/20';
    const iconPaddingLeft = icon && iconPosition === 'left' ? 'pl-10' : '';
    const iconPaddingRight = icon && iconPosition === 'right' ? 'pr-10' : '';

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className="block text-sm font-semibold text-text-primary mb-2">
                    {label}
                    {required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {icon && iconPosition === 'left' && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                        {icon}
                    </div>
                )}

                <motion.input
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.1 }}
                    className={`
            ${baseInputClasses}
            ${hasError ? errorClasses : normalClasses}
            ${iconPaddingLeft}
            ${iconPaddingRight}
            text-text-primary
            bg-white
          `}
                    type={type}
                    onInput={(e) => {
                        if (type === 'number' && e.target.value !== '' && e.target.value !== '-') {
                            e.target.value = e.target.value.replace(/^0+(?=\d)/, '');
                        }
                        onInput?.(e);
                    }}
                    onWheel={(e) => {
                        if (type === 'number') {
                            e.currentTarget.blur();
                        }
                        onWheel?.(e);
                    }}
                    {...props}
                />

                {icon && iconPosition === 'right' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                        {icon}
                    </div>
                )}
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-danger text-sm mt-1"
                >
                    {error}
                </motion.p>
            )}

            {helpText && !error && (
                <p className="text-text-secondary text-sm mt-1">{helpText}</p>
            )}
        </div>
    );
};

export default Input;
