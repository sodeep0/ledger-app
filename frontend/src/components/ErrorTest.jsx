import React, { useState } from 'react';

// Test component to demonstrate error boundary functionality
const ErrorTest = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test error to demonstrate the ErrorBoundary!');
  }

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-medium text-yellow-800 mb-4">Error Boundary Test</h3>
      <p className="text-yellow-700 mb-4">
        This component can be used to test the error boundary functionality.
        Click the button below to trigger an error.
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Trigger Error
      </button>
    </div>
  );
};

export default ErrorTest;
