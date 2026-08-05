import { render, screen, act } from "@testing-library/react";
import { PeerProvider, usePeer } from "../Providers/peer";

// ── Mock factory ───────────────────────────────────────────────────────────
// Re-created in beforeEach so CRA's automatic mockReset() between tests
// never leaves RTCPeerConnection with a wiped implementation.

let mockPeer;

beforeEach(() => {
  mockPeer = {
    createOffer: jest.fn().mockResolvedValue({ type: "offer", sdp: "mock-offer-sdp" }),
    createAnswer: jest.fn().mockResolvedValue({ type: "answer", sdp: "mock-answer-sdp" }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    addTrack: jest.fn(),
    addIceCandidate: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    signalingState: "stable",
    onicecandidate: null,
  };

  global.RTCPeerConnection = jest.fn(() => mockPeer);
  global.RTCSessionDescription = jest.fn((init) => init);
  global.RTCIceCandidate = jest.fn((init) => init);
});

// ── Helper consumer ────────────────────────────────────────────────────────
const PeerConsumer = ({ onContext }) => {
  const ctx = usePeer();
  onContext(ctx);
  return <div data-testid="peer-consumer">ready</div>;
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe("PeerProvider", () => {
  it("renders children without crashing", () => {
    render(
      <PeerProvider>
        <p>child</p>
      </PeerProvider>
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("exposes required API via context", () => {
    let ctx;
    render(
      <PeerProvider>
        <PeerConsumer onContext={(c) => { ctx = c; }} />
      </PeerProvider>
    );

    ["peer", "createOffer", "createAnswer", "setRemoteAnswer", "sendStream", "addIceCandidate", "remoteStream"]
      .forEach((key) => expect(ctx).toHaveProperty(key));
  });

  it("createOffer calls peer.createOffer and peer.setLocalDescription", async () => {
    let ctx;
    render(
      <PeerProvider>
        <PeerConsumer onContext={(c) => { ctx = c; }} />
      </PeerProvider>
    );

    let offer;
    await act(async () => { offer = await ctx.createOffer(); });

    expect(mockPeer.createOffer).toHaveBeenCalled();
    expect(mockPeer.setLocalDescription).toHaveBeenCalledWith({ type: "offer", sdp: "mock-offer-sdp" });
    expect(offer).toEqual({ type: "offer", sdp: "mock-offer-sdp" });
  });

  it("createAnswer skips setRemoteDescription when peer is not in stable state", async () => {
    mockPeer.signalingState = "have-local-offer";
    let ctx;
    render(
      <PeerProvider>
        <PeerConsumer onContext={(c) => { ctx = c; }} />
      </PeerProvider>
    );

    await act(async () => { await ctx.createAnswer({ type: "offer", sdp: "sdp" }); });

    expect(mockPeer.setRemoteDescription).not.toHaveBeenCalled();
  });

  it("createAnswer calls setRemoteDescription when peer is in stable state", async () => {
    // mockPeer.signalingState is already "stable" (set in beforeEach)
    let ctx;
    render(
      <PeerProvider>
        <PeerConsumer onContext={(c) => { ctx = c; }} />
      </PeerProvider>
    );

    await act(async () => { await ctx.createAnswer({ type: "offer", sdp: "sdp" }); });

    expect(mockPeer.setRemoteDescription).toHaveBeenCalled();
    expect(mockPeer.setLocalDescription).toHaveBeenCalled();
  });

  it("setRemoteAnswer calls peer.setRemoteDescription when NOT in stable state", async () => {
    mockPeer.signalingState = "have-local-offer";
    let ctx;
    render(
      <PeerProvider>
        <PeerConsumer onContext={(c) => { ctx = c; }} />
      </PeerProvider>
    );

    await act(async () => { await ctx.setRemoteAnswer({ type: "answer", sdp: "sdp" }); });

    expect(mockPeer.setRemoteDescription).toHaveBeenCalled();
  });

  it("sendStream adds all tracks to the peer connection", () => {
    const mockTrack1 = { kind: "video" };
    const mockTrack2 = { kind: "audio" };
    const mockStream = { getTracks: jest.fn(() => [mockTrack1, mockTrack2]) };

    let ctx;
    render(
      <PeerProvider>
        <PeerConsumer onContext={(c) => { ctx = c; }} />
      </PeerProvider>
    );

    ctx.sendStream(mockStream);

    expect(mockPeer.addTrack).toHaveBeenCalledWith(mockTrack1, mockStream);
    expect(mockPeer.addTrack).toHaveBeenCalledWith(mockTrack2, mockStream);
  });

  it("addIceCandidate calls peer.addIceCandidate", async () => {
    let ctx;
    render(
      <PeerProvider>
        <PeerConsumer onContext={(c) => { ctx = c; }} />
      </PeerProvider>
    );

    await act(async () => {
      await ctx.addIceCandidate({ candidate: "candidate:1 udp" });
    });

    expect(mockPeer.addIceCandidate).toHaveBeenCalled();
  });

  it("registers and removes the 'track' event listener on mount/unmount", () => {
    const { unmount } = render(
      <PeerProvider>
        <span />
      </PeerProvider>
    );

    expect(mockPeer.addEventListener).toHaveBeenCalledWith("track", expect.any(Function));

    unmount();

    expect(mockPeer.removeEventListener).toHaveBeenCalledWith("track", expect.any(Function));
  });
});
