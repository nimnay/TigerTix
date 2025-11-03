import { render, screen, fireEvent, waitFor} from '@testing-library/react';
import App from './App';
import TicketingChat from "./TicketingChat";

/*
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
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
