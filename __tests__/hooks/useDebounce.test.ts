import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    // Call the debounced function multiple times
    act(() => {
      result.current();
      result.current();
      result.current();
    });

    // Callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Callback should have been called only once
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous timeout when called again', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Call again before the delay completes
    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Still shouldn't have been called
    expect(callback).not.toHaveBeenCalled();

    // Complete the remaining time
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should be called once
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should work with different delays', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 1000));

    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should update callback when it changes', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    const { result, rerender } = renderHook(
      ({ cb, delay }) => useDebounce(cb, delay),
      { initialProps: { cb: callback1, delay: 500 } }
    );

    // Update the callback before calling
    rerender({ cb: callback2, delay: 500 });

    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // New callback should be called
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback1).not.toHaveBeenCalled();
  });

  it('should handle rapid successive calls correctly', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    // Simulate rapid typing
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current();
        jest.advanceTimersByTime(50);
      });
    }

    // Should not have been called during rapid input
    expect(callback).not.toHaveBeenCalled();

    // Wait for the full delay after last call
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should only be called once after all rapid calls
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
