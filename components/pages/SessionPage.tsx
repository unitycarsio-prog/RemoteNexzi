import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';

const SessionToolbar: React.FC<{ onDisconnect: () => void }> = ({ onDisconnect }) => (
  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 backdrop-blur-md p-3 rounded-full flex items-center gap-4 shadow-lg border border-gray-700">
    <button
      onClick={onDisconnect}
      className="bg-brand-danger hover:bg-red-500 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200"
    >
      Disconnect
    </button>
  </div>
);

const SessionPage: React.FC = () => {
  const { isConnected, stream, remoteStream, endSession, role } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    let streamToDisplay: MediaStream | null = null;
    if (role === 'viewer' && remoteStream) {
        streamToDisplay = remoteStream;
    } else if (role === 'sharer' && stream) {
        streamToDisplay = stream;
    }

    if (videoRef.current && streamToDisplay) {
      videoRef.current.srcObject = streamToDisplay;
    }

  }, [isConnected, stream, remoteStream, role, navigate]);

  if (!isConnected) {
    return null; // or a loading/redirecting indicator
  }

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-w-full max-h-full"
        // Mute the sharer's own video preview to prevent audio feedback
        muted={role === 'sharer'} 
      />
      <SessionToolbar onDisconnect={endSession} />
    </div>
  );
};

export default SessionPage;
