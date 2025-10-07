export type SessionRole = 'sharer' | 'viewer' | null;

export interface SessionState {
  sessionId: string;
  isConnected: boolean;
  isConnecting: boolean;
  stream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
  role: SessionRole;
  incomingCall: { from: string } | null;
}

export interface SessionContextType extends SessionState {
  connectToRemote: (remoteId: string) => Promise<void>;
  endSession: () => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
}
