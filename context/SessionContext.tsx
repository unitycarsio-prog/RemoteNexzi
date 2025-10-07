import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SessionState, SessionContextType } from '../types';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// WebRTC configuration - using a public STUN server
const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// --- SIMULATED SIGNALING SERVICE ---
// In a real-world application, this would be a WebSocket server.
// BroadcastChannel allows communication between different tabs of the same origin.
const signalingChannel = new BroadcastChannel('remotenexzi-signaling');
// --- END SIMULATED SIGNALING SERVICE ---


const generateSessionId = () => {
  return Math.floor(100_000_000 + Math.random() * 900_000_000).toString();
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SessionState>({
    sessionId: '',
    isConnected: false,
    isConnecting: false,
    stream: null,
    remoteStream: null,
    error: null,
    role: null,
    incomingCall: null,
  });
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteSessionIdRef = useRef<string | null>(null);
  const navigate = useNavigate();

  const resetState = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
     if (state.remoteStream) {
      state.remoteStream.getTracks().forEach(track => track.stop());
    }

    setState(prevState => ({
      ...prevState,
      isConnected: false,
      isConnecting: false,
      stream: null,
      remoteStream: null,
      error: null,
      role: null,
      incomingCall: null,
      sessionId: generateSessionId(), // Regenerate ID for next session
    }));
    remoteSessionIdRef.current = null;
    navigate('/');
  }, [state.stream, state.remoteStream, navigate]);

  const endSession = useCallback(() => {
     if (remoteSessionIdRef.current) {
        signalingChannel.postMessage({ type: 'disconnect', target: remoteSessionIdRef.current });
     }
     resetState();
  }, [resetState]);

  useEffect(() => {
    const newSessionId = generateSessionId();
    setState(prevState => ({ ...prevState, sessionId: newSessionId }));

    const handleSignalingMessage = async (event: MessageEvent) => {
      const message = event.data;
      
      // Ignore messages not intended for this session
      if (message.target && message.target !== newSessionId) return;

      switch (message.type) {
        case 'offer':
          setState(prevState => ({ ...prevState, incomingCall: { from: message.from } }));
          remoteSessionIdRef.current = message.from;
          peerConnectionRef.current = new RTCPeerConnection(configuration);
          peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.offer));
          setupPeerConnectionListeners(peerConnectionRef.current);
          break;
        case 'answer':
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.answer));
          }
          break;
        case 'candidate':
          if (peerConnectionRef.current && message.candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
          break;
        case 'disconnect':
          resetState();
          break;
      }
    };

    signalingChannel.addEventListener('message', handleSignalingMessage);

    return () => {
      signalingChannel.removeEventListener('message', handleSignalingMessage);
      endSession();
    };
  }, []); // Effect runs only once on mount

  const setupPeerConnectionListeners = (pc: RTCPeerConnection) => {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingChannel.postMessage({
          type: 'candidate',
          target: remoteSessionIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = new MediaStream();
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
      setState(prevState => ({ ...prevState, remoteStream, isConnected: true, isConnecting: false }));
      navigate('/session');
    };
  };

  const connectToRemote = async (remoteId: string) => {
    setState(prevState => ({ ...prevState, isConnecting: true, error: null, role: 'viewer' }));
    remoteSessionIdRef.current = remoteId;

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;
    setupPeerConnectionListeners(pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    signalingChannel.postMessage({
      type: 'offer',
      target: remoteId,
      from: state.sessionId,
      offer: pc.localDescription,
    });
  };
  
  const acceptCall = async () => {
    if (!peerConnectionRef.current || !remoteSessionIdRef.current) return;
    
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      mediaStream.getTracks().forEach(track => peerConnectionRef.current!.addTrack(track, mediaStream));
      
      mediaStream.getVideoTracks()[0].onended = () => endSession();
      
      setState(prevState => ({ ...prevState, stream: mediaStream, incomingCall: null, role: 'sharer' }));
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      signalingChannel.postMessage({
        type: 'answer',
        target: remoteSessionIdRef.current,
        answer: peerConnectionRef.current.localDescription,
      });

      setState(prevState => ({ ...prevState, isConnected: true, isConnecting: false }));
      navigate('/session');

    } catch (err) {
      console.error("Failed to get display media:", err);
       const errorMessage = err instanceof Error && err.name === 'NotAllowedError'
        ? "Permission to share screen was denied."
        : "Failed to start screen sharing.";
      setState(prevState => ({ ...prevState, error: errorMessage, incomingCall: null }));
      rejectCall();
    }
  };

  const rejectCall = () => {
    // Optionally send a 'reject' message
    if (remoteSessionIdRef.current) {
        signalingChannel.postMessage({ type: 'disconnect', target: remoteSessionIdRef.current });
    }
    resetState();
  };

  return (
    <SessionContext.Provider value={{ ...state, connectToRemote, endSession, acceptCall, rejectCall }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
