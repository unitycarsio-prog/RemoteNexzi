import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { getHelpfulTips } from '../../services/geminiService';
import InstructionModal from '../ui/InstructionModal';
import ConnectionModal from '../ui/ConnectionModal';

const HomePage: React.FC = () => {
  const { error } = useSession();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpModalContent, setHelpModalContent] = useState({ title: '', content: '' });
  const [isHelpModalLoading, setIsHelpModalLoading] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectMode, setConnectMode] = useState<'viewer' | 'sharer' | null>(null);

  const handleShowInstructions = async () => {
    setIsHelpModalOpen(true);
    setIsHelpModalLoading(true);
    setHelpModalContent({ title: 'How to Connect', content: ''});
    try {
      const tips = await getHelpfulTips('session_id'); // Re-using prompt, can be updated
      setHelpModalContent({ title: 'How to Connect', content: tips });
    } catch (err) {
      setHelpModalContent({ title: 'Error', content: 'Could not load helpful tips at this time.' });
    } finally {
      setIsHelpModalLoading(false);
    }
  };

  const openConnectModal = (mode: 'viewer' | 'sharer') => {
    setConnectMode(mode);
    setIsConnectModalOpen(true);
  };

  const closeConnectModal = () => {
    setIsConnectModalOpen(false);
    setConnectMode(null);
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto p-4 md:p-8 bg-black bg-opacity-20 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl text-center">
        <h2 className="text-3xl font-bold text-brand-text mb-4">Start a Secure Session</h2>
        <p className="text-brand-text-secondary mb-8">
          Connect to another device by creating a connection offer, or accept one to share your screen.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => openConnectModal('viewer')}
            className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors duration-200 disabled:opacity-50"
          >
            Connect to Remote Device
          </button>
          <button
            onClick={() => openConnectModal('sharer')}
            className="bg-brand-secondary hover:bg-gray-700 border border-gray-600 text-brand-text font-bold py-4 px-6 rounded-lg text-lg transition-colors duration-200 disabled:opacity-50"
          >
            Accept a Connection
          </button>
        </div>
        {error && <p className="text-brand-danger text-center mt-6">{error}</p>}
        <div className="text-center mt-8">
          <button 
            onClick={handleShowInstructions}
            className="text-brand-accent hover:underline"
          >
            How does this work?
          </button>
        </div>
      </div>
      <InstructionModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title={helpModalContent.title}
        isLoading={isHelpModalLoading}
      >
        <p>{helpModalContent.content}</p>
      </InstructionModal>
      {connectMode && (
         <ConnectionModal 
            isOpen={isConnectModalOpen}
            onClose={closeConnectModal}
            mode={connectMode}
        />
      )}
    </>
  );
};

export default HomePage;
