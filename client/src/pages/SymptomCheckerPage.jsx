import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, AlertTriangle, CheckCircle, Info,
  ChevronDown, ChevronUp, Loader2, RotateCcw, Activity
} from 'lucide-react';
import { symptomAPI } from '../services/api';
import toast from 'react-hot-toast';

const severityConfig = {
  low: { label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', icon: CheckCircle, score: '1-3' },
  medium: { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: Info, score: '4-6' },
  high: { label: 'High Risk', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', icon: AlertTriangle, score: '7-8' },
  critical: { label: 'Critical', color: 'text-danger-400', bg: 'bg-danger-400/10', border: 'border-danger-400/30', icon: AlertTriangle, score: '9-10' },
};

const sampleSymptoms = [
  'Fever and headache since yesterday',
  'Chest pain and shortness of breath',
  'Severe stomach pain and vomiting',
  'Skin rash and itching all over body',
  'Dizziness and blurred vision',
];

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const recognitionRef = useRef(null);
  const [expandedSection, setExpandedSection] = useState('conditions');

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in your browser');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setSymptoms(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => { setListening(false); toast.error('Voice recognition error'); };
    recognition.onend = () => setListening(false);
    recognition.start();
  }, [listening, language]);

  const handleAnalyze = async () => {
    if (!symptoms.trim() || symptoms.trim().length < 3) {
      return toast.error('Please describe your symptoms in at least a few words');
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await symptomAPI.analyze({ symptoms: symptoms.trim(), inputMethod: 'text' });
      setResult(data.data);
      if (data.data.aiAnalysis?.isEmergency) {
        toast.error('⚠️ Emergency symptoms detected! Please seek immediate medical help.', { duration: 6000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally { setLoading(false); }
  };

  const cfg = result ? (severityConfig[result.aiAnalysis?.severityLevel] || severityConfig.low) : null;

  const Section = ({ id, title, children }) => (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-slate-200 font-semibold text-sm">{title}</span>
        {expandedSection === id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {expandedSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-1">AI Symptom Checker</h1>
        <p className="text-slate-400 text-sm">Describe your symptoms and get instant AI-powered health insights</p>
      </div>

      {/* Input card */}
      <div className="card">
        {/* Language + Voice toggle */}
        <div className="flex items-center justify-between mb-4">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500/60"
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi</option>
            <option value="en-US">English (US)</option>
          </select>
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              listening
                ? 'bg-danger-500/20 text-danger-400 border border-danger-500/40 animate-pulse'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? 'Listening...' : 'Voice Input'}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={symptoms}
          onChange={e => setSymptoms(e.target.value)}
          placeholder="Describe your symptoms in detail...&#10;e.g., I have been experiencing fever of 101°F since yesterday, along with a severe headache and body aches..."
          rows={5}
          className="input-field resize-none text-base leading-relaxed mb-4"
        />

        {/* Sample symptoms */}
        <div className="mb-5">
          <p className="text-slate-600 text-xs mb-2">Quick examples:</p>
          <div className="flex flex-wrap gap-2">
            {sampleSymptoms.map(s => (
              <button
                key={s}
                onClick={() => setSymptoms(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
            className="btn-primary flex items-center gap-2 flex-1"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Activity className="w-4 h-4" /> Analyze Symptoms</>
            )}
          </button>
          {symptoms && (
            <button onClick={() => { setSymptoms(''); setResult(null); }} className="btn-ghost px-4">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Emergency Warning */}
            {result.aiAnalysis?.isEmergency && (
              <div className="glass border border-danger-500/50 p-5 rounded-2xl glow-danger">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-danger-500/30 flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-danger-400" />
                  </div>
                  <h3 className="text-danger-300 font-bold text-lg">⚠️ Emergency Alert</h3>
                </div>
                <p className="text-danger-200 text-sm">{result.aiAnalysis.emergencyWarning || 'These symptoms may be life-threatening. Please call emergency services immediately!'}</p>
                <button
                  onClick={() => window.open('tel:112')}
                  className="btn-danger mt-4 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" /> Call 112 Now
                </button>
              </div>
            )}

            {/* Severity badge */}
            <div className={`card border ${cfg.border} ${cfg.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <cfg.icon className={`w-6 h-6 ${cfg.color}`} />
                  <div>
                    <p className="text-white font-bold">Severity: {cfg.label}</p>
                    <p className="text-slate-400 text-sm">Score: {result.aiAnalysis?.severityScore}/10</p>
                  </div>
                </div>
                <div className={`text-3xl font-display font-extrabold ${cfg.color}`}>
                  {result.aiAnalysis?.severityScore}
                  <span className="text-slate-600 text-lg">/10</span>
                </div>
              </div>
              {/* Score bar */}
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.aiAnalysis?.severityScore / 10) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    result.aiAnalysis?.severityLevel === 'critical' ? 'bg-danger-500' :
                    result.aiAnalysis?.severityLevel === 'high' ? 'bg-orange-500' :
                    result.aiAnalysis?.severityLevel === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                />
              </div>
            </div>

            {/* Doctor Recommendation */}
            <div className="card">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Recommended Specialist</p>
              <p className="text-white font-bold text-lg">{result.aiAnalysis?.recommendedDoctorType}</p>
              <p className="text-slate-400 text-sm mt-1">{result.aiAnalysis?.whenToSeekHelp}</p>
            </div>

            {/* Collapsible sections */}
            <div className="space-y-2">
              <Section id="conditions" title={`Possible Conditions (${result.aiAnalysis?.possibleConditions?.length || 0})`}>
                <div className="space-y-3 pt-2">
                  {result.aiAnalysis?.possibleConditions?.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-200 font-medium text-sm">{c.name}</span>
                        <span className={`badge text-xs ${c.probability === 'high' ? 'badge-emergency' : c.probability === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                          {c.probability}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs">{c.description}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="precautions" title={`Precautions (${result.aiAnalysis?.precautions?.length || 0})`}>
                <ul className="space-y-2 pt-2">
                  {result.aiAnalysis?.precautions?.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section id="actions" title="Immediate Actions">
                <ul className="space-y-2 pt-2">
                  {result.aiAnalysis?.immediateActions?.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
                      <span className="text-primary-400 font-bold text-xs mt-0.5 min-w-[20px]">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </Section>

              {result.aiAnalysis?.homeRemedies?.length > 0 && (
                <Section id="remedies" title="Home Remedies">
                  <ul className="space-y-2 pt-2">
                    {result.aiAnalysis.homeRemedies.map((r, i) => (
                      <li key={i} className="text-slate-400 text-sm flex items-start gap-2">
                        <span className="text-amber-400">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            {/* Disclaimer */}
            <div className="glass-darker p-4 rounded-xl border border-white/[0.04]">
              <p className="text-slate-600 text-xs">⚠️ {result.aiAnalysis?.disclaimer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
