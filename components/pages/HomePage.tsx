import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { getHelpfulTips } from '../../services/geminiService';
import LoadingSpinner from '../ui/LoadingSpinner';
import InstructionModal from '../ui/InstructionModal';
import IncomingCallModal from '../ui/IncomingCallModal';

const IdCard: React.FC<{ sessionId: string }> = ({ sessionId }) => (
  <div className="bg-brand-secondary p-6 rounded-lg text-center">
    <h3 className="text-lg font-semibold text-brand-text-secondary mb-2">Your Address</h3>
    <div className="text-4xl font-bold tracking-widest text-brand-text bg-brand-primary py-3 px-4 rounded-md">
      {sessionId.replace(/(\d{3})/g, '$1 ').trim()}
    </div>
  </div>
);

const ConnectForm: React.FC<{ onConnect: (id: string) => void; isConnecting: boolean; }> = ({ onConnect, isConnecting }) => {
  const [remoteId, setRemoteId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (remoteId.trim() && !isConnecting) {
      onConnect(remoteId.replace(/\s/g, ''));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-brand-text-secondary mb-3">Enter Remote Address</h3>
      <input
        type="text"
        value={remoteId}
        onChange={(e) => setRemoteId(e.target.value)}
        placeholder="e.g. 123 456 789"
        className="w-full bg-brand-primary border border-gray-600 rounded-md p-3 text-lg text-center text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        disabled={isConnecting}
      />
      <button
        type="submit"
        className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-4 rounded-md mt-4 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isConnecting || !remoteId.trim()}
      >
        {isConnecting ? <LoadingSpinner /> : 'Connect'}
      </button>
    </form>
  );
};


const HomePage: React.FC = () => {
  const { sessionId, connectToRemote, isConnecting, error, incomingCall, acceptCall, rejectCall } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleShowInstructions = async () => {
    setIsModalOpen(true);
    setIsModalLoading(true);
    setModalContent({ title: 'Understanding Your Session ID', content: ''});
    try {
      const tips = await getHelpfulTips('session_id');
      setModalContent({ title: 'Understanding Your Session ID', content: tips });
    } catch (err) {
      setModalContent({ title: 'Error', content: 'Could not load helpful tips at this time.' });
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 bg-black bg-opacity-20 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl">
        <div className="grid md:grid-cols-2 gap-8">
          <IdCard sessionId={sessionId} />
          <ConnectForm onConnect={connectToRemote} isConnecting={isConnecting} />
        </div>
        {error && <p className="text-brand-danger text-center mt-4">{error}</p>}
        <div className="text-center mt-8">
          <button 
            onClick={handleShowInstructions}
            className="text-brand-accent hover:underline"
          >
            What is "Your Address"?
          </button>
        </div>
      </div>
      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent.title}
        isLoading={isModalLoading}
      >
        <p>{modalContent.content}</p>
      </InstructionModal>
      <IncomingCallModal 
        isOpen={!!incomingCall}
        callerId={incomingCall?.from || ''}
        onAccept={acceptCall}
        onDecline={rejectCall}
      />
    </>
  );
};

export default HomePage;
