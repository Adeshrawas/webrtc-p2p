import { render, screen } from "@testing-library/react";
import { SocketProvider, useSocket } from "../Providers/Socket";

// ── Mock ───────────────────────────────────────────────────────────────────
// jest.mock() is hoisted above imports and its factory persists across tests,
// but the individual jest.fn() instances inside the mock can be reset by CRA.
// We reassign a fresh mock object in beforeEach to guarantee stability.

const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
  id: "test-socket-id",
};

// The `io` factory always returns the same mockSocket reference so we can
// inspect calls on it after rendering.
jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

// Re-wire the io() return value before every test so a CRA-triggered
// mockReset() between tests never leaves io() returning undefined.
beforeEach(() => {
  // Reset mock state without removing the jest.fn() reference
  Object.assign(mockSocket, {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: "test-socket-id",
  });

  const { io } = require("socket.io-client");
  io.mockReturnValue(mockSocket);
});

// ── Helper consumer ────────────────────────────────────────────────────────
const SocketConsumer = () => {
  const { socket } = useSocket();
  return <div data-testid="socket-id">{socket?.id ?? "no-socket"}</div>;
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe("SocketProvider", () => {
  it("renders children without crashing", () => {
    render(
      <SocketProvider>
        <p>child content</p>
      </SocketProvider>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("provides a socket instance to consumers via context", () => {
    render(
      <SocketProvider>
        <SocketConsumer />
      </SocketProvider>
    );
    expect(screen.getByTestId("socket-id").textContent).toBe("test-socket-id");
  });

  it("calls io() with the correct server URL and transports option", () => {
    const { io } = require("socket.io-client");
    render(
      <SocketProvider>
        <span />
      </SocketProvider>
    );
    expect(io).toHaveBeenCalledWith(
      "https://webrtc-p2p-server.onrender.com",
      expect.objectContaining({ transports: ["websocket"] })
    );
  });

  it("registers 'connect' and 'disconnect' event handlers on mount", () => {
    render(
      <SocketProvider>
        <span />
      </SocketProvider>
    );
    const events = mockSocket.on.mock.calls.map(([e]) => e);
    expect(events).toContain("connect");
    expect(events).toContain("disconnect");
  });

  it("calls socket.off for both events on unmount", () => {
    const { unmount } = render(
      <SocketProvider>
        <span />
      </SocketProvider>
    );
    unmount();
    const events = mockSocket.off.mock.calls.map(([e]) => e);
    expect(events).toContain("connect");
    expect(events).toContain("disconnect");
  });

  it("calls socket.disconnect on unmount when socket is connected", () => {
    const { unmount } = render(
      <SocketProvider>
        <span />
      </SocketProvider>
    );
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
