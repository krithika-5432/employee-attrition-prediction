import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, BarChart2, Layers, Users, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: TrendingUp, title: 'Early Attrition Detection',
    desc: 'Identify employees who may be considering leaving before turnover becomes a reality.'
  },
  {
    icon: BarChart2, title: 'Attrition Factor Analysis',
    desc: 'Identify the key factors contributing to employee turnover and understand what influences attrition.'
  },
  {
    icon: ShieldCheck, title: 'Data-Driven Decisions',
    desc: 'Make informed talent management decisions backed by workforce insights and analytics.'
  },
  {
    icon: Layers, title: 'Multi-Model Intelligence',
    desc: 'Cross-verified predictions from multiple analytical models for more reliable attrition assessments.'
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#features') featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (window.location.hash === '#about') aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="min-h-screen flex items-center px-6 lg:px-20 pt-20">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Predict Employee Attrition{' '}
              <span className="gradient-text">Before It Happens</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Identify potential attrition early and take timely action to retain valuable employees.
            </p>
            <button
              onClick={() => navigate('/predict')}
              className="group inline-flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg glow-blue"
            >
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <HeroIllustration />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} className="py-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold mb-4 gradient-text">Platform Features</h2>
            <p className="text-slate-400 text-lg">Everything you need to understand and prevent employee attrition</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass glass-hover p-6 cursor-default"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-blue-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" ref={aboutRef} className="py-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Users size={28} className="text-blue-400" />
            </div>
            <h2 className="text-4xl font-bold mb-6">
              About <span className="gradient-text">Retainify</span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              Employee attrition is when employees leave an organization over time due to reasons such as career changes,
              relocation, higher education, or personal circumstances. While some employee turnover is normal, high attrition
              can increase hiring costs, reduce productivity, and affect team performance.
            </p>
            <p className="text-slate-400 text-lg leading-relaxed">
              Retainify helps organizations identify potential employee departures early. By analyzing workforce data,
              it enables HR teams to understand turnover patterns, improve retention efforts, and build a more stable workforce.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="relative">
      <div className="glass p-8 rounded-2xl glow-blue">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-400 text-sm">Attrition Risk Analysis</p>
            <p className="text-white font-bold text-2xl">127 Employees</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <BarChart2 size={22} className="text-blue-400" />
          </div>
        </div>
        <div className="space-y-4 mb-6">
          {[
            { label: 'Low Risk', pct: 68, color: 'bg-emerald-500' },
            { label: 'Moderate Risk', pct: 22, color: 'bg-amber-500' },
            { label: 'High Risk', pct: 10, color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">{item.label}</span>
                <span className="text-white font-medium">{item.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700">
                <motion.div
                  className={`h-2 rounded-full ${item.color}`}
                  initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Accuracy', val: '87.2%' },
            { label: 'Precision', val: '85.1%' },
            { label: 'F1 Score', val: '81.6%' },
          ].map(m => (
            <div key={m.label} className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-blue-400 font-bold text-lg">{m.val}</p>
              <p className="text-slate-500 text-xs">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -top-4 -right-4 glass p-4 rounded-xl glow-green">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">High Retention</p>
            <p className="text-emerald-400 text-xs">Employee Stable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
