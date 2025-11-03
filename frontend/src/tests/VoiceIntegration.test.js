/**
 * VoiceIntegration.test.js
 * Voice Feature Integration Tests
 * Tests end-to-end voice booking workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '../components/Chat';

// Mock implementations
class MockSpeechRecognition {
  constructor() {
    this.started = false;
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
  }
  
  start() { this.started = true; }
  stop() { this.started = false; if (this.onend) this.onend(); }
  
  simulateResult(transcript) {
    if (this.onresult) {
      this.onresult({
        resultIndex: 0,
        results: [{ 0: { transcript }, length: 1 }],
        length: 1
      });
    }
  }
}

describe('Voice Booking Integration Tests', () => {
  let mockRecognition;
  let mockSpeak;

  beforeEach(() => {
    mockRecognition = new MockSpeechRecognition();
    global.SpeechRecognition = jest.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;

    mockSpeak = jest.fn();
    global.speechSynthesis = { speak: mockSpeak, cancel: jest.fn() };
    global.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.rate = 1.0; this.pitch = 1.0; this.lang = 'en-US'; }
    };

    global.AudioContext = jest.fn(() => ({
      createOscillator: () => ({
        connect: jest.fn(), frequency: { value: 0 }, type: 'sine',
        start: jest.fn(), stop: jest.fn()
      }),
      createGain: () => ({
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
      }),
      destination: {}, currentTime: 0
    }));
    global.webkitAudioContext = global.AudioContext;
  });

  afterEach(() => {
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;
    delete global.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
    delete global.AudioContext;
    jest.clearAllMocks();
  });

  test('Complete voice booking workflow - view events', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          intent: 'view',
          response: 'Here are the available events',
          events: [
            { id: 1, name: 'Concert', tickets_sold: 10, number_of_tickets: 100 }
          ]
        })
      })
    );

    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    // User speaks: "Show me available events"
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Show me available events');
    
    const input = await screen.findByDisplayValue('Show me available events');
    expect(input).toBeInTheDocument();
    
    // Submit the voice input
    const sendButton = screen.getByLabelText(/send message/i);
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalled();
      expect(mockSpeak.mock.calls[0][0].text).toContain('available events');
    });
  });

  test('Complete voice booking workflow - book tickets', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          intent: 'book',
          response: 'Ready to book 2 tickets for AI Tech Expo',
          needsConfirmation: true,
          booking: { eventId: 1001, tickets: 2, eventName: 'AI Tech Expo' }
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          response: 'Successfully booked 2 tickets for AI Tech Expo!'
        })
      });

    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    // Step 1: Voice command to book tickets
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Book 2 tickets for AI Tech Expo');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Book 2 tickets for AI Tech Expo')).toBeInTheDocument();
    });
    
    // Submit
    const sendButton = screen.getByLabelText(/send message/i);
    fireEvent.click(sendButton);
    
    // Wait for booking confirmation button to appear (not just the text)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm booking/i })).toBeInTheDocument();
    });
    
    // Confirm the booking
    const confirmButton = screen.getByRole('button', { name: /confirm booking/i });
    fireEvent.click(confirmButton);
    
    // Verify confirmation was spoken
    await waitFor(() => {
      expect(mockSpeak.mock.calls.length).toBeGreaterThan(0);
      const spokenText = mockSpeak.mock.calls.map(call => call[0].text).join(' ');
      expect(spokenText).toContain('booked');
    });
  });

  test('Voice command with greeting', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          intent: 'greeting',
          response: 'Hello! Welcome to TigerTix. How can I help you today?'
        })
      })
    );

    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Hello');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });
    
    const sendButton = screen.getByLabelText(/send message/i);
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/welcome to tigertix/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalled();
      expect(mockSpeak.mock.calls[0][0].text).toContain('TigerTix');
    });
  });

  test('Voice input error handling', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    fireEvent.click(micButton);
    
    // Simulate recognition error
    if (mockRecognition.onerror) {
      mockRecognition.onerror({ error: 'network' });
    }
    
    // Should still be functional
    expect(micButton).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  test('Multiple voice commands in sequence', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          intent: 'view',
          response: 'Showing events'
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          intent: 'book',
          response: 'Booking started'
        })
      });

    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    // First command
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Show events');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Show events')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText(/send message/i));
    
    await waitFor(() => {
      expect(screen.getByText('Showing events')).toBeInTheDocument();
    });
    
    // Second command
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Book tickets');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Book tickets')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText(/send message/i));
    
    await waitFor(() => {
      expect(screen.getByText('Booking started')).toBeInTheDocument();
    });
    
    expect(mockSpeak.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('Voice command cancellation', async () => {
    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Book tickets for...');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Book tickets for...')).toBeInTheDocument();
    });
    
    // User clears the input instead of sending
    const input = screen.getByDisplayValue('Book tickets for...');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(input.value).toBe('');
    
    // Send button should be disabled with empty input
    const sendButton = screen.getByLabelText(/send message/i);
    expect(sendButton).toBeDisabled();
  });

  test('Voice input with network error', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Show events');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Show events')).toBeInTheDocument();
    });
    
    const sendButton = screen.getByLabelText(/send message/i);
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/trouble connecting to the service/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    consoleError.mockRestore();
  });

  test('Voice feedback for booking confirmation', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          intent: 'book',
          response: 'Preparing to book',
          booking: { eventId: 1, tickets: 1, eventName: 'Test Event' }
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          response: 'Your ticket has been reserved!'
        })
      });

    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Book one ticket for Test Event');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Book one ticket for Test Event')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText(/send message/i));
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm booking/i })).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
    
    await waitFor(() => {
      expect(mockSpeak.mock.calls.length).toBeGreaterThan(0);
      const lastSpokenText = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text;
      expect(lastSpokenText).toContain('reserved');
    });
  });

  test('Voice input respects loading state', async () => {
    global.fetch = jest.fn(() => 
      new Promise(resolve => setTimeout(() => 
        resolve({ json: () => Promise.resolve({ response: 'Done' }) }), 100
      ))
    );

    render(<Chat />);
    const micButton = screen.getByLabelText(/voice input/i);
    
    fireEvent.click(micButton);
    mockRecognition.simulateResult('Test message');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test message')).toBeInTheDocument();
    });
    
    const sendButton = screen.getByLabelText(/send message/i);
    fireEvent.click(sendButton);
    
    // Wait a bit for loading state to kick in
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Mic button should be disabled during loading
    await waitFor(() => {
      const currentMicButton = screen.getByLabelText(/voice input/i);
      expect(currentMicButton).toBeDisabled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
    
    // Should be enabled again after loading
    await waitFor(() => {
      const currentMicButton = screen.getByLabelText(/voice input/i);
      expect(currentMicButton).not.toBeDisabled();
    });
  });
});
