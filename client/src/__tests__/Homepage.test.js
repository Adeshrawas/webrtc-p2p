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
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter room code/i)).toBeInTheDocument();
  });

  it("renders the 'Join Room' button", () => {
    render(<Homepage />);
    expect(screen.getByRole("button", { name: /join room/i })).toBeInTheDocument();
  });

  it("disables the button when inputs are empty", () => {
    render(<Homepage />);
    expect(screen.getByRole("button", { name: /join room/i })).toBeDisabled();
  });

  it("enables the button when both fields are filled", () => {
    render(<Homepage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter room code/i), {
      target: { value: "ROOM123" },
    });
    expect(screen.getByRole("button", { name: /join room/i })).not.toBeDisabled();
  });

  it("emits 'join-room' with correct data on form submit", async () => {
    render(<Homepage />);

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter room code/i), {
      target: { value: "ABC123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join room/i }));

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith("join-room", {
        emailId: "user@example.com",
        roomId: "ABC123",
      });
    });
  });

  it("navigates to the room after submit", async () => {
    render(<Homepage />);

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter room code/i), {
      target: { value: "ROOM99" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join room/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/room/ROOM99");
    });
  });

  it("does NOT emit or navigate when fields are empty (button is disabled)", () => {
    render(<Homepage />);

    // Button is disabled so submitting the form with empty fields does nothing
    fireEvent.submit(screen.getByRole("button", { name: /join room/i }).closest("form"));

    expect(mockEmit).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
