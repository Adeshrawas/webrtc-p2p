import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../Providers/Socket";
import { usePeer } from "../Providers/peer";

const RoomPage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    setRemoteAnswer,
    createAnswer,
    sendStream,
    remoteStream,
  } = usePeer();

  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Get user's camera & mic
  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      sendStream(stream);
    } catch (err) {
      console.error("❌ Failed to get user media:", err);
    }
  }, [sendStream]);

  // Toggle mic
  const toggleMic = () => {
    if (!myStream) return;
    myStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  };

  // Toggle camera
  const toggleCam = () => {
    if (!myStream) return;
    myStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  };

  // Leave room
  const handleLeave = () => {
    myStream?.getTracks().forEach((t) => t.stop());
    navigate("/");
  };

  // When someone joins your room, send offer
  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      console.log("👤 New user joined:", emailId);
      setRemoteEmailId(emailId);
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
    },
    [createOffer, socket]
  );

  // When you receive an offer
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log("📞 Incoming offer from:", from);
      setRemoteEmailId(from);
      const answer = await createAnswer(offer);
      socket.emit("call-accepted", { emailId: from, ans: answer });
    },
    [createAnswer, socket]
  );

  // When your offer is accepted
  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      console.log("✅ Call accepted");
      await setRemoteAnswer(ans);
    },
    [setRemoteAnswer]
  );

  // Attach remote stream to video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Bind socket events
  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted]);

  // On mount, get media
  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  // Renegotiation
  useEffect(() => {
    const handleNegotiation = async () => {
      try {
        const offer = await createOffer();
        if (remoteEmailId) socket.emit("call-user", { emailId: remoteEmailId, offer });
      } catch (err) {
        console.error("❌ Negotiation failed:", err);
      }
    };
    peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => peer.removeEventListener("negotiationneeded", handleNegotiation);
  }, [peer, remoteEmailId, createOffer, socket]);

  return (
    <div className="room-page-container">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="room-header glass-card">
        <div className="room-brand">
          <span>📹</span> WebRTC Call
          <div className="room-brand-dot" />
        </div>

        {remoteEmailId ? (
          <span className="status-badge connected">Connected · {remoteEmailId}</span>
        ) : (
          <span className="status-badge waiting">Waiting for peer…</span>
        )}
      </div>

      {/* ── Video grid ─────────────────────────────────────────────────── */}
      <div className="video-grid">
        {/* My video */}
        <div className="video-card glass-card">
          {myStream ? (
            <>
              <video ref={myVideoRef} autoPlay muted playsInline />
              <span className="video-label">You</span>
            </>
          ) : (
            <div className="video-placeholder">
              <div className="avatar">👤</div>
              <span>Starting camera…</span>
            </div>
          )}
        </div>

        {/* Remote video */}
        <div className="video-card glass-card">
          {remoteStream ? (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline />
              <span className="video-label">{remoteEmailId ?? "Remote"}</span>
            </>
          ) : (
            <div className="video-placeholder">
              <div className="avatar">🙋</div>
              <span>{remoteEmailId ? "Connecting…" : "Waiting for peer"}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="controls-bar glass-card">
        <button className="ctrl-btn" onClick={toggleMic} title="Toggle mic">
          {micOn ? "🎤" : "🔇"}
          <span className="ctrl-label">{micOn ? "Mute" : "Unmute"}</span>
        </button>

        <button className="ctrl-btn" onClick={toggleCam} title="Toggle camera">
          {camOn ? "📷" : "🚫"}
          <span className="ctrl-label">{camOn ? "Camera" : "Off"}</span>
        </button>

        <button className="ctrl-btn danger" onClick={handleLeave} title="Leave room">
          📵
          <span className="ctrl-label">Leave</span>
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
