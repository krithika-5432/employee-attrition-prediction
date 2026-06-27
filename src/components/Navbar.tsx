import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Menu, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface NavItem {
  label: string;
  path: string;
  hash?: string;
  locked?: boolean;
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const ctx = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const isHome = location.pathname === '/';

  // Changing this condition so pages unlock immediately once the dataset is uploaded
  const unlocked = ctx.datasetUploaded;

  const homeNav: NavItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/#features' },
    { label: 'About', path: '/#about' },
  ];

  const appNav: NavItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Dataset', path: '/dataset', locked: !unlocked },
    { label: 'Model Performance', path: '/performance', locked: !unlocked },
    { label: 'Batch Analysis', path: '/batch', locked: !unlocked },
    { label: 'Predict', path: '/predict' },
    { label: 'About', path: '/#about' },
  ];

  const navItems = isHome ? homeNav : appNav;

  const isActive = (item: NavItem) => {
    if (item.hash) return false;
    return location.pathname === item.path;
  };

  const handleNav = (item: NavItem) => {
    setMobileOpen(false);
    if (item.locked) return;
    if (item.path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const id = item.path.replace('/#', '');
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(item.path);
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-navy-900/95 backdrop-blur-lg border-b border-slate-800' : 'bg-transparent'}`}
      initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-20 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Brain size={18} className="text-blue-400" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Retainify</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => handleNav(item)}
              disabled={item.locked}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.locked
                ? 'text-slate-600 cursor-not-allowed opacity-40'
                : isActive(item)
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile */}
        <button className="md:hidden text-slate-300" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div className="md:hidden bg-navy-800/95 backdrop-blur-lg border-t border-slate-800 px-6 py-4 space-y-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => handleNav(item)} disabled={item.locked} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.locked ? 'text-slate-600 opacity-40' : isActive(item) ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
}