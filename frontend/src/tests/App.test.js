/**
 * App.test.js
 * Unit Tests for App Component
 * Tests rendering of main elements and ticket booking flow
 */
import { render, screen, fireEvent, waitFor} from '@testing-library/react';
import App from '../App';
import TicketingChat from "../components/TicketingChat";

// Test 1: Renders page title
test("renders page title", () => {
  render(<App />);
  const title = screen.getByText(/Clemson Campus Events/i);
  expect(title).toBeInTheDocument();
});

// Test 2: Renders welcome message
test("renders welcome message", () => {
  render(<App />);
  const welcome = screen.getByText(/Welcome to TigerTix!/i);
  expect(welcome).toBeInTheDocument();
});
