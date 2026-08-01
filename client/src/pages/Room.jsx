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
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);

  // Get user's camera & mic
  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      sendStream(stream);
    } catch (err) {
      console.error("❌ Failed to get user media:", err);
    }
  }, [sendStream]);

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

  // Re-send offer if renegotiation is triggered
  useEffect(() => {
    const handleNegotiation = async () => {
      try {
        const offer = await createOffer();
        if (remoteEmailId) {
          socket.emit("call-user", { emailId: remoteEmailId, offer });
        }
      } catch (err) {
        console.error("❌ Negotiation failed:", err);
      }
    };

    peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [peer, remoteEmailId, createOffer, socket]);

  return (
    <div className="room-page-container">
      <h1>Room Page</h1>
      {remoteEmailId ? (
        <h3 style={{ color: "#4caf50" }}>Connected to: {remoteEmailId}</h3>
      ) : (
        <h3 style={{ color: "#ff9800" }}>Waiting for someone to join...</h3>
      )}

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div>
          <h4>My Video</h4>
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "300px", borderRadius: "12px" }}
          />
        </div>
        <div>
          <h4>Remote Video</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "300px", borderRadius: "12px" }}
          />
        </div>
      </div>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          borderRadius: "8px",
          backgroundColor: "#e53935",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Leave Room
      </button>
    </div>
  );
};

export default RoomPage;
