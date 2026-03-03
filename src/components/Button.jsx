import { Link } from 'react-router-dom';

const variantStyles = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md',
  secondary:
    'bg-white text-primary border-2 border-primary hover:bg-primary-light',
  ghost:
    'bg-transparent text-primary hover:bg-primary-light',
  danger:
    'bg-danger text-white hover:bg-red-600 shadow-sm hover:shadow-md',
  white:
    'bg-white text-text-primary hover:bg-gray-100 shadow-sm',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  href,
  className = '',
  disabled = false,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  const content = (
    <>
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </>
  );

  if (href) {
    return (
      <Link to={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {content}
    </button>
  );
}
