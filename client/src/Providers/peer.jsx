import React, { useMemo, useContext, useEffect, useState, useCallback } from "react";

const PeerContext = React.createContext(null);

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null);

  const peer = useMemo(() =>
    new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    }), []
  );

  const createOffer = async () => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error("❌ Failed to create offer:", error);
    }
  };

  const createAnswer = async (offer) => {
    try {
      // Defensive parse in case it's stringified from server
      const parsedOffer = typeof offer === "string" ? JSON.parse(offer) : offer;

      if (peer.signalingState !== "stable") {
        console.warn("🚧 Peer not in stable state, skipping setRemoteDescription");
      } else {
        await peer.setRemoteDescription(new RTCSessionDescription(parsedOffer));
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error("❌ Failed to create answer:", error);
    }
  };

  const setRemoteAnswer = async (answer) => {
    try {
      const parsedAnswer = typeof answer === "string" ? JSON.parse(answer) : answer;

      // Avoid calling setRemoteDescription if already in stable state
      if (peer.signalingState !== "stable") {
        await peer.setRemoteDescription(new RTCSessionDescription(parsedAnswer));
      } else {
        console.warn("⚠️ setRemoteAnswer skipped: already in stable state.");
      }
    } catch (error) {
      console.error("❌ Failed to set remote answer:", error);
    }
  };

  const sendStream = (stream) => {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      peer.addTrack(track, stream);
    }
  };

  const handleTrackEvent = useCallback((ev) => {
    const streams = ev.streams;
    if (streams && streams[0]) {
      setRemoteStream(streams[0]);
    }
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📡 ICE candidate generated:", event.candidate);
        // You can emit this to the server if needed
      }
    };

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [handleTrackEvent, peer]);

  const addIceCandidate = async (candidate) => {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("❌ Failed to add ICE candidate:", error);
    }
  };

  return (
    <PeerContext.Provider value={{
      peer,
      createOffer,
      createAnswer,
      setRemoteAnswer,
      addIceCandidate,
      sendStream,
      remoteStream
    }}>
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => useContext(PeerContext);
