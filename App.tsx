
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import HomePage from './components/pages/HomePage';
import SessionPage from './components/pages/SessionPage';
import Header from './components/ui/Header';

const App: React.FC = () => {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-brand-primary flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/session" element={<SessionPage />} />
          </Routes>
        </main>
      </div>
    </SessionProvider>
  );
};

export default App;