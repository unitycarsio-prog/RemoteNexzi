import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import LoadingSpinner from './LoadingSpinner';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'viewer' | 'sharer';
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, mode }) => {
  const { isConnecting, error, offerSdp, createOffer, acceptAnswer, createAnswer } = useSession();
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy Code');

  useEffect(() => {
    if (isOpen && mode === 'viewer' && step === 1 && !offerSdp) {
      createOffer();
    }
  }, [isOpen, mode, step, offerSdp, createOffer]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setStep(1);
      setInputValue('');
      setCopyButtonText('Copy Code');
    }
  }, [isOpen]);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy Code'), 2000);
  };

  const handleAcceptOffer = async () => {
    if (inputValue.trim()) {
      await createAnswer(inputValue.trim());
      // The context will handle navigation on success
    }
  };

  const handleAcceptAnswer = async () => {
    if (inputValue.trim()) {
        await acceptAnswer(inputValue.trim());
        // Context handles navigation
    }
  };

  if (!isOpen) return null;

  const renderViewerContent = () => {
    return (
      <>
        {/* Step 1: Show Offer */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <h3 className="text-lg font-semibold text-brand-text mb-2">1. Send this offer code</h3>
          <p className="text-brand-text-secondary mb-4">Copy this code and send it to the person who will be sharing their screen.</p>
          <div className="relative">
            <textarea
              readOnly
              value={isConnecting && !offerSdp ? 'Generating code...' : offerSdp || ''}
              className="w-full h-32 bg-brand-primary p-2 border border-gray-600 rounded-md text-xs text-brand-text-secondary resize-none"
            />
            {isConnecting && !offerSdp && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner /></div>}
          </div>
          <button 
            onClick={() => offerSdp && handleCopy(offerSdp)}
            disabled={!offerSdp}
            className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded mt-2 disabled:opacity-50"
          >
            {copyButtonText}
          </button>
          <button onClick={() => setStep(2)} disabled={!offerSdp} className="w-full mt-2 text-brand-accent hover:underline disabled:opacity-50">Next Step</button>
        </div>

        {/* Step 2: Accept Answer */}
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <button onClick={() => setStep(1)} className="text-brand-accent hover:underline mb-4 text-sm">&larr; Back to Step 1</button>
            <h3 className="text-lg font-semibold text-brand-text mb-2">2. Paste their answer code</h3>
            <p className="text-brand-text-secondary mb-4">Once they send you a code back, paste it here to connect.</p>
            <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste answer code here"
                className="w-full h-32 bg-brand-primary p-2 border border-gray-600 rounded-md text-xs text-brand-text-secondary resize-none"
            />
            <button onClick={handleAcceptAnswer} disabled={!inputValue.trim() || isConnecting} className="w-full bg-brand-success hover:bg-green-500 text-white font-bold py-3 px-4 rounded mt-2 disabled:opacity-50 flex justify-center items-center">
                {isConnecting ? <LoadingSpinner/> : "Connect"}
            </button>
        </div>
      </>
    );
  };
  
  const renderSharerContent = () => {
    return (
      <div>
        <h3 className="text-lg font-semibold text-brand-text mb-2">Accept a Connection</h3>
        <p className="text-brand-text-secondary mb-4">Paste the offer code you received to start sharing your screen.</p>
        <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste offer code here"
            className="w-full h-32 bg-brand-primary p-2 border border-gray-600 rounded-md text-xs text-brand-text-secondary resize-none"
        />
        <button onClick={handleAcceptOffer} disabled={!inputValue.trim() || isConnecting} className="w-full bg-brand-success hover:bg-green-500 text-white font-bold py-3 px-4 rounded mt-2 disabled:opacity-50 flex justify-center items-center">
            {isConnecting ? <LoadingSpinner/> : "Accept & Share Screen"}
        </button>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-lg m-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-brand-text">{mode === 'viewer' ? 'Connect to Remote Device' : 'Accept a Connection'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {mode === 'viewer' ? renderViewerContent() : renderSharerContent()}
          {error && <p className="text-brand-danger text-center text-sm mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
