import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SessionState, SessionContextType } from '../types';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const generateSessionId = () => {
  return Math.floor(100_000_000 + Math.random() * 900_000_000).toString();
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SessionState>({
    sessionId: generateSessionId(),
    isConnected: false,
    isConnecting: false,
    stream: null,
    remoteStream: null,
    error: null,
    role: null,
    offerSdp: null,
    answerSdp: null,
  });
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const navigate = useNavigate();

  const endSession = useCallback(() => {
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

    setState({
      sessionId: generateSessionId(),
      isConnected: false,
      isConnecting: false,
      stream: null,
      remoteStream: null,
      error: null,
      role: null,
      offerSdp: null,
      answerSdp: null,
    });
    navigate('/');
  }, [state.stream, state.remoteStream, navigate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (state.isConnected) {
        endSession();
      }
    };
  }, [state.isConnected, endSession]);


  const setupPeerConnectionListeners = (pc: RTCPeerConnection) => {
    pc.ontrack = (event) => {
      const remoteStream = new MediaStream();
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
      setState(prevState => ({ ...prevState, remoteStream, isConnected: true, isConnecting: false }));
      navigate('/session');
    };

    // Other listeners like onconnectionstatechange can be added here for more robust handling
  };
  
  const createOffer = async () => {
    try {
      setState(prevState => ({ ...prevState, isConnecting: true, error: null, role: 'viewer' }));

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;
      setupPeerConnectionListeners(pc);

      const iceGatheringPromise = new Promise<void>(resolve => {
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          }
        };
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await iceGatheringPromise;

      setState(prevState => ({ ...prevState, offerSdp: JSON.stringify(pc.localDescription) }));
    } catch (err) {
      console.error("Failed to create offer:", err);
      setState(prevState => ({...prevState, error: "Failed to create connection offer.", isConnecting: false}));
    }
  };
  
  const createAnswer = async (offerSdp: string) => {
    try {
      setState(prevState => ({ ...prevState, isConnecting: true, error: null, role: 'sharer' }));
      const offer = JSON.parse(offerSdp);

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;
      setupPeerConnectionListeners(pc);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));
      mediaStream.getVideoTracks()[0].onended = () => endSession();
      
      setState(prevState => ({...prevState, stream: mediaStream}));

      const iceGatheringPromise = new Promise<void>(resolve => {
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          }
        };
      });
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await iceGatheringPromise;
      
      setState(prevState => ({ ...prevState, answerSdp: JSON.stringify(pc.localDescription), isConnected: true, isConnecting: false }));
      navigate('/session');
      
    } catch (err) {
      console.error("Failed to create answer:", err);
       const errorMessage = err instanceof Error && err.name === 'NotAllowedError'
        ? "Permission to share screen was denied."
        : "Failed to create connection answer. The offer code may be invalid.";
      setState(prevState => ({ ...prevState, error: errorMessage, isConnecting: false }));
    }
  };

  const acceptAnswer = async (answerSdp: string) => {
    if (!peerConnectionRef.current) {
      setState(prevState => ({...prevState, error: "Connection not initialized."}));
      return;
    }
    try {
      const answer = JSON.parse(answerSdp);
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      // ontrack listener will handle navigation
    } catch (err) {
      console.error("Failed to accept answer:", err);
      setState(prevState => ({...prevState, error: "Failed to connect. The answer code may be invalid."}));
    }
  };


  return (
    <SessionContext.Provider value={{ ...state, createOffer, createAnswer, acceptAnswer, endSession }}>
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