import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, ChevronDown, Minus, Plus, AlertTriangle, TrendingUp, Activity, DollarSign, Users, Zap, BarChart2, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { uploadDataset, predict, simulate } from '../services/api';

const safeString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(v => safeString(v)).join(' ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value || '');
};

const modelOptions = [
  { value: 'xgboost', label: 'XGBoost', sub: 'Reliable and Balanced Predictions' },
  { value: 'random_forest', label: 'Random Forest', sub: 'Comprehensive Risk Detection' },
  { value: 'logistic_regression', label: 'Logistic Regression', sub: 'Clear and Transparent Results' },
];

const defaultForm: any = {
  age: 30, gender: 'Male', maritalStatus: 'Single', distanceFromHome: 10,
  department: 'Sales', jobRole: 'Sales Executive', monthlyIncome: 5000,
  businessTravel: 'Travel_Rarely', overtime: 'No', stockOptionLevel: 0,
  workLifeBalance: 2, jobSatisfaction: 2, environmentSatisfaction: 2,
  yearsAtCompany: 3, yearsInCurrentRole: 2, yearsSinceLastPromotion: 1,
  yearsWithCurrManager: 2, totalWorkingYears: 8, education: 3,
  jobInvolvement: 3, jobLevel: 2, numCompaniesWorked: 2, percentSalaryHike: 12,
  performanceRating: 3, relationshipSatisfaction: 3, trainingTimesLastYear: 2,
  dailyRate: 800, hourlyRate: 65, monthlyRate: 14000,
};

export default function PredictPage() {
  const ctx = useAppContext();
  const [form, setForm] = useState<any>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [simResult, setSimResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setFileError('Please upload a CSV or Excel file.');
      return;
    }
    setFileError('');
    setUploadLoading(true);
    try {
      const res = await uploadDataset(file);
      ctx.setDatasetInfo(res.data);
      ctx.setDatasetUploaded(true);
    } catch (e: any) {
      const msg = e?.response?.data?.detail
        || (e?.code === 'ERR_NETWORK' ? 'Cannot reach backend. Make sure FastAPI is running on http://localhost:8000' : e?.message)
        || 'Upload failed.';
      setFileError(msg);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await predict({ ...form, model: ctx.selectedModel });
      ctx.setPredictionResult(res.data);
      ctx.setPredictionInput(form);
      ctx.setPredictionDone(true);
      setSimResult(null);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      let msg = 'Prediction failed.';
      if (Array.isArray(detail)) {
        msg = detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
      } else if (typeof detail === 'string') {
        msg = detail;
      } else if (e?.message) {
        msg = e.message;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (newForm: any) => {
    try {
      const res = await simulate({ ...newForm, model: ctx.selectedModel });
      setSimResult(res.data);
    } catch { }
  };

  const result = ctx.predictionResult;
  const simData = simResult || (result ? {
    probability: result.probability,
    risk_category: result.risk_category,
    risk_status: result.risk_status,
    risk_score: result.risk_score,
    business_metrics: result.business_metrics,
    guidance: result.recommendations,
  } : null);

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-20 pb-20">
      {/* Upload Overlay */}
      <AnimatePresence>
        {!ctx.datasetUploaded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-[#0a0f1e]/90 backdrop-blur-md" />
            <motion.div
              className="relative glass p-10 max-w-md w-full mx-6 text-center"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            >
              {uploadLoading ? (
                <div className="py-8">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white font-semibold text-lg">Processing dataset...</p>
                  <p className="text-slate-400 text-sm mt-1">Validating and loading data</p>
                </div>
              ) : (
                <>
                  <div
                    className={`border-2 border-dashed rounded-xl p-10 transition-all duration-300 cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-blue-500/50'}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                  >
                    <CloudUpload size={48} className="text-blue-400 mx-auto mb-4" />
                    <p className="text-white font-semibold text-lg mb-1">Upload Your Dataset</p>
                    <p className="text-slate-400 text-sm mb-2">Drag and drop your CSV or Excel file here</p>
                    <p className="text-slate-500 text-xs">Supports standard HR dataset templates (.csv, .xlsx)</p>
                  </div>
                  {fileError && (
                    <div className="mt-3 flex items-start gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-3 text-left">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
                  />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={!ctx.datasetUploaded ? 'filter blur-sm pointer-events-none select-none' : ''}>
        <motion.div className="max-w-7xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3 gradient-text">Employee Attrition Prediction</h1>
            <p className="text-slate-400">Fill in employee details below to generate an attrition risk assessment.</p>
          </div>

          {!result ? (
            /* ── BEFORE PREDICTION: centered form ── */
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Model Selection */}
              <div className="glass p-6">
                <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <Activity size={18} className="text-blue-400" />Intelligence Model
                </h2>
                <p className="text-slate-400 text-sm mb-4">Select the machine learning model for prediction.</p>
                <div className="space-y-2">
                  {modelOptions.map(m => (
                    <button key={m.value} onClick={() => ctx.setSelectedModel(m.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${ctx.selectedModel === m.value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-800/20'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${ctx.selectedModel === m.value ? 'text-blue-400' : 'text-white'}`}>{m.label}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{m.sub}</p>
                        </div>
                        {ctx.selectedModel === m.value && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Profile */}
              <div className="glass p-6">
                <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <Users size={18} className="text-blue-400" />Personal Profile
                </h2>
                <p className="text-slate-400 text-sm mb-4">Basic employee demographic information.</p>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Age" value={form.age} onChange={(v: number) => setForm((f: any) => ({ ...f, age: v }))} min={18} max={65} />
                  <SelectInput label="Gender" value={form.gender} onChange={(v: string) => setForm((f: any) => ({ ...f, gender: v }))} options={['Male', 'Female', 'Other']} />
                  <SelectInput label="Marital Status" value={form.maritalStatus} onChange={(v: string) => setForm((f: any) => ({ ...f, maritalStatus: v }))} options={['Single', 'Married', 'Divorced']} />
                  <NumberInput label="Distance from Home (km)" value={form.distanceFromHome} onChange={(v: number) => setForm((f: any) => ({ ...f, distanceFromHome: v }))} min={1} max={100} />
                </div>
              </div>

              {/* Job & Career */}
              <div className="glass p-6">
                <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <Zap size={18} className="text-blue-400" />Job & Career Details
                </h2>
                <p className="text-slate-400 text-sm mb-4">Current role, compensation, and working conditions.</p>
                <div className="grid grid-cols-2 gap-4">
                  <SelectInput label="Department" value={form.department} onChange={(v: string) => setForm((f: any) => ({ ...f, department: v }))} options={['Human Resources', 'Research & Development', 'Sales']} />
                  <SelectInput label="Job Role" value={form.jobRole} onChange={(v: string) => setForm((f: any) => ({ ...f, jobRole: v }))} options={['Manager', 'Sales Executive', 'Research Scientist', 'Laboratory Technician', 'Manufacturing Director', 'Healthcare Representative', 'Sales Representative', 'Human Resources', 'Research Director']} />
                  <NumberInput label="Monthly Income ($)" value={form.monthlyIncome} onChange={(v: number) => setForm((f: any) => ({ ...f, monthlyIncome: v }))} min={1000} max={50000} step={100} />
                  <SelectInput label="Business Travel" value={form.businessTravel} onChange={(v: string) => setForm((f: any) => ({ ...f, businessTravel: v }))} options={[{ val: 'Non-Travel', label: 'Non-Travel' }, { val: 'Travel_Rarely', label: 'Travel Rarely' }, { val: 'Travel_Frequently', label: 'Travel Frequently' }]} />
                  <SelectInput label="Overtime" value={form.overtime} onChange={(v: string) => setForm((f: any) => ({ ...f, overtime: v }))} options={['No', 'Yes']} />
                  <div>
                    <NumberInput label="Stock Option Level" value={form.stockOptionLevel} onChange={(v: number) => setForm((f: any) => ({ ...f, stockOptionLevel: v }))} min={0} max={3} />
                    <p className="text-slate-500 text-xs mt-1">0 None &bull; 1 Standard &bull; 2 High &bull; 3 Executive</p>
                  </div>
                </div>
              </div>

              {/* Satisfaction */}
              <div className="glass p-6">
                <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-400" />Satisfaction & Engagement
                </h2>
                <p className="text-slate-400 text-sm mb-4">Employee experience and workplace satisfaction scores.</p>
                <div className="space-y-5">
                  <SliderInput label="Work-Life Balance" value={form.workLifeBalance} onChange={(v: number) => setForm((f: any) => ({ ...f, workLifeBalance: v }))} min={1} max={4} leftLabel="Poor" rightLabel="Excellent" />
                  <SliderInput label="Job Satisfaction" value={form.jobSatisfaction} onChange={(v: number) => setForm((f: any) => ({ ...f, jobSatisfaction: v }))} min={1} max={4} leftLabel="Low" rightLabel="High" />
                  <SliderInput label="Environment Satisfaction" value={form.environmentSatisfaction} onChange={(v: number) => setForm((f: any) => ({ ...f, environmentSatisfaction: v }))} min={1} max={4} leftLabel="Low" rightLabel="High" />
                </div>
              </div>

              {/* Predict Button */}
              <button
                onClick={handlePredict} disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg glow-blue flex items-center justify-center gap-3 text-base"
              >
                {loading
                  ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing Employee Profile...</>
                  : <><BarChart2 size={18} />Generate Attrition Prediction</>
                }
              </button>
            </div>
          ) : (
            /* ── AFTER PREDICTION: two-column results layout ── */
            <motion.div
              className="grid grid-cols-1 xl:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            >
              {/* LEFT — Risk Assessment + Explanation */}
              <div className="space-y-6">
                <RiskSummaryCard result={result} />
                <PredictionFactors factors={result.top_factors || []} />
                <button
                  onClick={() => { ctx.setPredictionResult(null); ctx.setPredictionDone(false); setSimResult(null); }}
                  className="w-full border border-slate-600 hover:border-blue-500/50 text-slate-300 hover:text-white font-medium py-3 rounded-xl transition-all duration-200 text-sm"
                >
                  Predict Another Employee
                </button>
              </div>

              {/* RIGHT — Simulator + Recommendations */}
              <div ref={resultsRef}>
                <RetentionSimulator form={form} onSimulate={handleSimulate} simData={simData} recommendations={result.recommendations || []} />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* SUB-COMPONENTS                                         */


function RiskSummaryCard({ result }: { result: any }) {
  const statusColors: any = { healthy: 'text-emerald-400', caution: 'text-amber-400', critical: 'text-red-400' };
  const bgColors: any = { healthy: 'bg-emerald-500/10 border-emerald-500/30', caution: 'bg-amber-500/10 border-amber-500/30', critical: 'bg-red-500/10 border-red-500/30' };
  const barColors: any = { healthy: 'bg-emerald-500', caution: 'bg-amber-500', critical: 'bg-red-500' };
  const glowColors: any = { healthy: 'glow-green', caution: 'glow-amber', critical: 'glow-red' };
  const status = result.risk_status || 'caution';

  return (
    <div className={`glass p-6 border ${bgColors[status].split(' ')[1]} ${glowColors[status]}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-bold text-xl">Attrition Risk Assessment</h2>
          <p className="text-slate-400 text-sm mt-0.5">Powered by {result.model_used?.replace(/_/g, ' ').toUpperCase()}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${bgColors[status]} border ${bgColors[status].split(' ')[1]} flex items-center justify-center`}>
          <Shield size={26} className={statusColors[status]} />
        </div>
      </div>

      <div className="text-center py-6 mb-5">
        <p className={`text-7xl font-bold ${statusColors[status]} mb-2`}>{result.probability}%</p>
        <p className="text-slate-400 text-sm">Attrition Probability</p>
        <p className={`text-xl font-semibold mt-2 ${statusColors[status]}`}>{result.risk_category}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Low Risk</span><span>Moderate</span><span>High Risk</span>
        </div>
        <div className="h-3 rounded-full bg-slate-700 overflow-hidden relative">
          <div className="absolute inset-0 flex">
            <div className="h-full bg-emerald-500/20 flex-1" />
            <div className="h-full bg-amber-500/20 flex-1" />
            <div className="h-full bg-red-500/20 flex-1" />
          </div>
          <motion.div
            className={`h-3 rounded-full ${barColors[status]} relative z-10`}
            initial={{ width: 0 }} animate={{ width: `${result.probability}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0%</span><span>30%</span><span>60%</span><span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-slate-800/50 p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Risk Score</p>
          <p className={`font-bold text-2xl ${statusColors[status]}`}>
            {result.risk_score}<span className="text-slate-500 text-sm font-normal"> / 10</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Team Impact</p>
          <p className="font-bold text-2xl text-white">
            {typeof result.business_metrics?.team_impact === 'string'
              ? result.business_metrics.team_impact
              : result.business_metrics?.team_impact || '—'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Outcome</p>
          <p className={`font-semibold text-sm ${result.prediction === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
            {result.prediction === 1 ? 'Likely to Leave' : 'Likely to Stay'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Replacement Cost</p>
          <p className="font-semibold text-sm text-white">
            ${(typeof result.business_metrics?.replacement_cost === 'number'
              ? result.business_metrics.replacement_cost
              : parseInt(result.business_metrics?.replacement_cost) || 0
            ).toLocaleString()}
          </p>
        </div>
      </div>

      <div className={`rounded-xl border p-3 ${bgColors[status]} text-center`}>
        <p className={`text-sm font-medium ${statusColors[status]}`}>
          {status === 'critical'
            ? 'Immediate retention action recommended'
            : status === 'caution'
              ? 'Monitor closely and consider proactive steps'
              : 'Employee profile appears stable and healthy'}
        </p>
      </div>
    </div>
  );
}

function PredictionFactors({ factors }: { factors: any[] }) {
  if (!factors || factors.length === 0) return null;
  return (
    <div className="glass p-6">
      <h2 className="text-white font-semibold mb-1">Prediction Explanation</h2>
      <p className="text-slate-400 text-sm mb-4">Key factors driving this attrition prediction, powered by SHAP analysis.</p>
      <div className="space-y-3">
        {factors.map((f, i) => (
          <motion.div
            key={f.feature || i}
            className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${f.impact > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span className="text-white text-sm font-medium">{f.label || f.feature}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.impact > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {f.impact > 0 ? 'Increases Risk' : 'Lowers Risk'}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-2 ml-4">{safeString(f.description)}</p>
            <div className="ml-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Impact strength</span>
                <span>{(Math.min(Math.abs(f.impact) / 5, 1) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700">
                <motion.div
                  className={`h-1.5 rounded-full ${f.impact > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.abs(f.impact) / 5, 1) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.07 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RetentionRecommendations({ recommendations }: { recommendations: any[] }) {
  if (!recommendations || recommendations.length === 0) return null;
  const cfg: any = {
    high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', badge: 'bg-red-500/20 text-red-400', label: 'High Priority' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400', label: 'Medium Priority' },
    low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400', label: 'Low Priority' },
  };
  return (
    <div className="glass p-6">
      <h2 className="text-white font-semibold mb-1">Retention Recommendations</h2>
      <p className="text-slate-400 text-sm mb-4">Actionable steps to reduce attrition risk for this employee.</p>
      <div className="space-y-3">
        {recommendations.map((r, i) => {
          const c = cfg[r.priority] || cfg.medium;
          return (
            <motion.div
              key={i} className={`rounded-xl border p-4 ${c.bg}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold text-sm">{safeString(r.title)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{c.label}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{safeString(r.description)}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RetentionSimulator({ form, onSimulate, simData, recommendations }: any) {
  const [simForm, setSimForm] = useState({ ...form });
  const update = (key: string, val: any) => {
    const n = { ...simForm, [key]: val };
    setSimForm(n);
    onSimulate(n);
  };
  const statusColors: any = { healthy: 'text-emerald-400', caution: 'text-amber-400', critical: 'text-red-400' };

  return (
    <div className="glass p-6 h-full">
      <h2 className="text-white font-semibold mb-1">Retention Simulator</h2>
      <p className="text-slate-400 text-sm mb-5">Adjust variables to simulate how interventions affect attrition risk in real time.</p>

      {simData && (
        <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
          <div className="text-center">
            <p className={`font-bold text-2xl ${statusColors[simData.risk_status] || 'text-white'}`}>{simData.probability}%</p>
            <p className="text-slate-500 text-xs mt-1">Probability</p>
          </div>
          <div className="text-center border-x border-slate-700">
            <p className={`font-bold text-2xl ${statusColors[simData.risk_status] || 'text-white'}`}>{simData.risk_score}</p>
            <p className="text-slate-500 text-xs mt-1">Risk Score</p>
          </div>
          <div className="text-center">
            <p className={`font-bold text-base ${statusColors[simData.risk_status] || 'text-white'}`}>{simData.risk_category}</p>
            <p className="text-slate-500 text-xs mt-1">Category</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <SliderInput label="Work-Life Balance" value={simForm.workLifeBalance} onChange={(v: number) => update('workLifeBalance', v)} min={1} max={4} leftLabel="Poor" rightLabel="Excellent" />
        <SliderInput label="Job Satisfaction" value={simForm.jobSatisfaction} onChange={(v: number) => update('jobSatisfaction', v)} min={1} max={4} leftLabel="Low" rightLabel="High" />
        <SliderInput label="Environment Satisfaction" value={simForm.environmentSatisfaction} onChange={(v: number) => update('environmentSatisfaction', v)} min={1} max={4} leftLabel="Low" rightLabel="High" />
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-400 text-sm">Monthly Income</label>
            <span className="text-blue-400 text-sm font-medium">${simForm.monthlyIncome.toLocaleString()}</span>
          </div>
          <input type="range" min={1000} max={20000} step={500} value={simForm.monthlyIncome}
            onChange={e => update('monthlyIncome', Number(e.target.value))} className="w-full" />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>$1,000</span><span>$20,000</span>
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Overtime</label>
          <div className="grid grid-cols-2 gap-2">
            {['No', 'Yes'].map(v => (
              <button key={v} onClick={() => update('overtime', v)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${simForm.overtime === v
                  ? v === 'Yes' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500'
                  }`}>{v}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-400 text-sm">Stock Option Level</label>
            <span className="text-blue-400 text-sm font-medium">{simForm.stockOptionLevel}</span>
          </div>
          <input type="range" min={0} max={3} step={1} value={simForm.stockOptionLevel}
            onChange={e => update('stockOptionLevel', Number(e.target.value))} className="w-full" />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>None</span><span>Standard</span><span>High</span><span>Executive</span>
          </div>
        </div>
      </div>

      {simData?.guidance && simData.guidance.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-700">
          <p className="text-white text-sm font-semibold mb-3">Simulation Guidance</p>
          <div className="space-y-2">
            {simData.guidance.slice(0, 2).map((g: any, i: number) => (
              <div key={i} className={`rounded-xl p-3 text-xs ${g.priority === 'high' ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                : g.priority === 'medium' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}>
                <p className="font-semibold mb-1">{g.title}</p>
                <p className="opacity-80 leading-relaxed">{g.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-700">
          <h2 className="text-white font-semibold mb-1">Retention Recommendations</h2>
          <p className="text-slate-400 text-sm mb-4">Actionable steps to reduce attrition risk for this employee.</p>
          <div className="space-y-3">
            {recommendations.map((r: any, i: number) => {
              const cfg: any = {
                high: { bg: 'bg-red-500/10 border-red-500/20', badge: 'bg-red-500/20 text-red-400', label: 'High Priority' },
                medium: { bg: 'bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400', label: 'Medium Priority' },
                low: { bg: 'bg-emerald-500/10 border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400', label: 'Low Priority' },
              };
              const c = cfg[r.priority] || cfg.medium;
              return (
                <div key={i} className={`rounded-xl border p-4 ${c.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">{safeString(r.title)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{c.label}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{safeString(r.description)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1 }: any) {
  return (
    <div>
      <label className="text-slate-400 text-sm mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0">
          <Minus size={14} />
        </button>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-blue-500 transition-colors" />
        <button onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-slate-400 text-sm mb-1.5 block">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 transition-colors pr-8">
          {options.map((o: any) =>
            typeof o === 'string'
              ? <option key={o} value={o}>{o}</option>
              : <option key={o.val} value={o.val}>{o.label}</option>
          )}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, leftLabel, rightLabel }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-slate-400 text-sm">{label}</label>
        <span className="text-blue-400 text-sm font-semibold">{value} / {max}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}