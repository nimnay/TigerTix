import { render, screen } from '@testing-library/react';
import App from './App';

test('renders TigerTix welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/welcome to tigertix/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('renders page title', () => {
  render(<App />);
  const titleElement = screen.getByText(/clemson campus events/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders upcoming events section', () => {
  render(<App />);
  const eventsSection = screen.getByText(/upcoming events/i);
  expect(eventsSection).toBeInTheDocument();
});
