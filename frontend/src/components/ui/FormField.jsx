// src/components/ui/FormField.jsx

/**
 * Reusable FormField component for consistent form layout
 * @param {Object} props - Component props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name
 * @param {boolean} props.required - Required field indicator
 * @param {string} props.error - Error message
 * @param {string} props.helpText - Help text
 * @param {React.ReactNode} props.children - Form input element
 * @param {string} props.className - Additional CSS classes
 */
const FormField = ({ 
  label, 
  name, 
  required = false, 
  error = '', 
  helpText = '', 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-secondary-700"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input Field */}
      <div className="relative">
        {children}
      </div>
      
      {/* Help Text */}
      {helpText && !error && (
        <p className="text-xs text-secondary-500">
          {helpText}
        </p>
      )}
      
      {/* Error Message */}
      {error && (
        <p className="text-xs text-error-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
