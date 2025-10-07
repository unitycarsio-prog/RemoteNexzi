export type SessionRole = 'sharer' | 'viewer' | null;

export interface SessionState {
  sessionId: string;
  isConnected: boolean;
  isConnecting: boolean;
  stream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
  role: SessionRole;
  offerSdp: string | null;
  answerSdp: string | null;
}

export interface SessionContextType extends SessionState {
  createOffer: () => Promise<void>;
  createAnswer: (offer: string) => Promise<void>;
  acceptAnswer: (answer: string) => Promise<void>;
  endSession: () => void;
}
