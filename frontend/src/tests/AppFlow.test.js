

// Mock jwt-decode to return a valid exp so your useEffect doesn't auto-logout
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour in future
  })),
}));



import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

import jwtDecode from 'jwt-decode';

beforeEach(() => {
  localStorage.clear();

  global.fetch = jest.fn((url, options) => {
    // Register
    if (url.includes("/register")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ token: "mock-jwt", username: "testuser",
            message: "Registered successfully" })  
      });
    }

    // Login
    if (url.includes("/login")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: "mock-jwt", username: "diana",
          message: "Logged in" })
      });
    }

    // Events
    if (url.includes("/events")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, name: "Concert", date: "2025-01-01", available_tickets: 20 },
            { id: 2, name: "Play", date: "2025-02-01", available_tickets: 10 }
          ])
      });
    }

    // Fallback
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    });
  });
});



//Test Suite

describe("Auth + Protected Routes + Accessibility", () => {
  test("Registration validation + successful register", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Open registration form
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Submit empty → should show errors
    await user.click(screen.getByRole('button', { name: /^register$/i }));
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /username must be 3-20 characters, letters\/numbers\/_\/- only/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();

    // Fill the form correctly
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/^password$/i), "Password123");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123");

    // Submit registration
    await user.click(screen.getByRole('button', { name: /^register$/i }));

    // Wait for loggedIn banner
    await waitFor(() => {
        expect(screen.getByText(/logged in as testuser/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Now check events render
    expect(screen.getByText(/upcoming events/i)).toBeInTheDocument();
    expect(screen.getByText(/Concert/i)).toBeInTheDocument();
    expect(screen.getByText(/Play/i)).toBeInTheDocument();

    // Ensure token is saved
    expect(localStorage.getItem("token")).toBe("mock-jwt");
});

  

    test("Login → access protected route → see protected content", async () => {
      const user = userEvent.setup();
      render(<App />);

        await user.type(screen.getByLabelText(/email or username/i), "diana");  
        await user.type(screen.getByLabelText(/^password$/i), "testpass");
        await user.click(screen.getByRole('button', { name: /^login$/i })); 
        // After successful login, should see logged-in banner
        await waitFor(() =>
            expect(screen.getByText(/logged in as/i)).toBeInTheDocument(),  
        );
        
        // After login, should see events section (not a "protected page" link)
        await waitFor(() => {
            expect(screen.getByText(/upcoming events/i)).toBeInTheDocument();
      });
    });

    //logout
    test("Logout wipes token and redirects to login", async () => {
        const user = userEvent.setup();
        render(<App />);

        localStorage.setItem("token", "mock-jwt");

        /*
        await user.click(screen.getByRole('button', { name: /login/i }));
        await user.type(screen.getByLabelText(/email or username/i), "diana");
        await user.type(screen.getByLabelText(/^password$/i), "testpass");
        await user.click(screen.getByRole('button', { name: /^login$/i }));
        */
        // confirm logged in
        //await screen.findByText(/logged in as/i);
        await waitFor(() =>
          expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument()
        );

    // now logout exists
        await user.click(screen.getByRole('button', { name: /logout/i }));

        expect(localStorage.getItem("token")).toBeNull();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();

        /*
        localStorage.setItem("token", "mock-jwt");
    
        userEvent.click(screen.getByText(/logout/i));

    
        await waitFor(() => {
          const logoutButton = screen.queryByRole('button', { name: /logout/i });
          expect(logoutButton).toBeInTheDocument();
        }, { timeout: 3000 });

        await user.click(screen.getByRole('button', { name: /logout/i }));

        // After logout, token should be cleared
        await waitFor(() => {
          expect(localStorage.getItem("token")).toBeNull();
        }, { timeout: 2000 });

        // Should see login form again
        expect(screen.getByText(/^login$/i)).toBeInTheDocument();
        */
    });

    //token expiration
    test("Expired token → auto redirect to login", async () => {
        const expiredToken = {
          exp: Math.floor(Date.now() / 1000) - 60 // expired 1 min ago
        };
    
        localStorage.setItem("token", btoa(JSON.stringify(expired)));
    
        render(<App />);
    
        await waitFor(() =>
          expect(screen.getByText(/login/i)).toBeInTheDocument()
        );
    });


    //accessibility
    test("Accessibility: form inputs have labels & tab order works", async () => {
        const user = userEvent.setup();
        await user.tab();
        expect(screen.getByLabelText(/email or username/i)).toHaveFocus();

        await user.tab();
        expect(screen.getByLabelText(/^password$/i)).toHaveFocus();
      });
        /*
        userEvent.click(screen.getByRole("button", {name: /login/i }));
    
        // Check accessible labels
        const userInput = screen.getByLabelText(/username/i);
        const passInput = screen.getByLabelText(/^password$/i);
    
        expect(userInput).toBeInTheDocument();
        expect(passInput).toBeInTheDocument();
    
        // Check keyboard focus (tab order)
        userEvent.tab();
        expect(userInput).toHaveFocus();
    
        userEvent.tab();
        expect(passInput).toHaveFocus();
        */
});