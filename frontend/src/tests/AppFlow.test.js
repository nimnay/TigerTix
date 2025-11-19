import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock backend handlers
const server = setupServer(
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

  rest.get('http://localhost:6001/api/events', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, name: 'Event A', date: '2025-11-25', available_tickets: 5 },
        { id: 2, name: 'Event B', date: '2025-12-01', available_tickets: 0 },
      ])
    );
  }),

  rest.post('http://localhost:6001/api/events/:id/purchase', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Ticket purchased successfully' })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe('Full frontend-backend integration flow', () => {

  test('Registration form validation & successful registration', async () => {
    render(<App />);

    // Switch to Registration form
    fireEvent.click(screen.getByText(/Register/i));

    // Submit empty form → validation errors
    fireEvent.click(screen.getByText(/^Register$/i));
    expect(await screen.findByText(/Enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/Username must be/i)).toBeInTheDocument();

    // Fill form correctly
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByText(/^Register$/i));

    // Wait for logged-in state
    await waitFor(() => expect(screen.getByText(/Logged in as testuser/i)).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
  });

  test('Login form validation & successful login', async () => {
    render(<App />);

    // Make sure login form is shown
    expect(screen.getByText(/^Login$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^Login$/i)); // submit empty
    expect(await screen.findByText(/Username\/email and password are required/i)).toBeInTheDocument();

    // Fill login form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByText(/^Login$/i));

    await waitFor(() => expect(screen.getByText(/Logged in as testuser/i)).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
  });

  test('Auto-redirect to login on token expiration', async () => {
    // Mock expired token in localStorage
    const expiredToken = {
      exp: Math.floor(Date.now() / 1000) - 10, // expired
    };
    localStorage.setItem('token', btoa(JSON.stringify(expiredToken)));

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Login/i)).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('Logout clears token & updates UI', async () => {
    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Mock logged-in state
    fireEvent.click(screen.getByText(/Logout/i));

    await waitFor(() => {
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  test('Fetches events and handles ticket purchase', async () => {
    localStorage.setItem('token', 'mock-jwt-token');
    render(<App />);

    // Wait for events to appear
    await waitFor(() => expect(screen.getByText(/Event A/i)).toBeInTheDocument());
    expect(screen.getByText(/Tickets Available: 5/i)).toBeInTheDocument();

    // Buy a ticket
    fireEvent.click(screen.getByText(/Buy Ticket/i));
    await waitFor(() => expect(screen.getByText(/Ticket purchased successfully!/i)).toBeInTheDocument());
  });

  test('Accessibility checks', async () => {
    render(<App />);

    // Forms have labels
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();

    // Event list uses aria-live
    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
  });
});
