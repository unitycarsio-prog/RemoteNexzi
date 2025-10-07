import React from 'react';

interface IncomingCallModalProps {
  isOpen: boolean;
  callerId: string;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ isOpen, callerId, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div 
        className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-sm m-4 border border-gray-700 text-center p-8"
      >
        <h2 className="text-2xl font-bold text-brand-text mb-2">Incoming Connection</h2>
        <p className="text-brand-text-secondary mb-6">
          User{' '}
          <span className="font-bold text-brand-accent tracking-wider">
            {callerId.replace(/(\d{3})/g, '$1 ').trim()}
          </span>{' '}
          wants to connect.
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={onDecline} 
            className="bg-brand-danger hover:bg-red-500 text-white font-bold py-2 px-8 rounded-md transition-colors"
          >
            Decline
          </button>
           <button 
            onClick={onAccept} 
            className="bg-brand-success hover:bg-green-500 text-white font-bold py-2 px-8 rounded-md transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
