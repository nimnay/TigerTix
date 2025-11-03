import { render, screen, fireEvent, waitFor} from '@testing-library/react';
import App from './App';
import TicketingChat from "./TicketingChat";

<<<<<<< HEAD
/*
test('renders learn react link', () => {
=======
test('renders TigerTix welcome message', () => {
>>>>>>> 31f45275accb212f0b3dcff8e1ef0f918dfe845d
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
*/

test("renders page title", () => {
  render(<App />);
  const title = screen.getByText(/Clemson Campus Events/i);
  expect(title).toBeInTheDocument();
});

test("renders welcome message", () => {
  render(<App />);
  const welcome = screen.getByText(/Welcome to TigerTix!/i);
  expect(welcome).toBeInTheDocument();
});

test("Confirm button triggers successful booking and decrements ticket count", async () => {
  render(<TicketingChat />);

  const input = screen.getByPlaceholderText("Type a message...");
  fireEvent.change(input, { target: { value: "Book 2 tickets for AI Tech Expo" } });
  fireEvent.keyDown(input, { key: "Enter" });

  await waitFor(() =>
    expect(screen.getByText(/Ready to book 2 tickets for AI Tech Expo/i)).toBeInTheDocument()
  );

  //Confirm button
  const confirmButton = screen.getByText("Confirm Booking");
  fireEvent.click(confirmButton);

  // booking confirmation
  await waitFor(() =>
    expect(screen.getByText(/Booking confirmed!/i)).toBeInTheDocument()
  );
});
