

// src/setupTests.js

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
import '@testing-library/jest-dom';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.post('http://localhost:3001/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        username: req.body.username,
        token: 'mock-jwt-token',
        message: 'User registered successfully',
      })
    );
  }),

  rest.post('http://localhost:3001/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        username: req.body.username,
        token: 'mock-jwt-token',
        message: 'Login successful',
      })
    );
  }),
];


// src/__tests__/Auth.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Authentication flow', () => {

  test('Registration form validation and login state', async () => {
    render(<App />);

    // Show registration form
    fireEvent.click(screen.getByText(/Register/i));

    // Submit empty form → should show validation errors
    fireEvent.click(screen.getByText(/^Register$/i));
    expect(await screen.findByText(/Enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/Username must be/i)).toBeInTheDocument();

    // Fill form correctly
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByText(/^Register$/i));

    // Wait for success → Logged in state
    await waitFor(() => expect(screen.getByText(/Logged in as testuser/i)).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBe('mock-jwt-token'); // token stored
  });

  test('Logout clears token and updates UI', async () => {
    render(<App />);

    // Mock logged-in state
    localStorage.setItem('token', 'mock-jwt-token');
    fireEvent.click(screen.getByText(/Logout/i));

    await waitFor(() => {
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  test('Redirects to login when token expires', async () => {
    // Here you can mock an expired token in localStorage
    const expiredToken = {
      exp: Math.floor(Date.now() / 1000) - 10, // 10 seconds ago
    };
    localStorage.setItem('token', btoa(JSON.stringify(expiredToken)));

    render(<App />);

    // Wait for auto-logout
    await waitFor(() => expect(screen.getByText(/Login/i)).toBeInTheDocument());
  });
});

