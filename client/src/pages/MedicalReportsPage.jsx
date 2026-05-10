import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Trash2, Eye, X, Loader2,
  File, Calendar, User, Building2, Sparkles,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, RefreshCw, Utensils,
  Activity, Clock, Languages
} from 'lucide-react';
import { reportAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const reportTypes = [
  { value: 'blood_test', label: 'Blood Test' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'mri', label: 'MRI/CT Scan' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'discharge', label: 'Discharge Summary' },
  { value: 'vaccination', label: 'Vaccination Record' },
  { value: 'dental', label: 'Dental Report' },
  { value: 'eye', label: 'Eye Report' },
  { value: 'other', label: 'Other' },
];

const typeColors = {
  blood_test:   'bg-red-500/20 text-red-400 border-red-500/30',
  xray:         'bg-blue-500/20 text-blue-400 border-blue-500/30',
  mri:          'bg-violet-500/20 text-violet-400 border-violet-500/30',
  prescription: 'bg-green-500/20 text-green-400 border-green-500/30',
  discharge:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
  vaccination:  'bg-teal-500/20 text-teal-400 border-teal-500/30',
  other:        'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const severityColors = {
  normal:   'text-green-400 bg-green-500/10 border-green-500/30',
  mild:     'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  moderate: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  severe:   'text-red-400 bg-red-500/10 border-red-500/30',
};

const urgencyColors = {
  routine:   'text-green-400',
  soon:      'text-yellow-400',
  urgent:    'text-orange-400',
  emergency: 'text-red-400',
};

const statusIcon = (status) => {
  if (status === 'high')     return <TrendingUp className="w-3.5 h-3.5 text-red-400" />;
  if (status === 'low')      return <TrendingDown className="w-3.5 h-3.5 text-blue-400" />;
  if (status === 'abnormal') return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
  return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
};

const statusBg = (status) => {
  if (status === 'high')     return 'border-red-500/20 bg-red-500/5';
  if (status === 'low')      return 'border-blue-500/20 bg-blue-500/5';
  if (status === 'abnormal') return 'border-orange-500/20 bg-orange-500/5';
  return 'border-green-500/20 bg-green-500/5';
};

// ── AI Analysis Panel ─────────────────────────────────────────────────────────
function AIAnalysisPanel({ analysis, reportId, onReanalyze }) {
  const [lang, setLang] = useState('both'); // 'en', 'hi', 'both'
  const [reanalyzing, setReanalyzing] = useState(false);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await onReanalyze(reportId);
      toast.success('Report re-analyzed!');
    } catch {
      toast.error('Re-analysis failed');
    } finally { setReanalyzing(false); }
  };

  if (!analysis) return (
    <div className="mt-4 pt-4 border-t border-white/[0.06] text-center space-y-2">
      <p className="text-slate-600 text-xs flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> AI analysis not available
      </p>
      <button
        onClick={handleReanalyze}
        disabled={reanalyzing}
        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mx-auto"
      >
        {reanalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        Analyze with AI
      </button>
    </div>
  );

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-violet-300 font-semibold text-sm">AI Analysis</span>
          {analysis.overallSeverity && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityColors[analysis.overallSeverity]}`}>
              {analysis.overallSeverity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'both' ? 'en' : l === 'en' ? 'hi' : 'both')}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg bg-white/5"
          >
            <Languages className="w-3 h-3" />
            {lang === 'both' ? 'EN+HI' : lang === 'en' ? 'EN' : 'HI'}
          </button>
          <button onClick={handleReanalyze} disabled={reanalyzing} className="text-slate-600 hover:text-slate-400">
            {reanalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-1">
          {(lang === 'en' || lang === 'both') && analysis.summary.english && (
            <p className="text-slate-300 text-xs leading-relaxed">{analysis.summary.english}</p>
          )}
          {lang === 'both' && <div className="border-t border-violet-500/20 my-1" />}
          {(lang === 'hi' || lang === 'both') && analysis.summary.hindi && (
            <p className="text-slate-300 text-xs leading-relaxed">{analysis.summary.hindi}</p>
          )}
        </div>
      )}

      {/* Urgency */}
      {analysis.urgency && analysis.urgency !== 'routine' && (
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500">See doctor:</span>
          <span className={`font-semibold ${urgencyColors[analysis.urgency]}`}>
            {analysis.urgency.toUpperCase()}
          </span>
        </div>
      )}

      {/* Findings */}
      {analysis.findings?.length > 0 && (
        <div className="space-y-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Findings</p>
          <div className="space-y-2">
            {analysis.findings.map((f, i) => (
              <div key={i} className={`p-2.5 rounded-xl border ${statusBg(f.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {statusIcon(f.status)}
                    <span className="text-white text-xs font-semibold">{f.parameter}</span>
                    {f.value && <span className="text-slate-500 text-xs">({f.value})</span>}
                  </div>
                  <span className={`text-xs font-medium capitalize ${
                    f.status === 'normal' ? 'text-green-400' :
                    f.status === 'high' ? 'text-red-400' :
                    f.status === 'low' ? 'text-blue-400' : 'text-orange-400'
                  }`}>{f.status}</span>
                </div>
                {(lang === 'en' || lang === 'both') && f.english && (
                  <p className="text-slate-400 text-xs">{f.english}</p>
                )}
                {lang === 'both' && f.hindi && f.english && <div className="h-px bg-white/5 my-1" />}
                {(lang === 'hi' || lang === 'both') && f.hindi && (
                  <p className="text-slate-400 text-xs">{f.hindi}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diet */}
      {(analysis.diet?.english?.length > 0 || analysis.diet?.hindi?.length > 0) && (
        <div className="space-y-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Utensils className="w-3 h-3" /> Kya Khayein / Diet
          </p>
          <div className="grid grid-cols-1 gap-1">
            {(lang !== 'hi' ? analysis.diet.english : []).map((item, i) => (
              <div key={`en-${i}`} className="flex items-start gap-1.5 text-xs text-green-300">
                <span className="text-green-500 mt-0.5">✓</span> {item}
              </div>
            ))}
            {lang === 'both' && analysis.diet.hindi?.length > 0 && <div className="h-px bg-white/5 my-1" />}
            {(lang !== 'en' ? analysis.diet.hindi : []).map((item, i) => (
              <div key={`hi-${i}`} className="flex items-start gap-1.5 text-xs text-green-300">
                <span className="text-green-500 mt-0.5">✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avoid */}
      {(analysis.avoid?.english?.length > 0 || analysis.avoid?.hindi?.length > 0) && (
        <div className="space-y-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <X className="w-3 h-3" /> Kya Na Khayein / Avoid
          </p>
          <div className="grid grid-cols-1 gap-1">
            {(lang !== 'hi' ? analysis.avoid.english : []).map((item, i) => (
              <div key={`en-${i}`} className="flex items-start gap-1.5 text-xs text-red-300">
                <span className="text-red-500 mt-0.5">✗</span> {item}
              </div>
            ))}
            {lang === 'both' && analysis.avoid.hindi?.length > 0 && <div className="h-px bg-white/5 my-1" />}
            {(lang !== 'en' ? analysis.avoid.hindi : []).map((item, i) => (
              <div key={`hi-${i}`} className="flex items-start gap-1.5 text-xs text-red-300">
                <span className="text-red-500 mt-0.5">✗</span> {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lifestyle */}
      {(analysis.lifestyle?.english?.length > 0 || analysis.lifestyle?.hindi?.length > 0) && (
        <div className="space-y-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Lifestyle Tips
          </p>
          <div className="grid grid-cols-1 gap-1">
            {(lang !== 'hi' ? analysis.lifestyle.english : []).map((item, i) => (
              <div key={`en-${i}`} className="flex items-start gap-1.5 text-xs text-blue-300">
                <span className="text-blue-400 mt-0.5">→</span> {item}
              </div>
            ))}
            {lang === 'both' && analysis.lifestyle.hindi?.length > 0 && <div className="h-px bg-white/5 my-1" />}
            {(lang !== 'en' ? analysis.lifestyle.hindi : []).map((item, i) => (
              <div key={`hi-${i}`} className="flex items-start gap-1.5 text-xs text-blue-300">
                <span className="text-blue-400 mt-0.5">→</span> {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* When to see doctor */}
      {analysis.whenToSeeDoctor && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <p className="text-amber-400 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Doctor se kab milein
          </p>
          {(lang === 'en' || lang === 'both') && analysis.whenToSeeDoctor.english && (
            <p className="text-slate-300 text-xs">{analysis.whenToSeeDoctor.english}</p>
          )}
          {lang === 'both' && <div className="h-px border-t border-amber-500/20" />}
          {(lang === 'hi' || lang === 'both') && analysis.whenToSeeDoctor.hindi && (
            <p className="text-slate-300 text-xs">{analysis.whenToSeeDoctor.hindi}</p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-slate-700 text-xs italic">
        ⚕️ {lang !== 'hi' ? (analysis.disclaimer?.english || '') : ''}{lang === 'both' ? ' • ' : ''}{lang !== 'en' ? (analysis.disclaimer?.hindi || '') : ''}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicalReportsPage() {
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [showUpload, setShowUpload]     = useState(false);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [filterType, setFilterType]     = useState('all');
  const [dragOver, setDragOver]         = useState(false);
  const [expandedId, setExpandedId]     = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: '', type: 'other', notes: '',
    doctorName: '', hospitalName: '', reportDate: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => { fetchReports(); }, [filterType]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? { type: filterType } : {};
      const { data } = await reportAPI.getAll(params);
      setReports(data.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large. Max 10MB.');
    setSelectedFile(file);
    if (file.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl(null);
    if (!form.title) setForm(p => ({ ...p, title: file.name.replace(/\.[^/.]+$/, '') }));
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error('Please select a file');
    if (!form.title) return toast.error('Please enter a title');

    setUploading(true);
    const fd = new FormData();
    fd.append('report', selectedFile);
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    try {
      toast.loading('Uploading & analyzing with AI…', { id: 'upload' });
      const { data } = await reportAPI.upload(fd);
      setReports(prev => [data.data, ...prev]);
      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setForm({ title: '', type: 'other', notes: '', doctorName: '', hospitalName: '', reportDate: '' });
      toast.success('Report uploaded & AI analyzed!', { id: 'upload' });
      // Auto-expand the new report to show AI analysis
      setExpandedId(data.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: 'upload' });
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report permanently?')) return;
    try {
      await reportAPI.delete(id);
      setReports(prev => prev.filter(r => r._id !== id));
      toast.success('Report deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleReanalyze = async (id) => {
    const { data } = await reportAPI.analyze(id);
    setReports(prev => prev.map(r => r._id === id ? data.data : r));
  };

  const getTypeLabel = (type) => reportTypes.find(t => t.value === type)?.label || 'Other';
  const getTypeColor = (type) => typeColors[type] || typeColors.other;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Medical Reports</h1>
          <p className="text-slate-400 text-sm">{reports.length} reports • AI analyzes each one in Hindi &amp; English</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2 self-start">
          <Upload className="w-4 h-4" /> Upload Report
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide glass p-1 rounded-xl w-fit">
        {[{ value: 'all', label: 'All' }, ...reportTypes.slice(0, 5)].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterType === tab.value
                ? 'bg-primary-500/30 text-primary-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-slate-400 font-medium mb-2">No reports yet</h3>
          <p className="text-slate-600 text-sm mb-6">Upload your medical report — AI will explain it in Hindi &amp; English</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <Upload className="w-4 h-4" /> Upload Report
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {reports.map((report, i) => {
              const isExpanded = expandedId === report._id;
              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="card group relative overflow-hidden"
                >
                  {/* Preview */}
                  <div className="h-28 rounded-xl overflow-hidden mb-3 bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    {report.fileType === 'image' ? (
                      <img src={report.fileUrl} alt={report.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <File className="w-9 h-9 text-slate-600" />
                        <span className="text-slate-600 text-xs">PDF Document</span>
                      </div>
                    )}
                  </div>

                  {/* Action overlay */}
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={report.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80">
                      <Eye className="w-3 h-3" />
                    </a>
                    <button onClick={() => handleDelete(report._id)}
                      className="w-7 h-7 rounded-lg bg-red-600/60 backdrop-blur flex items-center justify-center text-white hover:bg-red-600/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* AI badge */}
                  {report.aiAnalysis && (
                    <div className={`absolute top-4 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${severityColors[report.aiAnalysis.overallSeverity] || severityColors.normal}`}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {report.aiAnalysis.overallSeverity || 'analyzed'}
                    </div>
                  )}

                  <h3 className="text-white font-semibold text-sm truncate mb-2">{report.title}</h3>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`badge text-xs border ${getTypeColor(report.type)}`}>
                      {getTypeLabel(report.type)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    {report.doctorName && (
                      <div className="flex items-center gap-1.5"><User className="w-3 h-3" /><span className="truncate">{report.doctorName}</span></div>
                    )}
                    {report.hospitalName && (
                      <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /><span className="truncate">{report.hospitalName}</span></div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(report.reportDate || report.createdAt), 'dd MMM yyyy')}
                    </div>
                  </div>

                  {/* Expand AI Analysis button */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : report._id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all text-xs font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isExpanded ? 'Hide AI Analysis' : 'AI Analysis (Hindi + English)'}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* AI Analysis Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <AIAnalysisPanel
                          analysis={report.aiAnalysis}
                          reportId={report._id}
                          onReanalyze={handleReanalyze}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong w-full max-w-lg p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Upload Medical Report</h3>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    AI will analyze in Hindi + English automatically
                  </p>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-5 ${
                  dragOver ? 'border-primary-500/60 bg-primary-500/10' : 'border-white/[0.12] hover:border-white/20'
                }`}
              >
                <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={e => handleFileSelect(e.target.files[0])} />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    {previewUrl
                      ? <img src={previewUrl} alt="preview" className="w-24 h-24 object-cover rounded-xl" />
                      : <File className="w-12 h-12 text-primary-400" />}
                    <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-slate-500 text-xs">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-300 font-medium text-sm">Drop file here or click to browse</p>
                      <p className="text-slate-600 text-xs mt-1">Images (JPG, PNG) or PDF • Max 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2">Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Blood Test Report - January 2025" className="input-field" />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2">Report Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field">
                    {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-2">Doctor Name</label>
                    <input value={form.doctorName} onChange={e => setForm(p => ({ ...p, doctorName: e.target.value }))}
                      placeholder="Dr. Name" className="input-field" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-2">Report Date</label>
                    <input type="date" value={form.reportDate} onChange={e => setForm(p => ({ ...p, reportDate: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2">Hospital/Lab</label>
                  <input value={form.hospitalName} onChange={e => setForm(p => ({ ...p, hospitalName: e.target.value }))}
                    placeholder="Hospital or Lab name" className="input-field" />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2">Notes (helps AI analyze better)</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="e.g., patient has diabetes, symptoms include fatigue..." rows={2} className="input-field resize-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowUpload(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleUpload} disabled={uploading || !selectedFile || !form.title}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                    : <><Sparkles className="w-4 h-4" /> Upload &amp; Analyze</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}