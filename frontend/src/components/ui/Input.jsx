// src/components/ui/Input.jsx
import { forwardRef } from 'react';

/**
 * Reusable Input component with consistent styling and states
 * @param {Object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.size - Input size: 'sm', 'md', 'lg'
 * @param {boolean} props.error - Error state
 * @param {string} props.errorMessage - Error message
 * @param {React.ReactNode} props.leftIcon - Left icon
 * @param {React.ReactNode} props.rightIcon - Right icon
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Other props
 */
const Input = forwardRef(({ 
  type = 'text',
  size = 'md', 
  error = false, 
  errorMessage = '', 
  leftIcon, 
  rightIcon, 
  className = '', 
  ...rest 
}, ref) => {
  // Base input classes
  const baseClasses = 'w-full border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  
  // State styles
  const stateClasses = error 
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
    : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500';
  
  // Icon padding adjustments
  const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
  
  const inputClasses = `${baseClasses} ${sizes[size]} ${stateClasses} ${iconPadding} ${className}`;
  
  return (
    <div className="relative">
      {/* Left Icon */}
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="h-5 w-5 text-secondary-400">
            {leftIcon}
          </div>
        </div>
      )}
      
      {/* Input Field */}
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...rest}
      />
      
      {/* Right Icon */}
      {rightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <div className="h-5 w-5 text-secondary-400">
            {rightIcon}
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1.5 text-xs text-error-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
