import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

// ── Mocks ──────────────────────────────────────────────────────────────────
// CRA resets mock implementations between tests, so we declare io as a plain
// jest.fn() and re-wire its return value in beforeEach (same pattern used in
// SocketProvider.test.js which already passes).
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: "mock-socket-id",
};

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

// RTCPeerConnection is NOT available in jsdom. Re-create in beforeEach so
// CRA's automatic mockReset() between tests doesn't wipe the implementation.
beforeEach(() => {
  // Re-wire socket mock so CRA resets never leave io() returning undefined
  Object.assign(mockSocket, {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: "mock-socket-id",
  });
  const { io } = require("socket.io-client");
  io.mockReturnValue(mockSocket);

  global.RTCPeerConnection = jest.fn(() => ({
    createOffer: jest.fn().mockResolvedValue({ type: "offer", sdp: "" }),
    createAnswer: jest.fn().mockResolvedValue({ type: "answer", sdp: "" }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    addTrack: jest.fn(),
    addIceCandidate: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    signalingState: "stable",
    onicecandidate: null,
  }));
  global.RTCSessionDescription = jest.fn((init) => init);
  global.RTCIceCandidate = jest.fn((init) => init);
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe("App routing", () => {
  it("renders the homepage (/) by default", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /webrtc video call/i })
    ).toBeInTheDocument();
  });

  it("renders 404 page for an unknown route", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-path"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/404 - page not found/i)).toBeInTheDocument();
  });
});
