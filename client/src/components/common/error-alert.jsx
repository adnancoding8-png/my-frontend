import { AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Error Alert Component
 * 
 * Displays error messages to users with different error types:
 * - Connection errors: "Unable to connect to the server..."
 * - CORS errors: "Server configuration error..."
 * - Auth errors: "Your session has expired..."
 * - Server errors: "Server error. Please try again later..."
 * 
 * **Validates: Requirements 4.3, 4.4**
 */
export function ErrorAlert({ 
  error, 
  onDismiss, 
  autoClose = true, 
  autoCloseDuration = 5000,
  onRetry = null,
  className = ""
}) {
  const [isVisible, setIsVisible] = useState(!!error);

  useEffect(() => {
    setIsVisible(!!error);

    if (error && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [error, autoClose, autoCloseDuration, onDismiss]);

  if (!isVisible || !error) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">Error</h3>
          <p className="text-red-800 text-sm">{error}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Try again
            </button>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="text-red-600 hover:text-red-900 flex-shrink-0"
          aria-label="Dismiss error"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ErrorAlert;
