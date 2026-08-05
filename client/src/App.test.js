// Smoke test – verifies the app mounts without crashing.
// Full integration tests live in src/__tests__/App.test.js.

// ── socket.io-client mock ────────────────────────────────────────────────────
// CRA resets mock implementations between tests, so we declare io as a plain
// jest.fn() and re-wire its return value in beforeEach (same pattern used in
// SocketProvider.test.js which already passes).
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'smoke-socket-id',
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

beforeEach(() => {
  // Re-wire socket mock so CRA resets never leave io() returning undefined
  Object.assign(mockSocket, {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'smoke-socket-id',
  });
  const { io } = require('socket.io-client');
  io.mockReturnValue(mockSocket);

  global.RTCPeerConnection = jest.fn(() => ({
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: '' }),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: '' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    addTrack: jest.fn(),
    addIceCandidate: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    signalingState: 'stable',
    onicecandidate: null,
  }));
  global.RTCSessionDescription = jest.fn((init) => init);
  global.RTCIceCandidate = jest.fn((init) => init);
});

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders the WebRTC app without crashing', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: /webrtc video call/i })).toBeInTheDocument();
});
