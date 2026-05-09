import { useState } from 'react';

/**
 * Reusable ProductImage component with built-in error handling and fallback support
 * 
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of image URLs (string array) or image objects (object array with url property)
 * @param {number} props.currentIndex - Current image index to display (default: 0)
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.lazy - Enable lazy loading (default: true)
 * @param {Function} props.onError - Optional custom error handler
 * @param {Function} props.onLoad - Optional load handler
 */
function ProductImage({ 
  images, 
  currentIndex = 0, 
  alt = 'Product image', 
  className = '', 
  lazy = true,
  onError: customOnError,
  onLoad
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  /**
   * Helper function to get image URL from various data formats
   * Handles both string arrays ["url1", "url2"] and object arrays [{url: "..."}, ...]
   * 
   * @returns {string} Image URL or fallback path
   */
  const getImageUrl = () => {
    // Check if images array exists and has items
    if (!images || !Array.isArray(images) || images.length === 0) {
      return '/no-image.png';
    }

    // Get the image at the current index
    const imageAtIndex = images[currentIndex];
    
    // Handle undefined/null at index
    if (!imageAtIndex) {
      return '/no-image.png';
    }

    // Handle string array format: ["url1", "url2"]
    if (typeof imageAtIndex === 'string') {
      return imageAtIndex;
    }

    // Handle object array format: [{url: "..."}, ...]
    if (typeof imageAtIndex === 'object' && imageAtIndex.url) {
      return imageAtIndex.url;
    }

    // Fallback if format is unexpected
    return '/no-image.png';
  };

  /**
   * Error handler with infinite loop prevention
   * Uses dataset.errorHandled flag to prevent repeated error handling
   * 
   * @param {Event} e - Error event
   */
  const handleImageError = (e) => {
    // Prevent infinite loop: check if error has already been handled
    if (e.target.dataset.errorHandled === 'true') {
      return;
    }

    // Mark error as handled to prevent re-triggering
    e.target.dataset.errorHandled = 'true';
    
    // Set fallback image
    e.target.src = '/no-image.png';
    
    // Update component state
    setIsLoading(false);
    setHasError(true);

    // Call custom error handler if provided
    if (customOnError) {
      customOnError(e);
    }
  };

  /**
   * Load handler to hide loading skeleton
   * 
   * @param {Event} e - Load event
   */
  const handleImageLoad = (e) => {
    setIsLoading(false);
    setHasError(false);

    // Call custom load handler if provided
    if (onLoad) {
      onLoad(e);
    }
  };

  const imageUrl = getImageUrl();

  return (
    <div className="relative w-full h-full">
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" aria-hidden="true">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={lazy ? 'lazy' : 'eager'}
        role="img"
        aria-label={alt}
      />
    </div>
  );
}

export default ProductImage;
