import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Button Component
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    onClick,
    type = 'button',
    className = ''
}) => {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
        primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary shadow-lg hover:shadow-xl',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-lg hover:shadow-xl',
        success: 'bg-success hover:bg-green-700 text-white focus:ring-success shadow-lg hover:shadow-xl',
        danger: 'bg-danger hover:bg-red-700 text-white focus:ring-danger shadow-lg hover:shadow-xl',
        warning: 'bg-warning hover:bg-yellow-600 text-white focus:ring-warning shadow-lg hover:shadow-xl',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-2 border-gray-300 focus:ring-gray-500',
        outline: 'bg-transparent hover:bg-primary-light text-primary border-2 border-primary focus:ring-primary'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const disabledClasses = 'opacity-50 cursor-not-allowed';
    const loadingClasses = 'cursor-wait';

    const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? disabledClasses : ''}
    ${loading ? loadingClasses : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

    return (
        <motion.button
            whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            transition={{ duration: 0.1 }}
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {!loading && icon && iconPosition === 'left' && icon}
            {children}
            {!loading && icon && iconPosition === 'right' && icon}
        </motion.button>
    );
};

export default Button;
