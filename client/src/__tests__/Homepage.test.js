import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Homepage from "../pages/Home";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockEmit = jest.fn();
const mockNavigate = jest.fn();

// Mock only what Homepage actually uses from each module.
// Avoid jest.requireActual("react-router-dom") — react-router-dom v7 ships
// ESM and the CRA jest resolver struggles with requireActual on ESM packages.
jest.mock("../Providers/Socket", () => ({
  useSocket: () => ({ socket: { emit: mockEmit } }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// ── Tests ──────────────────────────────────────────────────────────────────
describe("Homepage", () => {
  beforeEach(() => {
    mockEmit.mockClear();
    mockNavigate.mockClear();
  });

  it("renders the heading", () => {
    render(<Homepage />);
    expect(screen.getByRole("heading", { name: /webrtc video call/i })).toBeInTheDocument();
  });

  it("renders email and room-code inputs", () => {
    render(<Homepage />);
    expect(screen.getByPlaceholderText(/enter your email here/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter room code/i)).toBeInTheDocument();
  });

  it("renders the 'Enter Room' button", () => {
    render(<Homepage />);
    expect(screen.getByRole("button", { name: /enter room/i })).toBeInTheDocument();
  });

  it("disables the button when inputs are empty", () => {
    render(<Homepage />);
    expect(screen.getByRole("button", { name: /enter room/i })).toBeDisabled();
  });

  it("enables the button when both fields are filled", () => {
    render(<Homepage />);
    fireEvent.change(screen.getByPlaceholderText(/enter your email here/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter room code/i), {
      target: { value: "ROOM123" },
    });
    expect(screen.getByRole("button", { name: /enter room/i })).not.toBeDisabled();
  });

  it("emits 'join-room' with correct data on form submit", async () => {
    render(<Homepage />);

    fireEvent.change(screen.getByPlaceholderText(/enter your email here/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter room code/i), {
      target: { value: "ABC123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith("join-room", {
        emailId: "user@example.com",
        roomId: "ABC123",
      });
    });
  });

  it("navigates to the room after submit", async () => {
    render(<Homepage />);

    fireEvent.change(screen.getByPlaceholderText(/enter your email here/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter room code/i), {
      target: { value: "ROOM99" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/room/ROOM99");
    });
  });

  it("shows an alert and does NOT emit/navigate when fields are empty", () => {
    window.alert = jest.fn();
    render(<Homepage />);

    fireEvent.submit(
      screen.getByRole("button", { name: /enter room/i }).closest("form")
    );

    expect(window.alert).toHaveBeenCalledWith("Please fill in both email and room code.");
    expect(mockEmit).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
