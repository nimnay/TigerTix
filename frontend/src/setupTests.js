// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TicketingChat from "./TicketingChat";

global.fetch = jest.fn();

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
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



  //accessability testing
test("chat input and buttons are fully keyboard-navigable", async () => {
    render(<TicketingChat />);
  
    // Simulate tabbing to the input
    const input = screen.getByPlaceholderText("Type a message...");
    input.focus();
    expect(input).toHaveFocus();
  
    // Type a booking request
    fireEvent.change(input, { target: { value: "Book 2 tickets for AI Tech Expo" } });
  
    // Press Enter to send
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
  
    // Wait for LLM response to appear
    const confirmText = await screen.findByText(/Ready to book 2 tickets/i);
    expect(confirmText).toBeInTheDocument();
  
    // Simulate tabbing to the Confirm Booking button
    const confirmButton = screen.getByText("Confirm Booking");
    confirmButton.focus();
    expect(confirmButton).toHaveFocus();
  
    // Press Enter to activate
    fireEvent.keyDown(confirmButton, { key: "Enter", code: "Enter" });
  
    // Confirm booking message appears
    const bookingConfirmed = await screen.findByText(/Booking confirmed!/i);
    expect(bookingConfirmed).toBeInTheDocument();
  });