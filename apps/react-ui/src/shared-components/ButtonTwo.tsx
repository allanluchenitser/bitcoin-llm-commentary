import clsx from 'clsx';
import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, className, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx('btn', `btn-${variant}`, className)}
        {...rest}
      >
        {isLoading ? 'Loading…' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
