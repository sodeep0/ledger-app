// src/components/ui/Modal.jsx
import { useEffect } from 'react';

/**
 * Enhanced Modal component with consistent styling and accessibility
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} props.closable - Whether modal can be closed
 * @param {string} props.className - Additional CSS classes
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  closable = true,
  className = '' 
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closable]);
  
  if (!isOpen) return null;
  
  // Size styles
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closable ? onClose : undefined}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div 
          className={`relative w-full ${sizes[size]} bg-white rounded-xl shadow-strong transform transition-all ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200">
              <h3 className="text-base sm:text-lg font-semibold text-secondary-900">
                {title}
              </h3>
              {closable && (
                <button
                  onClick={onClose}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors p-1"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
