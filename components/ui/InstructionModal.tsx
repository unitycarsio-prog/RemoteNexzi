
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isLoading: boolean;
  children: React.ReactNode;
}

const InstructionModal: React.FC<InstructionModalProps> = ({ isOpen, onClose, title, isLoading, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-lg m-4 border border-gray-700 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-brand-text">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 text-brand-text-secondary min-h-[150px] flex items-center justify-center">
          {isLoading ? <LoadingSpinner /> : children}
        </div>
         <div className="p-4 border-t border-gray-600 text-right">
          <button 
            onClick={onClose} 
            className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructionModal;
