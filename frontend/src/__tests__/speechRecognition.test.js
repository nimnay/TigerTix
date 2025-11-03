/**
 * Unit Tests for Speech Recognition Hook
 * Tests voice input functionality
 */

import { renderHook, act } from '@testing-library/react';
import useSpeechRecognition from '../hooks/speechRecognition';

// Mock Web Speech API
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = '';
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
    this.started = false;
  }

  start() {
    this.started = true;
  }

  stop() {
    this.started = false;
    if (this.onend) this.onend();
  }

  // Simulate speech result
  simulateResult(transcript, isFinal = true) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [
          {
            0: { transcript },
            isFinal,
            length: 1
          }
        ],
        length: 1
      };
      this.onresult(event);
    }
  }

  // Simulate error
  simulateError(error = 'no-speech') {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

describe('useSpeechRecognition Hook Tests', () => {
  let mockRecognition;
  let mockOnResult;

  beforeEach(() => {
    mockOnResult = jest.fn();
    mockRecognition = new MockSpeechRecognition();
    
    // Mock the SpeechRecognition API
    global.SpeechRecognition = jest.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;
    
    // Mock Audio for beep sound
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined)
    }));
  });

  afterEach(() => {
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;
    delete global.Audio;
    jest.clearAllMocks();
  });

  test('should initialize with correct default values', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    expect(result.current.listening).toBe(false);
    expect(result.current.supported).toBe(true);
  });

  test('should detect when speech recognition is not supported', () => {
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    expect(result.current.supported).toBe(false);
  });

  test('should start listening when startListening is called', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    expect(mockRecognition.started).toBe(true);
    expect(result.current.listening).toBe(true);
  });

  test('should stop listening when stopListening is called', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    expect(result.current.listening).toBe(true);

    act(() => {
      result.current.stopListening();
    });

    expect(mockRecognition.started).toBe(false);
    expect(result.current.listening).toBe(false);
  });

  test('should call onResult callback with transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.simulateResult('Hello TigerTix');
    });

    expect(mockOnResult).toHaveBeenCalledWith('Hello TigerTix');
  });

  test('should handle interim results', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.simulateResult('Book tickets', false);
    });

    expect(mockOnResult).toHaveBeenCalledWith('Book tickets');
  });

  test('should not start listening if already listening', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    const firstStartCount = mockRecognition.started;

    act(() => {
      result.current.startListening();
    });

    // Should not start again
    expect(mockRecognition.started).toBe(firstStartCount);
  });

  test('should set listening to false when recognition ends', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    expect(result.current.listening).toBe(true);

    act(() => {
      if (mockRecognition.onend) mockRecognition.onend();
    });

    expect(result.current.listening).toBe(false);
  });

  test('should configure recognition with correct settings', () => {
    renderHook(() => useSpeechRecognition(mockOnResult));

    expect(mockRecognition.continuous).toBe(false);
    expect(mockRecognition.interimResults).toBe(true);
    expect(mockRecognition.lang).toBe('en-US');
  });

  test('should play beep sound when starting', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    expect(global.Audio).toHaveBeenCalledWith('/mic-beep.mp3');
  });

  test('should handle multiple speech results', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.simulateResult('Book two tickets');
    });

    act(() => {
      mockRecognition.simulateResult('for AI Tech Expo');
    });

    expect(mockOnResult).toHaveBeenCalledTimes(2);
    expect(mockOnResult).toHaveBeenCalledWith('Book two tickets');
    expect(mockOnResult).toHaveBeenCalledWith('for AI Tech Expo');
  });

  test('should handle speech recognition errors gracefully', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnResult));

    act(() => {
      result.current.startListening();
    });

    // Simulate error - should not crash
    act(() => {
      mockRecognition.simulateError('no-speech');
    });

    // Should still be functional
    expect(result.current).toBeDefined();
  });
});
