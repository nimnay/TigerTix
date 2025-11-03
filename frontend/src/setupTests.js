// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TicketingChat from "./components/TicketingChat";

global.fetch = jest.fn();

// Suppress console warnings during tests
const originalError = console.error;
const originalWarn = console.warn;

// --- Mock Fetch Implementation ---
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
// Restore original console methods after tests
afterAll(() => {
    console.log.mockRestore();
    console.error = originalError;
    console.warn = originalWarn;
  });
  

beforeEach(() => {
    global.fetch = jest.fn((url, options) => {
      // LLM parse endpoint
      if (url.endsWith('/api/llm/parse')) {
        const body = JSON.parse(options.body || '{}');
        if (body.message?.includes('Book 2 tickets')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                intent: 'book',
                needsConfirmation: true,
                booking: {
                  eventId: 1001,
                  eventName: 'AI Tech Expo',
                  tickets: 2,
                },
                reply: 'Ready to book 2 tickets for AI Tech Expo',
              }),
          });
        } else if (body.message?.includes('Book 100 tickets')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                intent: 'book',
                needsConfirmation: true,
                booking: {
                  eventId: 1001,
                  eventName: 'AI Tech Expo',
                  tickets: 100,
                },
                reply: 'Cannot book 100 tickets, not enough availability',
              }),
          });
        } else {
          // fallback response
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                intent: 'greeting',
                reply: 'Hello!',
              }),
          });
        }
      }
  
      // LLM confirm endpoint
      if (url.endsWith('/api/llm/confirm')) {
        const body = JSON.parse(options.body || '{}');
        if (body.eventId === 1001 && body.tickets === 2) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                eventName: 'AI Tech Expo',
                ticketsPurchased: 2,
                remainingTickets: 98,
                reply: 'Booking confirmed!',
              }),
          });
        } else {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({
                success: false,
                error: 'Cannot complete booking',
              }),
          });
        }
      }
  
      // Default fallback for any other fetch
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = undefined;
  });