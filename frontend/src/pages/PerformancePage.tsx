import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { ShieldCheck, Target, Zap, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { getPerformance } from '../services/api';

const customTooltipStyle = {
  backgroundColor: '#0d1526',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

// Deployed model metrics at 0.3 custom classification threshold
const modelSummaryData = [
  { name: 'Logistic Regression', type: 'High Interpretability', accuracy: 57, recall: 96, f1: 73, auc: 81 },
  { name: 'Random Forest', type: 'Max Risk Coverage', accuracy: 54, recall: 98, f1: 71, auc: 79 },
  { name: 'XGBoost', type: 'Balanced Performance', accuracy: 53, recall: 90, f1: 53, auc: 77 },
];

const recallData = [
  { name: 'Random Forest', Recall: 98, color: '#f59e0b' },
  { name: 'Logistic Regression', Recall: 96, color: '#3b82f6' },
  { name: 'XGBoost', Recall: 90, color: '#8b5cf6' },
];

const tradeOffData = [
  { name: 'Logistic Regression', Accuracy: 57, Recall: 96 },
  { name: 'Random Forest', Accuracy: 54, Recall: 98 },
  { name: 'XGBoost', Accuracy: 53, Recall: 90 },
];

const rocData = [
  { fpr: 0.00, 'Logistic Regression': 0.00, 'Random Forest': 0.00, 'XGBoost': 0.00 },
  { fpr: 0.05, 'Logistic Regression': 0.50, 'Random Forest': 0.45, 'XGBoost': 0.38 },
  { fpr: 0.10, 'Logistic Regression': 0.72, 'Random Forest': 0.66, 'XGBoost': 0.58 },
  { fpr: 0.15, 'Logistic Regression': 0.81, 'Random Forest': 0.77, 'XGBoost': 0.70 },
  { fpr: 0.20, 'Logistic Regression': 0.86, 'Random Forest': 0.83, 'XGBoost': 0.78 },
  { fpr: 0.30, 'Logistic Regression': 0.90, 'Random Forest': 0.89, 'XGBoost': 0.84 },
  { fpr: 0.40, 'Logistic Regression': 0.93, 'Random Forest': 0.92, 'XGBoost': 0.88 },
  { fpr: 0.50, 'Logistic Regression': 0.96, 'Random Forest': 0.95, 'XGBoost': 0.91 },
  { fpr: 0.70, 'Logistic Regression': 0.98, 'Random Forest': 0.98, 'XGBoost': 0.96 },
  { fpr: 1.00, 'Logistic Regression': 1.00, 'Random Forest': 1.00, 'XGBoost': 1.00 },
];

export default function PerformancePage() {
  const [perfData, setPerfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPerformance()
      .then(res => {
        // Correctly handle axios double-nesting
        setPerfData(res.data || null);
      })
      .catch(err => {
        console.error('Error fetching backend model performance data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-20 pb-20">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 gradient-text">Model Performance & Validation</h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            This page serves as the mathematical and technical validation layer of the application.
            It explains to data scientists and senior HR executives why and how the machine learning models make their predictions,
            explicitly detailing the business logic behind the custom classification thresholds.
          </p>
        </div>

        {/* Section 1: The Threshold Optimization Panel (Strategic Overview) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass p-6 border border-slate-700/50 flex flex-col justify-between">
            <div>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-400" />
                Threshold Optimization Strategy
              </h2>
              <p className="text-slate-400 text-xs mb-4">
                The chart below tracks standard metrics across different classification thresholds, showcasing why a lower threshold was chosen.
              </p>
            </div>

            <div className="h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { threshold: '0.1', Recall: 98, Precision: 24, F1: 39 },
                  { threshold: '0.2', Recall: 96, Precision: 31, F1: 47 },
                  { threshold: '0.3', Recall: 95, Precision: 40, F1: 56 },
                  { threshold: '0.4', Recall: 92, Precision: 48, F1: 62 },
                  { threshold: '0.5', Recall: 87, Precision: 56, F1: 67 },
                  { threshold: '0.6', Recall: 78, Precision: 63, F1: 70 },
                  { threshold: '0.7', Recall: 65, Precision: 72, F1: 68 },
                ]}>
                  <XAxis dataKey="threshold" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="Recall" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                  <Line type="monotone" dataKey="Precision" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  <Line type="monotone" dataKey="F1" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-slate-500 text-xs italic">
              * Note: The 0.3 threshold is intentionally selected to maximize risk capture (Recall) while maintaining an acceptable Precision trade-off.
            </p>
          </div>

          <div className="glass p-6 border border-red-500/20 bg-red-500/5 flex flex-col justify-between">
            <div>
              <div className="flex gap-3 mb-4">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <h3 className="text-white font-semibold text-base">Business Justification</h3>
              </div>
              <blockquote className="border-l-2 border-red-500/50 pl-3 py-1 mb-4">
                <p className="text-slate-300 text-xs italic leading-relaxed">
                  "In HR application metrics, missing an employee who is about to leave (a False Negative) is far more costly to the enterprise than raising a false alarm (a False Positive)."
                </p>
              </blockquote>
              <p className="text-slate-400 text-xs leading-relaxed">
                By pivoting from the standard 0.5 classification threshold to a custom 0.3 threshold, the system shifts its mathematical focus entirely toward maximizing Recall, ensuring at-risk staff are caught early for proactive retention campaigns.
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-300 mt-4 border border-slate-700/50">
              <p className="font-semibold text-red-400 mb-1">Optimization Focus:</p>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <span>✓ High Recall</span>
                <span>✗ Low False Negatives</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Performance Visualization Suite (Charts & Graphs) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recall Comparison Chart */}
          <div className="glass p-5 border border-slate-700/50">
            <h3 className="text-white font-medium text-sm mb-1 flex items-center gap-1.5">
              <Target size={15} className="text-amber-400" />
              Recall Comparison Chart
            </h3>
            <p className="text-slate-500 text-xs mb-4">Captures highest overall percentage of at-risk staff.</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recallData} margin={{ left: -15, right: 5, top: 10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`${v}%`, 'Recall']} />
                  <Bar dataKey="Recall" radius={[4, 4, 0, 0]}>
                    {recallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-slate-500 text-xxs mt-2 text-center">
              Random Forest: <strong>98%</strong> | Logistic Regression: <strong>96%</strong> | XGBoost: <strong>90%</strong>
            </p>
          </div>

          {/* ROC / AUC Curve Diagram */}
          <div className="glass p-5 border border-slate-700/50">
            <h3 className="text-white font-medium text-sm mb-1 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-blue-400" />
              ROC / AUC Curve Diagram
            </h3>
            <p className="text-slate-500 text-xs mb-4">Logistic Regression AUC (~81%) demonstrates strong discrimination.</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rocData} margin={{ left: -15, right: 5, top: 10, bottom: 5 }}>
                  <XAxis dataKey="fpr" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Line type="monotone" dataKey="Logistic Regression" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="Random Forest" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="XGBoost" stroke="#8b5cf6" dot={false} strokeWidth={1.5} />
                  <Line type="linear" dataKey="fpr" name="Random Baseline" stroke="#475569" strokeDasharray="3 3" dot={false} strokeWidth={1} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-slate-500 text-xxs mt-2 text-center">
              True Positive Rate vs. False Positive Rate across all decision thresholds.
            </p>
          </div>

          {/* Model Accuracy Matrix */}
          <div className="glass p-5 border border-slate-700/50">
            <h3 className="text-white font-medium text-sm mb-1 flex items-center gap-1.5">
              <Zap size={15} className="text-purple-400" />
              Model Accuracy Matrix
            </h3>
            <p className="text-slate-500 text-xs mb-4">Trade-off between Accuracy and Recall engineered at 0.3 threshold.</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeOffData} margin={{ left: -15, right: 5, top: 10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recall" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-slate-500 text-xxs mt-2 text-center">
              Lower classification thresholds prioritize finding flight risks over overall accuracy.
            </p>
          </div>
        </div>

        {/* Section 3: The Evaluation Summary Table */}
        <div className="glass p-6 mb-8 border border-slate-700/50">
          <h2 className="text-white font-semibold text-lg mb-1">Statistical Matrix Grid</h2>
          <p className="text-slate-400 text-xs mb-4">
            Test-set performance metrics natively computed and optimized at the 0.3 decision threshold.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr className="text-slate-400">
                  <th className="text-left py-3 px-4 font-semibold">Model Name</th>
                  <th className="text-center py-3 px-4 font-semibold">Test Accuracy (%)</th>
                  <th className="text-center py-3 px-4 font-semibold">Recall Score (%)</th>
                  <th className="text-center py-3 px-4 font-semibold">F1-Score (%)</th>
                  <th className="text-center py-3 px-4 font-semibold">Area Under Curve (AUC)</th>
                  <th className="text-right py-3 px-4 font-semibold">Primary Target</th>
                </tr>
              </thead>
              <tbody>
                {modelSummaryData.map((r, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{r.name}</td>
                    <td className="text-center py-4 px-4 text-slate-300">~{perfData?.[r.name.toLowerCase().replace(' ', '_')]?.accuracy || r.accuracy}%</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-amber-400 font-bold">~{perfData?.[r.name.toLowerCase().replace(' ', '_')]?.recall || r.recall}%</span>
                    </td>
                    <td className="text-center py-4 px-4 text-slate-300">~{perfData?.[r.name.toLowerCase().replace(' ', '_')]?.f1 || r.f1}%</td>
                    <td className="text-center py-4 px-4 text-slate-300">~{perfData?.[r.name.toLowerCase().replace(' ', '_')]?.auc || r.auc}%</td>
                    <td className="text-right py-4 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                        {r.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Model Selection Guidance Matrix */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-1">Model Selection Guidance Matrix</h2>
          <p className="text-slate-400 text-xs mb-4">
            Guidance for selecting predictive pipelines in individual assessment views based on current operational context.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                model: 'XGBoost',
                title: 'F1-Score Optimization',
                goal: 'Deploy if your organization requires highly balanced operational performance and an optimal F1-score.',
                badge: 'Balanced Performance',
                color: 'border-purple-500/30 bg-purple-500/5',
                icon: Zap,
                textColor: 'text-purple-400',
              },
              {
                model: 'Logistic Regression',
                title: 'High Explainability',
                goal: "Deploy if your organization requires strict explainability and a clear look into the precise mathematical features driving an individual's attrition score.",
                badge: 'Explainable AI',
                color: 'border-blue-500/30 bg-blue-500/5',
                icon: ShieldCheck,
                textColor: 'text-blue-400',
              },
              {
                model: 'Random Forest',
                title: 'Max Risk Coverage',
                goal: 'Deploy if your organization requires maximum risk coverage, ensuring the absolute minimum number of at-risk employees are missed by the system.',
                badge: 'Maximum Safety',
                color: 'border-amber-500/30 bg-amber-500/5',
                icon: Target,
                textColor: 'text-amber-400',
              },
            ].map((card, i) => (
              <div key={i} className={`rounded-xl border p-5 flex flex-col justify-between ${card.color}`}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <card.icon size={18} className={card.textColor} />
                    <span className="text-white font-semibold text-sm">{card.model}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    "{card.goal}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-slate-500 text-xxs uppercase tracking-wider">{card.title}</span>
                  <span className={`text-xxs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${card.textColor} font-semibold`}>
                    {card.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
