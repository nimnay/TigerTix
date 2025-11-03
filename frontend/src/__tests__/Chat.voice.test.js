/**
 * Voice Interface Tests for Chat Component
 * Tests speech recognition, text-to-speech, and voice interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '../Chat';

// Mock Web Speech APIs
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = '';
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
  }
  
  start() {
    this.started = true;
  }
  
  stop() {
    this.started = false;
    if (this.onend) this.onend();
  }
  
  simulateResult(transcript) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [{ 0: { transcript }, length: 1 }],
        length: 1
      };
      this.onresult(event);
    }
  }
}

class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.lang = 'en-US';
  }
}

describe('Chat Voice Interface Tests', () => {
  let mockRecognition;
  let mockSpeak;
  let mockCancel;

  beforeEach(() => {
    // Mock SpeechRecognition
    mockRecognition = new MockSpeechRecognition();
    global.SpeechRecognition = jest.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;

    // Mock SpeechSynthesis
    mockSpeak = jest.fn();
    mockCancel = jest.fn();
    global.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel
    };
    global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

    // Mock AudioContext for beep
    global.AudioContext = jest.fn().mockImplementation(() => ({
      createOscillator: () => ({
        connect: jest.fn(),
        frequency: { value: 0 },
        type: 'sine',
        start: jest.fn(),
        stop: jest.fn()
      }),
      createGain: () => ({
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        }
      }),
      destination: {},
      currentTime: 0
    }));
    global.webkitAudioContext = global.AudioContext;

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ response: 'Test response' })
      })
    );
  });

  afterEach(() => {
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;
    delete global.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
    delete global.AudioContext;
    delete global.webkitAudioContext;
    jest.clearAllMocks();
  });

  describe('Speech Recognition (Voice Input)', () => {
    test('should enable microphone button when speech recognition is supported', () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      expect(micButton).toBeInTheDocument();
      expect(micButton).not.toBeDisabled();
    });

    test('should start listening when microphone button is clicked', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(mockRecognition.started).toBe(true);
      });
    });

    test('should update input text with voice transcript', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      const input = screen.getByPlaceholderText(/type or speak/i);
      
      fireEvent.click(micButton);
      
      mockRecognition.simulateResult('Book two tickets for AI Tech Expo');
      
      await waitFor(() => {
        expect(input.value).toBe('Book two tickets for AI Tech Expo');
      });
    });

    test('should show "Listening..." placeholder while recording', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/listening/i);
        expect(input).toBeInTheDocument();
      });
    });

    test('should play beep sound when starting voice recognition', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(global.AudioContext).toHaveBeenCalled();
      });
    });

    test('should handle speech recognition not supported', () => {
      delete global.SpeechRecognition;
      delete global.webkitSpeechRecognition;
      
      // Mock alert
      global.alert = jest.fn();
      
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('not supported')
      );
    });

    test('should configure speech recognition with correct settings', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(mockRecognition.lang).toBe('en-US');
        expect(mockRecognition.continuous).toBe(false);
        expect(mockRecognition.interimResults).toBe(true);
      });
    });

    test('should handle speech recognition errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      
      if (mockRecognition.onerror) {
        mockRecognition.onerror({ error: 'no-speech' });
      }
      
      // Should not crash
      expect(screen.getByLabelText(/voice input/i)).toBeInTheDocument();
      
      consoleError.mockRestore();
    });
  });

  describe('Text-to-Speech (Voice Output)', () => {
    test('should speak assistant responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ response: 'Welcome to TigerTix!' })
        })
      );

      render(<Chat />);
      const input = screen.getByPlaceholderText(/type or speak/i);
      const sendButton = screen.getByLabelText(/send message/i);
      
      await userEvent.type(input, 'Hello');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });
      
      const utteranceArg = mockSpeak.mock.calls[0][0];
      expect(utteranceArg.text).toBe('Welcome to TigerTix!');
    });

    test('should configure speech synthesis with correct settings', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ response: 'Test message' })
        })
      );

      render(<Chat />);
      const input = screen.getByPlaceholderText(/type or speak/i);
      const sendButton = screen.getByLabelText(/send message/i);
      
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });
      
      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.rate).toBe(1.0);
      expect(utterance.pitch).toBe(1.0);
      expect(utterance.lang).toBe('en-US');
    });

    test('should cancel previous speech before speaking new message', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ response: 'New message' })
        })
      );

      render(<Chat />);
      const input = screen.getByPlaceholderText(/type or speak/i);
      const sendButton = screen.getByLabelText(/send message/i);
      
      await userEvent.type(input, 'Message');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockCancel).toHaveBeenCalled();
      });
    });

    test('should speak booking confirmation message', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            response: 'Ready to book',
            booking: { eventId: 1, tickets: 2, eventName: 'Test Event' }
          })
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ response: 'Booking confirmed!' })
        });

      render(<Chat />);
      const input = screen.getByPlaceholderText(/type or speak/i);
      const sendButton = screen.getByLabelText(/send message/i);
      
      await userEvent.type(input, 'Book tickets');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/confirm booking/i)).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText(/confirm booking/i);
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Booking confirmed!'
          })
        );
      });
    });

    test('should handle text-to-speech not supported', async () => {
      delete global.speechSynthesis;

      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ response: 'Test' })
        })
      );

      render(<Chat />);
      const input = screen.getByPlaceholderText(/type or speak/i);
      const sendButton = screen.getByLabelText(/send message/i);
      
      await userEvent.type(input, 'Hello');
      fireEvent.click(sendButton);
      
      // Should not crash even without speech synthesis
      await waitFor(() => {
        expect(screen.getByText(/test/i)).toBeInTheDocument();
      });
    });
  });

  describe('Voice and Text Combined Workflow', () => {
    test('should support voice input followed by text submission', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      mockRecognition.simulateResult('Show available events');
      
      const input = await screen.findByDisplayValue('Show available events');
      expect(input).toBeInTheDocument();
      
      const sendButton = screen.getByLabelText(/send message/i);
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('should allow editing voice-transcribed text before sending', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      mockRecognition.simulateResult('Book tickets');
      
      const input = await screen.findByDisplayValue('Book tickets');
      
      // User edits the transcribed text
      await userEvent.clear(input);
      await userEvent.type(input, 'Book 2 tickets for Concert');
      
      expect(input.value).toBe('Book 2 tickets for Concert');
    });

    test('should disable voice button while loading', async () => {
      global.fetch = jest.fn(() => new Promise(resolve => {
        setTimeout(() => resolve({
          json: () => Promise.resolve({ response: 'Done' })
        }), 100);
      }));

      render(<Chat />);
      const input = screen.getByPlaceholderText(/type or speak/i);
      const sendButton = screen.getByLabelText(/send message/i);
      
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);
      
      const micButton = screen.getByLabelText(/voice input/i);
      expect(micButton).toBeDisabled();
    });
  });

  describe('Voice Accessibility Features', () => {
    test('should have aria-label for voice input button', () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      expect(micButton).toHaveAttribute('aria-label');
    });

    test('should provide visual feedback when listening', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(micButton).toHaveClass('listening');
      });
    });

    test('should show appropriate placeholder text for voice state', async () => {
      render(<Chat />);
      const micButton = screen.getByLabelText(/voice input/i);
      
      // Before listening
      expect(screen.getByPlaceholderText(/type or speak/i)).toBeInTheDocument();
      
      // During listening
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/listening/i)).toBeInTheDocument();
      });
    });
  });
});
