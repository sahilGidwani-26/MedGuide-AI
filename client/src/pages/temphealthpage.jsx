import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Brain, Wind, ClipboardList, MessageCircle,
  ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  Smile, RefreshCw, Send, Trash2, Loader2,
  TrendingUp, Zap, History, BarChart2,
} from 'lucide-react';
import { mentalHealthAPI } from '../services/api';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const MOODS = [
  { emoji: '😄', label: 'Great', score: 5, color: '#15b38a' },
  { emoji: '🙂', label: 'Good',  score: 4, color: '#38bdf8' },
  { emoji: '😐', label: 'Okay',  score: 3, color: '#a78bfa' },
  { emoji: '😔', label: 'Low',   score: 2, color: '#fb923c' },
  { emoji: '😢', label: 'Bad',   score: 1, color: '#f43f5e' },
];

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things, such as reading or watching TV',
  'Moving or speaking so slowly that others noticed, or being fidgety/restless',
  'Thoughts that you would be better off dead, or of hurting yourself',
];

const PHQ9_OPTIONS = [
  { label: 'Not at all',        score: 0 },
  { label: 'Several days',      score: 1 },
  { label: 'More than half',    score: 2 },
  { label: 'Nearly every day',  score: 3 },
];

const getPHQ9Severity = (score) => {
  if (score <= 4)  return { label: 'Minimal',           color: '#15b38a', advice: 'Minimal depressive symptoms. Keep maintaining healthy habits.' };
  if (score <= 9)  return { label: 'Mild',              color: '#38bdf8', advice: 'Mild symptoms. Consider self-care and talking to someone you trust.' };
  if (score <= 14) return { label: 'Moderate',          color: '#fb923c', advice: 'Moderate symptoms. Speaking with a mental health professional is recommended.' };
  if (score <= 19) return { label: 'Moderately Severe', color: '#f97316', advice: 'Please consult a doctor soon. Therapy and/or medication can be very effective.' };
  return             { label: 'Severe',                 color: '#f43f5e', advice: 'Severe symptoms detected. Please seek help from a mental health professional immediately.' };
};

const BREATHING_PHASES = [
  { label: 'Inhale',  duration: 4, color: '#15b38a' },
  { label: 'Hold',    duration: 4, color: '#38bdf8' },
  { label: 'Exhale',  duration: 6, color: '#a78bfa' },
  { label: 'Hold',    duration: 2, color: '#fb923c' },
];

const TABS = [
  { id: 'mood',    label: 'Mood Track', icon: Smile         },
  { id: 'stress',  label: 'Stress',     icon: Zap           },
  { id: 'breathe', label: 'Breathe',    icon: Wind          },
  { id: 'chat',    label: 'AI Support', icon: MessageCircle },
  { id: 'phq9',    label: 'PHQ-9 Test', icon: ClipboardList },
];

const INIT_MSG = {
  role: 'assistant',
  content: "Hi 👋 I'm your mental health companion. How are you feeling today? You can share anything — I'm here to listen without judgment.",
  sentAt: new Date().toISOString(),
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function MentalHealthPage() {
  const [activeTab, setActiveTab] = useState('mood');
  const [pageLoading, setPageLoading] = useState(true);

  // ── Data from MongoDB ─────────────────────────────────────
  const [moodHistory,      setMoodHistory]      = useState([]);
  const [stressHistory,    setStressHistory]    = useState([]);
  const [breathingHistory, setBreathingHistory] = useState([]);
  const [phq9History,      setPhq9History]      = useState([]);
  const [chatHistory,      setChatHistory]      = useState([INIT_MSG]);

  // ── UI States ─────────────────────────────────────────────
  const [selectedMood,    setSelectedMood]   = useState(null);
  const [moodSaving,      setMoodSaving]     = useState(false);

  const [stressLevel,     setStressLevel]    = useState(5);
  const [stressSaving,    setStressSaving]   = useState(false);

  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase,     setBreathPhase]     = useState(0);
  const [breathCount,     setBreathCount]     = useState(0);
  const [breathTimer,     setBreathTimer]     = useState(BREATHING_PHASES[0].duration);
  const [breathSaving,    setBreathSaving]    = useState(false);
  const breathRef    = useRef(null);
  const breathStart  = useRef(null);

  const [chatInput,   setChatInput]    = useState('');
  const [chatLoading, setChatLoading]  = useState(false);
  const chatEndRef = useRef(null);

  const [phq9Answers, setPhq9Answers] = useState(Array(9).fill(null));
  const [phq9Step,    setPhq9Step]    = useState(0);
  const [phq9Score,   setPhq9Score]   = useState(null);
  const [phq9Saving,  setPhq9Saving]  = useState(false);

  // ── Load all data on mount ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await mentalHealthAPI.getData();
        const d = data.data;
        setMoodHistory     ([...d.moodHistory].reverse());
        setStressHistory   ([...d.stressHistory].reverse());
        setBreathingHistory([...d.breathingHistory].reverse());
        setPhq9History     ([...d.phq9History].reverse());
        if (d.chatHistory?.length > 0) {
          setChatHistory(d.chatHistory);
        }
      } catch (err) {
        console.error('Failed to load mental health data', err);
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  // ── Chat scroll ───────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ── Breathing engine ──────────────────────────────────────
  useEffect(() => {
    if (!breathingActive) { clearInterval(breathRef.current); return; }
    breathRef.current = setInterval(() => {
      setBreathTimer(prev => {
        if (prev <= 1) {
          setBreathPhase(p => {
            const next = (p + 1) % BREATHING_PHASES.length;
            if (next === 0) setBreathCount(c => c + 1);
            return next;
          });
          return BREATHING_PHASES[(breathPhase + 1) % BREATHING_PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(breathRef.current);
  }, [breathingActive, breathPhase]);

  const startBreathing = () => {
    setBreathPhase(0);
    setBreathTimer(BREATHING_PHASES[0].duration);
    setBreathCount(0);
    breathStart.current = Date.now();
    setBreathingActive(true);
  };

  const stopBreathing = async () => {
    setBreathingActive(false);
    setBreathPhase(0);
    setBreathTimer(4);
    if (breathCount < 1) return;

    const durationSec = Math.round((Date.now() - breathStart.current) / 1000);
    setBreathSaving(true);
    try {
      const { data } = await mentalHealthAPI.logBreathing({ cycles: breathCount, durationSec });
      setBreathingHistory(h => [data.data, ...h]);
      toast.success(`Session saved — ${breathCount} cycle${breathCount !== 1 ? 's' : ''}!`);
    } catch {
      toast.error('Could not save breathing session');
    } finally {
      setBreathSaving(false);
    }
  };

  // ── Log mood ──────────────────────────────────────────────
  const logMood = async () => {
    if (!selectedMood) return;
    setMoodSaving(true);
    try {
      const { data } = await mentalHealthAPI.logMood({
        emoji: selectedMood.emoji,
        label: selectedMood.label,
        score: selectedMood.score,
        color: selectedMood.color,
      });
      setMoodHistory(h => [data.data, ...h]);
      setSelectedMood(null);
      toast.success('Mood saved!');
    } catch {
      toast.error('Could not save mood');
    } finally {
      setMoodSaving(false);
    }
  };

  const clearMoods = async () => {
    try {
      await mentalHealthAPI.clearMoods();
      setMoodHistory([]);
      toast.success('Mood history cleared');
    } catch { toast.error('Failed to clear'); }
  };

  // ── Log stress ────────────────────────────────────────────
  const logStress = async () => {
    setStressSaving(true);
    try {
      const { data } = await mentalHealthAPI.logStress({ level: stressLevel });
      setStressHistory(h => [data.data, ...h]);
      toast.success('Stress level saved!');
    } catch {
      toast.error('Could not save stress level');
    } finally {
      setStressSaving(false);
    }
  };

  const clearStress = async () => {
    try {
      await mentalHealthAPI.clearStress();
      setStressHistory([]);
      toast.success('Stress history cleared');
    } catch { toast.error('Failed to clear'); }
  };

  // ── PHQ-9 ─────────────────────────────────────────────────
  const answerPHQ9 = async (score) => {
    const updated = [...phq9Answers];
    updated[phq9Step - 1] = score;
    setPhq9Answers(updated);

    if (phq9Step < 9) {
      setPhq9Step(s => s + 1);
    } else {
      const total = updated.reduce((a, b) => a + (b ?? 0), 0);
      const severity = getPHQ9Severity(total);
      setPhq9Score(total);
      setPhq9Step(10);
      setPhq9Saving(true);
      try {
        const { data } = await mentalHealthAPI.logPhq9({
          answers: updated,
          score: total,
          severityLabel: severity.label,
          severityColor: severity.color,
        });
        setPhq9History(h => [data.data, ...h]);
      } catch {
        toast.error('Could not save PHQ-9 result');
      } finally {
        setPhq9Saving(false);
      }
    }
  };

  const resetPHQ9 = () => {
    setPhq9Answers(Array(9).fill(null));
    setPhq9Step(0);
    setPhq9Score(null);
  };

  const clearPhq9 = async () => {
    try {
      await mentalHealthAPI.clearPhq9();
      setPhq9History([]);
      toast.success('PHQ-9 history cleared');
    } catch { toast.error('Failed to clear'); }
  };

  // ── AI Chat ───────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: 'user', content: chatInput, sentAt: new Date().toISOString() };
    setChatHistory(h => [...h, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data } = await mentalHealthAPI.sendMessage(chatInput);
      setChatHistory(h => [...h, data.data.aiMessage]);
    } catch {
      setChatHistory(h => [...h, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again.", sentAt: new Date().toISOString() }]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await mentalHealthAPI.clearChat();
      setChatHistory([INIT_MSG]);
      toast.success('Chat cleared');
    } catch { toast.error('Failed to clear chat'); }
  };

  const currentPhase  = BREATHING_PHASES[breathPhase];
  const phq9Progress  = phq9Step >= 1 && phq9Step <= 9 ? (phq9Step / 9) * 100 : 0;

  // ─────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mental Health Check</h1>
          <p className="text-slate-400 text-sm">All data saved securely to your account</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-2xl border border-white/[0.06] overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
              ${activeTab === id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}>
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════ MOOD TAB ══════════════════════════════ */}
        {activeTab === 'mood' && (
          <motion.div key="mood" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-1">How are you feeling today?</h2>
              <p className="text-slate-400 text-sm mb-6">Tap an emoji to log your current mood</p>

              <div className="flex justify-center gap-3 sm:gap-5 mb-6">
                {MOODS.map((mood) => (
                  <button key={mood.label} onClick={() => setSelectedMood(mood)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all
                      ${selectedMood?.label === mood.label ? 'scale-110' : 'border-white/[0.06] hover:border-white/20 hover:scale-105'}`}
                    style={selectedMood?.label === mood.label
                      ? { borderColor: mood.color, background: `${mood.color}15`, boxShadow: `0 0 20px ${mood.color}30` }
                      : {}}>
                    <span className="text-3xl sm:text-4xl">{mood.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: selectedMood?.label === mood.label ? mood.color : '#94a3b8' }}>{mood.label}</span>
                  </button>
                ))}
              </div>

              <button onClick={logMood} disabled={!selectedMood || moodSaving}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                  ${selectedMood && !moodSaving
                    ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30'
                    : 'bg-slate-800/50 border border-white/[0.04] text-slate-600 cursor-not-allowed'}`}>
                {moodSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Log This Mood'}
              </button>
            </div>

            {/* Mood History */}
            {moodHistory.length > 0 && (
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <History className="w-4 h-4 text-violet-400" />
                    Mood History <span className="text-slate-500 text-xs font-normal">({moodHistory.length} entries)</span>
                  </h3>
                  <button onClick={clearMoods} className="text-xs text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                </div>

                {/* Mini bar chart */}
                {moodHistory.length >= 3 && (
                  <div className="mb-4">
                    <p className="text-slate-500 text-xs mb-2 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Mood Trend (latest 14)</p>
                    <div className="flex items-end gap-1 h-10">
                      {[...moodHistory].slice(0, 14).reverse().map((e, i) => (
                        <div key={i} className="flex-1 rounded-t-sm" title={`${e.label} — ${fmtDate(e.loggedAt)}`}
                          style={{ height: `${(e.score / 5) * 100}%`, background: e.color, opacity: 0.75 }} />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1"><span>Oldest</span><span>Latest</span></div>
                  </div>
                )}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {moodHistory.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40">
                      <span className="text-2xl">{e.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{e.label}</p>
                        <p className="text-slate-500 text-xs">{fmtTime(e.loggedAt)} · {fmtDate(e.loggedAt)}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {[1,2,3,4,5].map(s => (
                          <div key={s} className="w-2 h-2 rounded-full" style={{ background: s <= e.score ? e.color : '#1e293b' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ STRESS TAB ════════════════════════════ */}
        {activeTab === 'stress' && (
          <motion.div key="stress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-1">Stress Level Check</h2>
              <p className="text-slate-400 text-sm mb-8">Rate your current stress from 1 (calm) to 10 (overwhelmed)</p>

              <div className="flex flex-col items-center mb-8">
                <div className="w-28 h-28 rounded-full border-4 flex items-center justify-center mb-3 transition-all duration-300"
                  style={{
                    borderColor: stressLevel <= 3 ? '#15b38a' : stressLevel <= 6 ? '#fb923c' : '#f43f5e',
                    background:  stressLevel <= 3 ? '#15b38a15' : stressLevel <= 6 ? '#fb923c15' : '#f43f5e15',
                    boxShadow: `0 0 30px ${stressLevel <= 3 ? '#15b38a' : stressLevel <= 6 ? '#fb923c' : '#f43f5e'}25`,
                  }}>
                  <span className="text-4xl font-bold text-white">{stressLevel}</span>
                </div>
                <p className="text-slate-300 font-medium">
                  {stressLevel <= 2 ? '😌 Very Calm' : stressLevel <= 4 ? '🙂 Manageable' : stressLevel <= 6 ? '😤 Moderate' : stressLevel <= 8 ? '😰 High Stress' : '🆘 Overwhelmed'}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-2"><span>1 – Calm</span><span>10 – Overwhelmed</span></div>
                <input type="range" min={1} max={10} value={stressLevel} onChange={e => setStressLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, ${stressLevel <= 3 ? '#15b38a' : stressLevel <= 6 ? '#fb923c' : '#f43f5e'} ${(stressLevel - 1) / 9 * 100}%, #1e293b ${(stressLevel - 1) / 9 * 100}%)` }} />
                <div className="flex justify-between mt-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setStressLevel(n)} className={`text-xs w-6 h-6 rounded-full transition-all ${stressLevel === n ? 'text-white font-bold scale-110' : 'text-slate-600 hover:text-slate-400'}`}>{n}</button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/40 rounded-xl p-4 mb-4">
                <p className="text-slate-300 text-sm font-medium mb-1">💡 Suggested Actions</p>
                {stressLevel <= 3 && <p className="text-slate-400 text-sm">You're doing great! Maintain healthy habits — sleep, exercise, and connection.</p>}
                {stressLevel > 3 && stressLevel <= 6 && <p className="text-slate-400 text-sm">Try a 5-minute breathing exercise or a short walk. Identify what's triggering you.</p>}
                {stressLevel > 6 && stressLevel <= 8 && <p className="text-slate-400 text-sm">High stress needs attention. Try guided breathing and consider speaking to a counselor.</p>}
                {stressLevel > 8 && <p className="text-slate-400 text-sm">You seem overwhelmed. Please reach out — iCall India: <span className="text-white font-semibold">9152987821</span></p>}
              </div>

              <button onClick={logStress} disabled={stressSaving}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {stressSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Log Stress Level'}
              </button>
            </div>

            {/* Stress History */}
            {stressHistory.length > 0 && (
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <History className="w-4 h-4 text-violet-400" />
                    Stress History <span className="text-slate-500 text-xs font-normal">({stressHistory.length} entries)</span>
                  </h3>
                  <button onClick={clearStress} className="text-xs text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                </div>

                {stressHistory.length >= 2 && (
                  <div className="mb-3">
                    <p className="text-slate-500 text-xs mb-2 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Stress Trend (latest 14)</p>
                    <div className="flex items-end gap-1 h-12">
                      {[...stressHistory].slice(0, 14).reverse().map((e, i) => {
                        const c = e.level <= 3 ? '#15b38a' : e.level <= 6 ? '#fb923c' : '#f43f5e';
                        return <div key={i} className="flex-1 rounded-t-sm" title={`Level ${e.level} — ${fmtDate(e.loggedAt)}`}
                          style={{ height: `${(e.level / 10) * 100}%`, background: c, opacity: 0.8 }} />;
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1"><span>Oldest</span><span>Latest</span></div>
                  </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {stressHistory.map((e, i) => {
                    const c = e.level <= 3 ? '#15b38a' : e.level <= 6 ? '#fb923c' : '#f43f5e';
                    const lbl = e.level <= 2 ? 'Very Calm' : e.level <= 4 ? 'Manageable' : e.level <= 6 ? 'Moderate' : e.level <= 8 ? 'High Stress' : 'Overwhelmed';
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: `${c}20`, color: c }}>{e.level}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{lbl}</p>
                          <p className="text-slate-500 text-xs">{fmtTime(e.loggedAt)} · {fmtDate(e.loggedAt)}</p>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                          <div className="h-full rounded-full" style={{ width: `${e.level * 10}%`, background: c }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ BREATHING TAB ═════════════════════════ */}
        {activeTab === 'breathe' && (
          <motion.div key="breathe" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 text-center">
              <h2 className="text-white font-semibold mb-1">4-4-6-2 Box Breathing</h2>
              <p className="text-slate-400 text-sm mb-8">A clinically proven technique to reduce anxiety and calm your nervous system</p>

              <div className="flex items-center justify-center mb-8">
                <div className="relative w-52 h-52">
                  <AnimatePresence>
                    {breathingActive && (
                      <motion.div key={breathPhase} className="absolute inset-0 rounded-full"
                        style={{ background: `${currentPhase.color}20` }}
                        animate={{ scale: currentPhase.label === 'Inhale' ? [1, 1.15] : currentPhase.label === 'Exhale' ? [1.15, 1] : 1.1 }}
                        transition={{ duration: currentPhase.duration, ease: 'easeInOut' }} />
                    )}
                  </AnimatePresence>
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#1e293b" strokeWidth="8" />
                    {breathingActive && (
                      <motion.circle cx="100" cy="100" r="90" fill="none"
                        stroke={currentPhase.color} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 90}`}
                        animate={{ strokeDashoffset: [2 * Math.PI * 90, 0] }}
                        transition={{ duration: currentPhase.duration, ease: 'linear' }}
                        key={`${breathPhase}-${breathCount}`} />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {breathingActive ? (
                      <>
                        <p className="text-2xl font-bold" style={{ color: currentPhase.color }}>{currentPhase.label}</p>
                        <p className="text-5xl font-bold text-white mt-1">{breathTimer}</p>
                        <p className="text-slate-500 text-xs mt-1">seconds</p>
                      </>
                    ) : (
                      <><Wind className="w-10 h-10 text-slate-500 mb-2" /><p className="text-slate-400 text-sm">Ready</p></>
                    )}
                  </div>
                </div>
              </div>

              {breathingActive && (
                <div className="flex justify-center gap-2 mb-5">
                  {BREATHING_PHASES.map((phase, i) => (
                    <div key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={i === breathPhase
                        ? { borderColor: phase.color, background: `${phase.color}20`, color: phase.color }
                        : { borderColor: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
                      {phase.label} {phase.duration}s
                    </div>
                  ))}
                </div>
              )}
              {breathingActive && breathCount > 0 && (
                <p className="text-slate-400 text-sm mb-4">🌬️ {breathCount} cycle{breathCount !== 1 ? 's' : ''} completed</p>
              )}

              {!breathingActive ? (
                <button onClick={startBreathing} className="w-full py-3 rounded-xl font-semibold text-sm bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30 transition-all flex items-center justify-center gap-2">
                  <Wind className="w-4 h-4" /> Start Breathing Exercise
                </button>
              ) : (
                <button onClick={stopBreathing} disabled={breathSaving} className="w-full py-3 rounded-xl font-semibold text-sm bg-slate-800/60 border border-white/[0.06] text-slate-300 hover:bg-slate-700/60 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {breathSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Stop & Save Session'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BREATHING_PHASES.map((phase, i) => (
                <div key={i} className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-3 text-center">
                  <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: `${phase.color}20` }}>
                    <span className="font-bold text-sm" style={{ color: phase.color }}>{phase.duration}s</span>
                  </div>
                  <p className="text-white text-sm font-medium">{phase.label}</p>
                  <p className="text-slate-500 text-xs">{i === 0 ? 'Breathe in' : i === 1 ? 'Pause' : i === 2 ? 'Breathe out' : 'Rest'}</p>
                </div>
              ))}
            </div>

            {/* Breathing History */}
            {breathingHistory.length > 0 && (
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <History className="w-4 h-4 text-teal-400" />
                    Session History <span className="text-slate-500 text-xs font-normal">({breathingHistory.length} sessions)</span>
                  </h3>
                  <button onClick={async () => { await mentalHealthAPI.clearBreathing(); setBreathingHistory([]); toast.success('Cleared'); }}
                    className="text-xs text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {breathingHistory.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <Wind className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{e.cycles} cycle{e.cycles !== 1 ? 's' : ''}</p>
                        <p className="text-slate-500 text-xs">{fmtTime(e.loggedAt)} · {fmtDate(e.loggedAt)}{e.durationSec > 0 ? ` · ${Math.round(e.durationSec / 60)}m` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ CHAT TAB ══════════════════════════════ */}
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col" style={{ height: '520px' }}>
              <div className="flex items-center gap-3 p-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Mental Health AI</p>
                  <p className="text-teal-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                    Compassionate · Saved to your account
                  </p>
                </div>
                <button onClick={clearChat} title="Clear chat" className="ml-auto p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-violet-500/20 border border-violet-500/30 text-slate-200 rounded-br-sm'
                        : 'bg-slate-800/60 border border-white/[0.06] text-slate-300 rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/60 border border-white/[0.06] px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 border-t border-white/[0.06] flex gap-2 flex-shrink-0">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder="Share how you're feeling..."
                  className="flex-1 bg-slate-800/60 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/40 transition-all" />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                  className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 hover:bg-violet-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {["I'm feeling anxious", "I can't sleep", "I feel overwhelmed", "I need motivation"].map(p => (
                <button key={p} onClick={() => setChatInput(p)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all">
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════════ PHQ-9 TAB ═════════════════════════════ */}
        {activeTab === 'phq9' && (
          <motion.div key="phq9" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6">

              {/* Intro */}
              {phq9Step === 0 && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">PHQ-9 Depression Screening</h2>
                  <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                    The Patient Health Questionnaire-9 is a validated medical tool used globally to screen for depression. Takes ~2 minutes.
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left">
                    <p className="text-amber-300 text-xs font-medium mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Important</p>
                    <p className="text-slate-400 text-xs leading-relaxed">This is for informational purposes only, not a diagnosis. Consult a qualified professional for proper evaluation.</p>
                  </div>
                  <button onClick={() => setPhq9Step(1)} className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all flex items-center justify-center gap-2">
                    Begin Screening <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Questions */}
              {phq9Step >= 1 && phq9Step <= 9 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-slate-400 text-sm font-medium">{phq9Step}/9</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${phq9Progress}%` }} />
                    </div>
                    <button onClick={() => phq9Step > 1 ? setPhq9Step(s => s - 1) : setPhq9Step(0)} className="text-slate-500 hover:text-slate-300 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-400 text-xs mb-3">Over the last 2 weeks, how often have you been bothered by:</p>
                  <h3 className="text-white font-semibold text-lg mb-6 leading-snug">{PHQ9_QUESTIONS[phq9Step - 1]}</h3>
                  <div className="space-y-2">
                    {PHQ9_OPTIONS.map(({ label, score }) => (
                      <button key={score} onClick={() => answerPHQ9(score)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/[0.06] text-slate-300 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all text-sm font-medium group">
                        <span>{label}</span>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-violet-400 flex items-center justify-center transition-all">
                          <div className="w-2 h-2 rounded-full bg-violet-400 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {phq9Step === 10 && phq9Score !== null && (() => {
                const severity = getPHQ9Severity(phq9Score);
                return (
                  <div className="text-center py-2">
                    {phq9Saving ? (
                      <div className="flex flex-col items-center gap-3 py-8">
                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                        <p className="text-slate-400 text-sm">Saving result...</p>
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: severity.color }} />
                        <h2 className="text-xl font-bold text-white mb-1">Screening Complete</h2>
                        <p className="text-slate-400 text-sm mb-6">Based on your responses over the last 2 weeks</p>

                        <div className="rounded-2xl p-5 mb-5 border" style={{ background: `${severity.color}15`, borderColor: `${severity.color}40` }}>
                          <p className="text-sm text-slate-400 mb-1">Your PHQ-9 Score</p>
                          <p className="text-5xl font-bold mb-2" style={{ color: severity.color }}>{phq9Score}</p>
                          <p className="font-semibold text-lg" style={{ color: severity.color }}>{severity.label} Depression</p>
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed mb-6 text-left bg-slate-800/40 rounded-xl p-4">{severity.advice}</p>

                        {phq9Score >= 10 && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-left">
                            <p className="text-red-300 text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Helplines (India)</p>
                            <div className="space-y-1">
                              <p className="text-slate-400 text-xs">iCall (TISS): <span className="text-white font-medium">9152987821</span></p>
                              <p className="text-slate-400 text-xs">Vandrevala Foundation: <span className="text-white font-medium">1860-2662-345</span></p>
                              <p className="text-slate-400 text-xs">NIMHANS: <span className="text-white font-medium">080-46110007</span></p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button onClick={resetPHQ9} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-slate-800/60 border border-white/[0.06] text-slate-300 hover:bg-slate-700/60 transition-all flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Retake
                          </button>
                          <button onClick={() => setActiveTab('chat')} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all flex items-center justify-center gap-2">
                            <MessageCircle className="w-4 h-4" /> Talk to AI
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* PHQ-9 History */}
            {phq9History.length > 0 && (
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <History className="w-4 h-4 text-violet-400" />
                    Past Screenings <span className="text-slate-500 text-xs font-normal">({phq9History.length})</span>
                  </h3>
                  <button onClick={clearPhq9} className="text-xs text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {phq9History.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: `${e.severityColor}20`, color: e.severityColor }}>{e.score}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{e.severityLabel}</p>
                        <p className="text-slate-500 text-xs">{fmtTime(e.loggedAt)} · {fmtDate(e.loggedAt)}</p>
                      </div>
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${(e.score / 27) * 100}%`, background: e.severityColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}