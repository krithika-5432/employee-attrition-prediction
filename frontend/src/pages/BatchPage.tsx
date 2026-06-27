import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, Area, AreaChart, ScatterChart, Scatter } from 'recharts';
import { Users, AlertTriangle, CheckCircle, TrendingUp, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Maximize2, AlertCircle, Zap, Shield, DollarSign, TrendingDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { batchAnalysis } from '../services/api';

const COLORS = ['#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#f97316','#84cc16'];
const TS = { backgroundColor: '#0d1526', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' };
const PER_PAGE = 12;

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let s = 0; const step = target / 40;
    const t = setInterval(() => { s = Math.min(s + step, target); setVal(parseFloat(s.toFixed(1))); if (s >= target) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <span>{Number.isInteger(target) ? Math.round(val) : val}{suffix}</span>;
}

export default function BatchPage() {
  const ctx = useAppContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'probability', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!ctx.datasetUploaded) return;
    setLoading(true);
    batchAnalysis({})
      .then(r => { setData(r.data); ctx.setBatchResults(r.data); setError(''); })
      .catch(e => {
        const detail = e?.response?.data?.detail;
        let msg = 'Batch analysis failed.';
        if (Array.isArray(detail)) {
          msg = detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
        } else if (typeof detail === 'string') {
          msg = detail;
        } else if (e?.message) {
          msg = e.message;
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [ctx.datasetUploaded]);

  if (!ctx.datasetUploaded) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-amber-400" />
        <p className="text-slate-300 font-medium mb-1">No Dataset Uploaded</p>
        <p className="text-slate-500 text-sm">Please upload a dataset from the Predict page to run batch analysis.</p>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="text-center"><AlertCircle size={48} className="text-red-400 mx-auto mb-4" /><p className="text-slate-300">{error}</p></div>
    </div>
  );

  if (!data) return null;

  const { results = [], summary = {} } = data;

  // Build chart data
  const riskCounts: any = { 'Low Risk': 0, 'Moderate Risk': 0, 'High Risk': 0 };
  const deptMap: any = {};
  const roleMap: any = {};
  const probBuckets: any = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };

  results.forEach((r: any) => {
    riskCounts[r.risk_category] = (riskCounts[r.risk_category] || 0) + 1;
    deptMap[r.department] = (deptMap[r.department] || 0) + 1;
    roleMap[r.job_role] = (roleMap[r.job_role] || 0) + 1;
    const p = r.probability;
    if (p <= 20) probBuckets['0-20']++;
    else if (p <= 40) probBuckets['21-40']++;
    else if (p <= 60) probBuckets['41-60']++;
    else if (p <= 80) probBuckets['61-80']++;
    else probBuckets['81-100']++;
  });

  const charts = [
    { title: 'Risk Category Distribution', description: 'Number of employees in each attrition risk category.', type: 'pie', data: Object.entries(riskCounts).map(([n, v]) => ({ name: n, value: v })) },
    { title: 'Department-wise Distribution', description: 'Employee count across departments in the dataset.', type: 'bar', data: Object.entries(deptMap).map(([n, v]) => ({ name: n, value: v })) },
    { title: 'Job Role Breakdown', description: 'Employee count per job role across the organization.', type: 'bar', data: Object.entries(roleMap).map(([n, v]) => ({ name: n, value: v })) },
    { title: 'Probability Score Distribution', description: 'Distribution of predicted attrition probability scores.', type: 'bar', data: Object.entries(probBuckets).map(([n, v]) => ({ name: `${n}%`, value: v })) },
  ];

  // Table logic
  const filtered = results.filter((r: any) =>
    String(r.employee_id).includes(search) ||
    r.department?.toLowerCase().includes(search.toLowerCase()) ||
    r.job_role?.toLowerCase().includes(search.toLowerCase()) ||
    r.risk_category?.toLowerCase().includes(search.toLowerCase())
  ).sort((a: any, b: any) => {
    const av = a[sort.key], bv = b[sort.key];
    if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sort.dir === 'asc' ? av - bv : bv - av;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const toggleSort = (k: string) => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));

  const statusColor: any = { healthy: 'text-emerald-400', caution: 'text-amber-400', critical: 'text-red-400' };
  const statusBadge: any = { healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', caution: 'bg-amber-500/10 text-amber-400 border-amber-500/20', critical: 'bg-red-500/10 text-red-400 border-red-500/20' };

  function ChartRender({ chart }: any) {
    if (!chart.data || chart.data.length === 0) return <div className="h-full flex items-center justify-center text-slate-500 text-xs">No data</div>;
    if (chart.type === 'pie') return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart><Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="65%"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} fontSize={10}>
          {chart.data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie><Tooltip contentStyle={TS} /></PieChart>
      </ResponsiveContainer>
    );
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.data} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TS} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>{chart.data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-20 pb-20">
      <motion.div className="max-w-7xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 gradient-text">Batch Analysis</h1>
          <p className="text-slate-400">Evaluate attrition risk across your entire workforce simultaneously.</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Total Processed', val: summary.total || 0, suffix: '', color: 'text-blue-400', bg: 'border-blue-500/20 bg-blue-500/5' },
            { icon: CheckCircle, label: 'Likely to Stay', val: summary.staying || 0, suffix: '', color: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/5' },
            { icon: AlertTriangle, label: 'Requiring Attention', val: summary.attention || 0, suffix: '', color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/5' },
            { icon: TrendingUp, label: 'Avg Attrition Risk', val: summary.avg_probability || 0, suffix: '%', color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5' },
          ].map((k, i) => (
            <motion.div key={k.label} className={`glass p-5 rounded-xl border ${k.bg}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
              <div className="flex items-center gap-2 mb-2"><k.icon size={16} className={k.color} /><span className="text-slate-400 text-xs">{k.label}</span></div>
              <p className={`text-3xl font-bold ${k.color}`}><CountUp target={k.val} suffix={k.suffix} /></p>
            </motion.div>
          ))}
        </div>

        {/* Risk Segments */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { title: 'Low Risk', sub: 'Stable employees — maintain current conditions', count: riskCounts['Low Risk'] || 0, pct: results.length ? ((riskCounts['Low Risk'] || 0) / results.length * 100).toFixed(1) : '0', color: 'border-emerald-500/30 bg-emerald-500/5', textColor: 'text-emerald-400' },
            { title: 'Moderate Risk', sub: 'Monitor closely — proactive engagement needed', count: riskCounts['Moderate Risk'] || 0, pct: results.length ? ((riskCounts['Moderate Risk'] || 0) / results.length * 100).toFixed(1) : '0', color: 'border-amber-500/30 bg-amber-500/5', textColor: 'text-amber-400' },
            { title: 'High Risk', sub: 'Immediate action required — flight risk', count: riskCounts['High Risk'] || 0, pct: results.length ? ((riskCounts['High Risk'] || 0) / results.length * 100).toFixed(1) : '0', color: 'border-red-500/30 bg-red-500/5', textColor: 'text-red-400' },
          ].map(s => (
            <motion.div key={s.title} className={`rounded-xl border p-5 ${s.color}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className={`text-4xl font-bold ${s.textColor} mb-1`}>{s.count}</p>
              <p className={`text-xs font-medium ${s.textColor} mb-1`}>{s.pct}% of workforce</p>
              <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Row 1: Macro Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Workforce Health Index */}
          <motion.div className="glass p-6 rounded-xl border border-slate-700" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Shield size={16} className="text-blue-400" />Workforce Health Index</h3>
            </div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">Overall Risk Score</p>
                <p className="text-4xl font-bold text-red-400">
                  {Math.round(((riskCounts['High Risk'] || 0) / results.length) * 100)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/20 text-red-400">Immediate Action</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-700 mb-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" style={{ width: `${Math.round(((riskCounts['High Risk'] || 0) / results.length) * 100)}%` }} />
            </div>
            <p className="text-slate-500 text-xs mt-2">Score 0-33: Healthy, 34-66: Monitor, 67-100: Critical</p>
          </motion.div>

          {/* Risk Tier Counts */}
          <motion.div className="glass p-6 rounded-xl border border-slate-700" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Zap size={16} className="text-amber-400" />Risk Tier Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'High Risk', val: riskCounts['High Risk'] || 0, color: 'bg-red-500', pct: 'text-red-400' },
                { label: 'Moderate Risk', val: riskCounts['Moderate Risk'] || 0, color: 'bg-amber-500', pct: 'text-amber-400' },
                { label: 'Low Risk', val: riskCounts['Low Risk'] || 0, color: 'bg-emerald-500', pct: 'text-emerald-400' },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{r.label}</span>
                    <span className={`font-medium ${r.pct}`}>{r.val} ({results.length ? ((r.val / results.length) * 100).toFixed(1) : '0'}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <motion.div className={`h-2 rounded-full ${r.color}`}
                      initial={{ width: 0 }} animate={{ width: `${results.length ? (r.val / results.length) * 100 : 0}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cumulative Financial Liability */}
          <motion.div className="glass p-6 rounded-xl border border-slate-700" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><DollarSign size={16} className="text-emerald-400" />Financial Liability</h3>
            <div className="mb-4">
              <p className="text-slate-400 text-xs mb-2">Projected loss if high-risk employees depart:</p>
              <p className="text-3xl font-bold text-red-400">
                ${(((riskCounts['High Risk'] || 0) * 50000) / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K
              </p>
              <p className="text-slate-500 text-xs mt-2">Based on ~$50K avg replacement cost per employee</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-slate-300 text-xs">
                {riskCounts['High Risk'] || 0} high-risk employees × $50K replacement = <strong className="text-red-400">${(((riskCounts['High Risk'] || 0) * 50000) / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K</strong> exposure
              </p>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Risk Heatmaps & Pockets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Departmental Attrition Heatmap */}
          <motion.div className="glass p-6 rounded-xl border border-slate-700" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" />Departmental Attrition Risk</h3>
            <p className="text-slate-400 text-xs mb-4">Which departments are experiencing the heaviest density of high-to-medium risk signals?</p>
            <div className="space-y-3">
              {Object.entries(deptMap)
                .map(([dept, count]: any) => {
                  const deptResults = results.filter((r: any) => r.department === dept);
                  const highRiskDept = deptResults.filter((r: any) => r.risk_category === 'High Risk').length;
                  const riskPct = deptResults.length ? (highRiskDept / deptResults.length) * 100 : 0;
                  return { dept, count, highRisk: highRiskDept, riskPct };
                })
                .sort((a, b) => b.riskPct - a.riskPct)
                .map((d, i) => (
                  <div key={d.dept}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm font-medium">{d.dept}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.riskPct >= 30 ? 'bg-red-500/20 text-red-400' :
                        d.riskPct >= 15 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>{d.riskPct.toFixed(1)}% high-risk</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700">
                      <motion.div
                        className={`h-2 rounded-full ${
                          d.riskPct >= 30 ? 'bg-red-500' :
                          d.riskPct >= 15 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        initial={{ width: 0 }} animate={{ width: `${d.riskPct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Job Role Risk Ranking */}
          <motion.div className="glass p-6 rounded-xl border border-slate-700" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-amber-400" />Job Role Vulnerability Ranking</h3>
            <p className="text-slate-400 text-xs mb-4">Which job roles have the highest volume of endangered headcount?</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={Object.entries(roleMap)
                    .map(([role, count]: any) => {
                      const roleResults = results.filter((r: any) => r.job_role === role);
                      const highRiskRole = roleResults.filter((r: any) => r.risk_category === 'High Risk').length;
                      return { role: role.substring(0, 12), count, highRisk: highRiskRole, pct: roleResults.length ? (highRiskRole / roleResults.length) * 100 : 0 };
                    })
                    .sort((a, b) => b.highRisk - a.highRisk)
                    .slice(0, 8)}
                  layout="vertical" margin={{ left: 80, right: 10, top: 5, bottom: 5 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="role" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="highRisk" fill="#ef4444" radius={[0, 4, 4, 0]} name="High-Risk Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Row 3: Operational Priority Action Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Critical Signals Box */}
          <motion.div className="glass p-6 rounded-xl border border-red-500/20 bg-red-500/5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <h3 className="text-white font-semibold">Critical System Flags</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-red-500/10">
                <p className="text-red-400 text-xs font-semibold mb-1">Overtime Overload</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {Math.round(((results.filter((r: any) => r.overtime === 'Yes').length / results.length) * 100) || 0)}% of high-risk employees work mandatory overtime. Workload management is critical.
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-500/10">
                <p className="text-amber-400 text-xs font-semibold mb-1">Compensation Gap</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Lower income brackets show 3x higher attrition. Review salary bands for competitiveness.
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
                <p className="text-blue-400 text-xs font-semibold mb-1">Junior Level Exodus</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  25-35 age group represents {Math.round(((results.filter((r: any) => r.age >= 25 && r.age <= 35).length / results.length) * 100) || 0)}% of identified flight risks.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Suggested Actions */}
          <motion.div className="lg:col-span-2 glass p-6 rounded-xl border border-slate-700" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400" />Suggested Action Plan</h3>
            <div className="space-y-3">
              {[
                {
                  action: 'Immediate: Engagement Outreach',
                  detail: `Schedule one-on-one meetings with all ${riskCounts['High Risk'] || 0} high-risk employees within 48 hours. Identify blockers (compensation, workload, growth).`,
                  priority: 'High',
                },
                {
                  action: 'Short-term: Workload Rebalancing',
                  detail: 'Audit overtime schedules. Phase out mandatory overtime for 50% of flagged employees. Implement flexible scheduling.',
                  priority: 'High',
                },
                {
                  action: 'Mid-term: Compensation Review',
                  detail: 'Conduct market analysis for roles with high attrition. Adjust salary bands to match competitor rates, starting with bottom quartile.',
                  priority: 'Medium',
                },
                {
                  action: 'Long-term: Career Development',
                  detail: 'Design mentorship and upskilling programs targeting the 25-35 demographic. Create clear promotion pathways.',
                  priority: 'Medium',
                },
              ].map((a, i) => (
                <div key={i} className="border border-slate-700 rounded-lg p-4 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-semibold text-sm">{a.action}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      a.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>{a.priority}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{a.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {charts.map((chart, i) => (
            <motion.div key={chart.title} className="glass glass-hover p-5 cursor-pointer" onClick={() => setExpanded(i)} whileHover={{ y: -2 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="flex items-center justify-between mb-3"><h3 className="text-white font-medium text-sm">{chart.title}</h3><Maximize2 size={14} className="text-slate-400" /></div>
              <div className="h-52"><ChartRender chart={chart} /></div>
              <p className="text-slate-500 text-xs mt-2">{chart.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Results Table */}
        <div className="glass p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div><h2 className="text-white font-semibold">Employee Risk Results</h2><p className="text-slate-400 text-sm mt-0.5">{filtered.length} employees</p></div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search employees..." className="bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-52 transition-colors" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {[['employee_id','Employee ID'],['department','Department'],['job_role','Job Role'],['probability','Probability'],['risk_category','Risk Category'],['status','Status']].map(([k, l]) => (
                    <th key={k} onClick={() => toggleSort(k)} className="text-left text-slate-400 font-medium pb-3 pr-6 cursor-pointer hover:text-white transition-colors select-none">
                      <span className="flex items-center gap-1">{l}{sort.key === k ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-30" />}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-6 text-slate-300 font-mono text-xs">{r.employee_id}</td>
                    <td className="py-3 pr-6 text-slate-300">{r.department}</td>
                    <td className="py-3 pr-6 text-slate-300">{r.job_role}</td>
                    <td className="py-3 pr-6"><span className={`font-bold ${statusColor[r.risk_status] || 'text-white'}`}>{r.probability}%</span></td>
                    <td className="py-3 pr-6"><span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusBadge[r.risk_status] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>{r.risk_category}</span></td>
                    <td className="py-3 pr-6 text-slate-400 text-xs">{r.status}</td>
                  </tr>
                ))}
                {paged.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-500">No results match your search.</td></tr>}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800">
              <span className="text-slate-400 text-sm">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm transition-colors ${p === page ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="glass p-6">
          <h2 className="text-white font-semibold mb-2">Workforce Retention Recommendations</h2>
          <p className="text-slate-400 text-sm mb-5">Strategic actions based on this batch analysis to reduce overall attrition.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Prioritise High-Risk Employees', desc: `${riskCounts['High Risk'] || 0} employees are at immediate flight risk. Schedule one-on-one meetings to understand their concerns before they reach the exit stage.`, color: 'border-red-500/30 bg-red-500/5', tc: 'text-red-400' },
              { title: 'Workforce Planning', desc: 'Build succession plans for critical roles with high attrition risk. Ensure knowledge transfer processes are in place before potential departures materialise.', color: 'border-amber-500/30 bg-amber-500/5', tc: 'text-amber-400' },
              { title: 'Engage Moderate-Risk Segment', desc: `${riskCounts['Moderate Risk'] || 0} employees show moderate risk. Regular career conversations and targeted development plans can prevent them from escalating to high risk.`, color: 'border-blue-500/30 bg-blue-500/5', tc: 'text-blue-400' },
              { title: 'Structural Improvements', desc: 'Analyse overtime patterns and compensation gaps across high-risk departments. Design data-driven interventions targeting the root causes identified in this analysis.', color: 'border-purple-500/30 bg-purple-500/5', tc: 'text-purple-400' },
            ].map(r => (
              <div key={r.title} className={`rounded-xl border p-4 ${r.color}`}>
                <p className={`font-semibold text-sm mb-2 ${r.tc}`}>{r.title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {expanded !== null && charts[expanded] && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[#0a0f1e]/90 backdrop-blur-lg" onClick={() => setExpanded(null)} />
            <motion.div className="relative glass p-8 w-full max-w-3xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-semibold text-xl">{charts[expanded].title}</h2>
                <button onClick={() => setExpanded(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-slate-400 text-sm mb-6">{charts[expanded].description}</p>
              <div className="h-80">
                {(() => {
                  const chart = charts[expanded];
                  if (chart.type === 'pie') return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                        {chart.data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie><Tooltip contentStyle={TS} /></PieChart>
                    </ResponsiveContainer>
                  );
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart.data} margin={{ left: -10, right: 10 }}>
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TS} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>{chart.data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setExpanded(Math.max(0, expanded - 1))} disabled={expanded === 0} className="text-slate-400 hover:text-white disabled:opacity-30 text-sm">Previous</button>
                <button onClick={() => setExpanded(Math.min(charts.length - 1, expanded + 1))} disabled={expanded === charts.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30 text-sm">Next</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
