import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductImage from '../ProductImage';

describe('ProductImage Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('Image URL Handling', () => {
    it('should render image with string array format', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(img).toHaveAttribute('alt', 'Test product');
    });

    it('should render image with object array format', () => {
      const images = [
        { url: 'https://example.com/image1.jpg' },
        { url: 'https://example.com/image2.jpg' }
      ];
      render(<ProductImage images={images} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    it('should render correct image based on currentIndex', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
      render(<ProductImage images={images} currentIndex={1} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image2.jpg');
    });

    it('should handle mixed format gracefully (fallback to no-image)', () => {
      const images = [{ invalidKey: 'value' }];
      render(<ProductImage images={images} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });
  });

  describe('Fallback Behavior', () => {
    it('should use fallback image when images array is empty', () => {
      render(<ProductImage images={[]} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });

    it('should use fallback image when images is null', () => {
      render(<ProductImage images={null} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });

    it('should use fallback image when images is undefined', () => {
      render(<ProductImage images={undefined} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });

    it('should use fallback image when currentIndex is out of bounds', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={5} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });

    it('should use fallback image when image at index is null', () => {
      const images = [null, 'https://example.com/image2.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });
  });

  describe('Error Handling', () => {
    it('should handle image load error and set fallback', () => {
      const images = ['https://example.com/broken-image.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Test product" />);
      
      const img = screen.getByRole('img');
      
      // Simulate image load error
      fireEvent.error(img);
      
      // Should set fallback image
      expect(img).toHaveAttribute('src', '/no-image.png');
      // Should set error handled flag
      expect(img.dataset.errorHandled).toBe('true');
    });

    it('should prevent infinite error loop with errorHandled flag', () => {
      const images = ['https://example.com/broken-image.jpg'];
      const customOnError = vi.fn();
      render(
        <ProductImage 
          images={images} 
          currentIndex={0} 
          alt="Test product"
          onError={customOnError}
        />
      );
      
      const img = screen.getByRole('img');
      
      // First error - should handle
      fireEvent.error(img);
      expect(customOnError).toHaveBeenCalledTimes(1);
      expect(img.dataset.errorHandled).toBe('true');
      
      // Second error - should NOT handle (infinite loop prevention)
      fireEvent.error(img);
      expect(customOnError).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should call custom onError handler when provided', () => {
      const images = ['https://example.com/broken-image.jpg'];
      const customOnError = vi.fn();
      render(
        <ProductImage 
          images={images} 
          currentIndex={0} 
          alt="Test product"
          onError={customOnError}
        />
      );
      
      const img = screen.getByRole('img');
      fireEvent.error(img);
      
      expect(customOnError).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      const images = ['https://example.com/image1.jpg'];
      const { container } = render(
        <ProductImage images={images} currentIndex={0} alt="Test product" />
      );
      
      // Check for loading skeleton
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should hide loading skeleton after image loads', async () => {
      const images = ['https://example.com/image1.jpg'];
      const { container } = render(
        <ProductImage images={images} currentIndex={0} alt="Test product" />
      );
      
      const img = screen.getByRole('img');
      
      // Simulate image load
      fireEvent.load(img);
      
      await waitFor(() => {
        const skeleton = container.querySelector('.animate-pulse');
        expect(skeleton).not.toBeInTheDocument();
      });
    });

    it('should call custom onLoad handler when provided', () => {
      const images = ['https://example.com/image1.jpg'];
      const customOnLoad = vi.fn();
      render(
        <ProductImage 
          images={images} 
          currentIndex={0} 
          alt="Test product"
          onLoad={customOnLoad}
        />
      );
      
      const img = screen.getByRole('img');
      fireEvent.load(img);
      
      expect(customOnLoad).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Product name" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Product name');
      expect(img).toHaveAttribute('aria-label', 'Product name');
    });

    it('should use default alt text when not provided', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={0} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Product image');
      expect(img).toHaveAttribute('aria-label', 'Product image');
    });

    it('should have role="img" attribute', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Test" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('role', 'img');
    });
  });

  describe('Lazy Loading', () => {
    it('should enable lazy loading by default', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Test" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should disable lazy loading when lazy=false', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Test" lazy={false} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const images = ['https://example.com/image1.jpg'];
      render(
        <ProductImage 
          images={images} 
          currentIndex={0} 
          alt="Test"
          className="custom-class w-full h-full"
        />
      );
      
      const img = screen.getByRole('img');
      expect(img).toHaveClass('custom-class', 'w-full', 'h-full');
    });

    it('should apply transition classes', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={0} alt="Test" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveClass('transition-opacity', 'duration-300');
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-array images gracefully', () => {
      render(<ProductImage images="not-an-array" currentIndex={0} alt="Test" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });

    it('should handle negative currentIndex', () => {
      const images = ['https://example.com/image1.jpg'];
      render(<ProductImage images={images} currentIndex={-1} alt="Test" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/no-image.png');
    });

    it('should handle currentIndex defaulting to 0', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
      render(<ProductImage images={images} alt="Test" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });
  });
});
