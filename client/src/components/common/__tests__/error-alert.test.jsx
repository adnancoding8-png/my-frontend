import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorAlert } from '../error-alert';

describe('ErrorAlert Component', () => {
  it('should render error message when error prop is provided', () => {
    const error = 'Unable to connect to the server. Please check your internet connection and try again.';
    render(<ErrorAlert error={error} />);
    
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should not render when error prop is null', () => {
    const { container } = render(<ErrorAlert error={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render when error prop is undefined', () => {
    const { container } = render(<ErrorAlert error={undefined} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    const error = 'Test error message';
    render(<ErrorAlert error={error} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should auto-close after specified duration', async () => {
    const onDismiss = vi.fn();
    const error = 'Test error message';
    render(
      <ErrorAlert 
        error={error} 
        onDismiss={onDismiss}
        autoClose={true}
        autoCloseDuration={100}
      />
    );
    
    expect(screen.getByText(error)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('should not auto-close when autoClose is false', async () => {
    const onDismiss = vi.fn();
    const error = 'Test error message';
    render(
      <ErrorAlert 
        error={error} 
        onDismiss={onDismiss}
        autoClose={false}
      />
    );
    
    expect(screen.getByText(error)).toBeInTheDocument();
    
    // Wait a bit and verify onDismiss was not called
    await waitFor(() => {
      expect(onDismiss).not.toHaveBeenCalled();
    }, { timeout: 100 });
  });

  it('should display retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    const error = 'Test error message';
    render(<ErrorAlert error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('should not display retry button when onRetry is not provided', () => {
    const error = 'Test error message';
    render(<ErrorAlert error={error} />);
    
    const retryButton = screen.queryByText('Try again');
    expect(retryButton).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const error = 'Test error message';
    const customClass = 'custom-error-class';
    const { container } = render(
      <ErrorAlert error={error} className={customClass} />
    );
    
    const alertDiv = container.querySelector(`.${customClass}`);
    expect(alertDiv).toBeInTheDocument();
  });

  it('should handle different error types', () => {
    const errors = [
      'Unable to connect to the server. Please check your internet connection and try again.',
      'Server configuration error. Please contact support.',
      'Your session has expired. Please log in again.',
      'Server error. Please try again later.',
    ];

    errors.forEach(error => {
      const { unmount } = render(<ErrorAlert error={error} />);
      expect(screen.getByText(error)).toBeInTheDocument();
      unmount();
    });
  });
});
