import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PredictPage from './pages/PredictPage';
import DatasetPage from './pages/DatasetPage';
import PerformancePage from './pages/PerformancePage';
import BatchPage from './pages/BatchPage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/dataset" element={<DatasetPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/batch" element={<BatchPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0a0f1e] text-slate-100">
          {/* Subtle background grid */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Radial glow top-left */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 10% 0%, rgba(59,130,246,0.07) 0%, transparent 70%)',
            }}
          />
          <Navbar />
          <main className="relative">
            <AnimatedRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
