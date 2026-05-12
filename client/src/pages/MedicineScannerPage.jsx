import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Search, Loader2, AlertTriangle, CheckCircle,
  Info, X, Pill, Shield, Zap, FlaskConical, Plus, Trash2,
  ChevronDown, ChevronUp, ScanLine, RotateCcw, Languages
} from 'lucide-react';
import { medicineAPI } from '../services/api';
import toast from 'react-hot-toast';

const severityColor = {
  mild: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  moderate: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  severe: 'text-danger-400 bg-danger-400/10 border-danger-400/30',
};

const riskColor = {
  safe: 'text-green-400 border-green-400/30 bg-green-400/10',
  caution: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  dangerous: 'text-danger-400 border-danger-400/30 bg-danger-400/10',
};

// ── Hindi translations for labels ─────────────────────────────────────────────
const LABELS = {
  en: {
    title: 'Medicine Scanner',
    subtitle: 'Scan medicine packaging or search by name to get AI-powered drug information',
    scanTab: 'Scan Image',
    searchTab: 'Search by Name',
    interactionTab: 'Drug Interaction',
    searchPlaceholder: 'e.g. Paracetamol, Dolo 650, Azithromycin...',
    commonMeds: 'Common medicines:',
    searchBtn: 'Search',
    scanBtn: 'Scan Medicine',
    scanning: 'Scanning...',
    searching: 'Searching...',
    checking: 'Checking...',
    openCamera: 'Open Camera',
    uploadHint: 'Drop medicine photo here',
    uploadSubHint: 'or click to browse • JPG, PNG • Max 5MB',
    dosage: 'DOSAGE',
    storage: 'Storage',
    expiry: 'Expiry',
    generic: 'Generic:',
    by: 'by',
    uses: 'Uses & Indications',
    composition: 'Composition',
    sideEffects: 'Side Effects',
    warnings: 'Warnings',
    drugInteractions: 'Drug Interactions',
    overallRisk: 'Overall Risk',
    addMedicine: 'Add Medicine',
    checkInteraction: 'Check Interaction',
    rxRequired: 'Rx Required',
    confidence: 'confidence',
    disclaimer: '⚠️',
    imageTip: 'Take a clear photo of medicine strip, bottle, or packaging. Make sure the name is visible.',
    interactionTip: 'Enter 2 or more medicines to check if they can be taken together safely.',
    noResult: 'Enter medicine name above and click Search',
  },
  hi: {
    title: 'दवाई स्कैनर',
    subtitle: 'दवाई की पैकेजिंग स्कैन करें या नाम से खोजें — AI द्वारा पूरी जानकारी पाएं',
    scanTab: 'फोटो स्कैन करें',
    searchTab: 'नाम से खोजें',
    interactionTab: 'दवाई की प्रतिक्रिया',
    searchPlaceholder: 'जैसे: Paracetamol, Dolo 650, Azithromycin...',
    commonMeds: 'आम दवाइयां:',
    searchBtn: 'खोजें',
    scanBtn: 'दवाई स्कैन करें',
    scanning: 'स्कैन हो रहा है...',
    searching: 'खोजा जा रहा है...',
    checking: 'जांच हो रही है...',
    openCamera: 'कैमरा खोलें',
    uploadHint: 'दवाई की फोटो यहाँ डालें',
    uploadSubHint: 'या क्लिक करके चुनें • JPG, PNG • अधिकतम 5MB',
    dosage: 'खुराक (DOSAGE)',
    storage: 'भंडारण',
    expiry: 'समाप्ति तिथि',
    generic: 'जेनेरिक नाम:',
    by: 'निर्माता:',
    uses: 'उपयोग एवं संकेत',
    composition: 'संरचना (Composition)',
    sideEffects: 'दुष्प्रभाव (Side Effects)',
    warnings: 'चेतावनियाँ',
    drugInteractions: 'दवाई प्रतिक्रियाएं',
    overallRisk: 'कुल जोखिम',
    addMedicine: 'दवाई जोड़ें',
    checkInteraction: 'प्रतिक्रिया जांचें',
    rxRequired: 'डॉक्टर पर्ची जरूरी',
    confidence: 'विश्वसनीयता',
    disclaimer: '⚠️',
    imageTip: 'दवाई की स्ट्रिप, बोतल या पैकेजिंग की साफ फोटो लें। नाम दिखना जरूरी है।',
    interactionTip: '2 या अधिक दवाइयों के नाम डालें और जांचें कि क्या उन्हें एक साथ लेना सुरक्षित है।',
    noResult: 'ऊपर दवाई का नाम डालें और खोजें बटन दबाएं',
  }
};

// ── Translate result fields to Hindi using Groq ───────────────────────────────
const translateToHindi = async (result) => {
  try {
    const { default: api } = await import('../services/api');
    const textToTranslate = JSON.stringify({
      uses: result.uses,
      sideEffects: result.sideEffects,
      warnings: result.warnings,
      dosage: result.dosage,
      storageInstructions: result.storageInstructions,
      drugInteractions: result.drugInteractions,
      additionalInfo: result.additionalInfo,
    });

    const { data } = await api.post('/medicine/translate', { text: textToTranslate });
    return data.data;
  } catch {
    return null;
  }
};

export default function MedicineScannerPage() {
  const [lang, setLang] = useState('en');
  const [mode, setMode] = useState('search');
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [result, setResult] = useState(null);
  const [resultHindi, setResultHindi] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState('uses');
  const [interactionList, setInteractionList] = useState(['', '']);
  const [interactionResult, setInteractionResult] = useState(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const L = LABELS[lang];

  const handleImageSelect = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image too large. Max 5MB.');
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setResult(null);
    setResultHindi(null);
  };

  const fetchHindiTranslation = async (res) => {
    setTranslating(true);
    const hindi = await translateToHindi(res);
    if (hindi) setResultHindi(hindi);
    else setResultHindi(null);
    setTranslating(false);
  };

  const handleScan = async () => {
    if (!imageFile) return toast.error('Please select a medicine image');
    setLoading(true); setResult(null); setResultHindi(null);
    try {
      const fd = new FormData();
      fd.append('medicine', imageFile);
      const { data } = await medicineAPI.scan(fd);
      setResult(data.data);
      toast.success('Medicine scanned!');
      fetchHindiTranslation(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed');
    } finally { setLoading(false); }
  };

  const handleTextSearch = async () => {
    if (!medicineName.trim() || medicineName.trim().length < 2) return toast.error('Enter medicine name');
    setLoading(true); setResult(null); setResultHindi(null);
    try {
      const { data } = await medicineAPI.searchByName(medicineName.trim());
      setResult(data.data);
      toast.success('Medicine info found!');
      fetchHindiTranslation(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally { setLoading(false); }
  };

  const handleInteractionCheck = async () => {
    const meds = interactionList.filter(m => m.trim().length > 1);
    if (meds.length < 2) return toast.error('Enter at least 2 medicines');
    setLoading(true); setInteractionResult(null);
    try {
      const { data } = await medicineAPI.checkInteraction(meds);
      setInteractionResult(data.data);
      toast.success('Interaction check complete!');
    } catch { toast.error('Check failed'); }
    finally { setLoading(false); }
  };

  // Get current language data
  const getField = (enField, hiField) => {
    if (lang === 'hi' && resultHindi && hiField) return hiField;
    return enField;
  };

  const Section = ({ id, title, icon: Icon, children, count }) => (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary-400" />
          <span className="text-slate-200 font-semibold text-sm">{title}</span>
          {count > 0 && <span className="badge badge-info text-xs">{count}</span>}
        </div>
        {expandedSection === id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {expandedSection === id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const tabs = [
    { id: 'scan', label: L.scanTab, icon: Camera },
    { id: 'search', label: L.searchTab, icon: Search },
    { id: 'interaction', label: L.interactionTab, icon: FlaskConical },
  ];

  // Which data to show based on language
  const displayUses = lang === 'hi' && resultHindi?.uses ? resultHindi.uses : result?.uses;
  const displaySideEffects = lang === 'hi' && resultHindi?.sideEffects ? resultHindi.sideEffects : result?.sideEffects;
  const displayWarnings = lang === 'hi' && resultHindi?.warnings ? resultHindi.warnings : result?.warnings;
  const displayDosage = lang === 'hi' && resultHindi?.dosage ? resultHindi.dosage : result?.dosage;
  const displayStorage = lang === 'hi' && resultHindi?.storageInstructions ? resultHindi.storageInstructions : result?.storageInstructions;
  const displayInteractions = lang === 'hi' && resultHindi?.drugInteractions ? resultHindi.drugInteractions : result?.drugInteractions;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header with language toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            {L.title}
          </h1>
          <p className="text-slate-400 text-sm">{L.subtitle}</p>
        </div>

        {/* Language Toggle */}
        <div className="flex-shrink-0">
          <div className="glass p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                lang === 'en' ? 'bg-primary-500/30 text-primary-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                lang === 'hi' ? 'bg-orange-500/30 text-orange-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              हिंदी
            </button>
          </div>
          {lang === 'hi' && translating && (
            <p className="text-xs text-orange-400 mt-1 text-center flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> अनुवाद हो रहा है...
            </p>
          )}
          {lang === 'hi' && result && !translating && resultHindi && (
            <p className="text-xs text-green-400 mt-1 text-center">✓ हिंदी में अनुवादित</p>
          )}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 glass p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setMode(tab.id); setResult(null); setInteractionResult(null); setResultHindi(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === tab.id ? 'bg-primary-500/30 text-primary-300 border border-primary-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SCAN MODE */}
      {mode === 'scan' && (
        <div className="card space-y-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-300 text-sm">{L.imageTip}</p>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleImageSelect(e.dataTransfer.files[0]); }}
            className="border-2 border-dashed border-white/[0.12] hover:border-primary-500/40 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-white/[0.02]"
          >
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleImageSelect(e.target.files[0])} />
            {image ? (
              <div className="relative">
                <img src={image} alt="Medicine" className="max-h-64 mx-auto rounded-xl object-contain" />
                <button onClick={e => { e.stopPropagation(); setImage(null); setImageFile(null); setResult(null); setResultHindi(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-300 font-medium">{L.uploadHint}</p>
                  <p className="text-slate-500 text-sm mt-1">{L.uploadSubHint}</p>
                </div>
              </div>
            )}
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleImageSelect(e.target.files[0])} />
          <div className="flex gap-3">
            <button onClick={() => cameraRef.current?.click()} className="btn-ghost flex items-center gap-2 flex-1">
              <Camera className="w-4 h-4" /> {L.openCamera}
            </button>
            <button onClick={handleScan} disabled={loading || !imageFile} className="btn-primary flex items-center gap-2 flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{L.scanning}</> : <><ScanLine className="w-4 h-4" />{L.scanBtn}</>}
            </button>
          </div>
        </div>
      )}

      {/* SEARCH MODE */}
      {mode === 'search' && (
        <div className="card space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={medicineName}
                onChange={e => setMedicineName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTextSearch()}
                placeholder={L.searchPlaceholder}
                className="input-field pl-11"
              />
            </div>
            <button onClick={handleTextSearch} disabled={loading || !medicineName.trim()} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? L.searching : L.searchBtn}
            </button>
          </div>
          <div>
            <p className="text-slate-600 text-xs mb-2">{L.commonMeds}</p>
            <div className="flex flex-wrap gap-2">
              {['Paracetamol', 'Aspirin', 'Metformin', 'Amoxicillin', 'Omeprazole', 'Cetirizine', 'Dolo 650', 'Azithromycin'].map(med => (
                <button key={med} onClick={() => setMedicineName(med)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
                  {med}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTION MODE */}
      {mode === 'interaction' && (
        <div className="card space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">{L.interactionTip}</p>
          </div>
          <div className="space-y-3">
            {interactionList.map((med, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-7 h-10 flex items-center justify-center text-slate-500 text-sm font-bold flex-shrink-0">{i + 1}.</div>
                <input
                  type="text" value={med}
                  onChange={e => { const u = [...interactionList]; u[i] = e.target.value; setInteractionList(u); }}
                  placeholder={`Medicine ${i + 1}...`}
                  className="input-field flex-1"
                />
                {i >= 2 && (
                  <button onClick={() => setInteractionList(prev => prev.filter((_, idx) => idx !== i))}
                    className="w-10 h-10 rounded-xl bg-danger-500/20 text-danger-400 flex items-center justify-center hover:bg-danger-500/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setInteractionList(prev => [...prev, ''])} disabled={interactionList.length >= 5} className="btn-ghost flex items-center gap-2 flex-1">
              <Plus className="w-4 h-4" /> {L.addMedicine}
            </button>
            <button onClick={handleInteractionCheck} disabled={loading} className="btn-primary flex items-center gap-2 flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{L.checking}</> : <><FlaskConical className="w-4 h-4" />{L.checkInteraction}</>}
            </button>
          </div>
        </div>
      )}

      {/* RESULT CARD */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Header */}
            <div className="card border border-primary-500/20">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-500/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-7 h-7 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-display font-bold text-xl">{result.medicineName}</h2>
                  {result.genericName && result.genericName !== result.medicineName && (
                    <p className="text-slate-400 text-sm">{L.generic} {result.genericName}</p>
                  )}
                  {result.manufacturer && <p className="text-slate-500 text-xs mt-0.5">{L.by} {result.manufacturer}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="badge badge-info">{result.type}</span>
                    <span className={`badge border text-xs ${
                      result.confidence === 'high' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      result.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }`}>
                      {result.confidence} {L.confidence}
                    </span>
                    {result.prescription && (
                      <span className="badge bg-danger-500/20 text-danger-400 border border-danger-500/30">{L.rxRequired}</span>
                    )}
                    {/* Language indicator */}
                    <span className={`badge border text-xs ${lang === 'hi' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                      {lang === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setResult(null); setResultHindi(null); setImage(null); setImageFile(null); setMedicineName(''); }}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-500">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              {(result.expiryVisible || displayStorage) && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                  {result.expiryVisible && (
                    <div>
                      <p className="text-slate-500 text-xs">{L.expiry}</p>
                      <p className="text-white text-sm font-semibold">{result.expiryVisible}</p>
                    </div>
                  )}
                  {displayStorage && (
                    <div>
                      <p className="text-slate-500 text-xs">{L.storage}</p>
                      <p className="text-slate-300 text-xs mt-0.5">{displayStorage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dosage */}
            {displayDosage && (
              <div className="glass border border-primary-500/20 p-4 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{L.dosage}</p>
                  <p className="text-white font-medium text-sm">{displayDosage}</p>
                </div>
              </div>
            )}

            {/* Hindi translation loading indicator */}
            {lang === 'hi' && translating && (
              <div className="flex items-center gap-3 p-4 rounded-xl glass border border-orange-500/20">
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin flex-shrink-0" />
                <p className="text-orange-300 text-sm">हिंदी अनुवाद हो रहा है... कृपया प्रतीक्षा करें</p>
              </div>
            )}

            {/* Collapsible sections */}
            <div className="space-y-2">
              {displayUses?.length > 0 && (
                <Section id="uses" title={L.uses} icon={CheckCircle} count={displayUses.length}>
                  <ul className="space-y-1.5 mt-2">
                    {displayUses.map((u, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" /> {u}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {result.composition?.length > 0 && (
                <Section id="composition" title={L.composition} icon={FlaskConical} count={result.composition.length}>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.composition.map((c, i) => (
                      <span key={i} className="badge badge-info text-xs">{c}</span>
                    ))}
                  </div>
                </Section>
              )}

              {displaySideEffects?.length > 0 && (
                <Section id="sideEffects" title={L.sideEffects} icon={AlertTriangle} count={displaySideEffects.length}>
                  <ul className="space-y-1.5 mt-2">
                    {displaySideEffects.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-amber-300 text-sm">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {displayWarnings?.length > 0 && (
                <Section id="warnings" title={L.warnings} icon={Shield} count={displayWarnings.length}>
                  <ul className="space-y-1.5 mt-2">
                    {displayWarnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-danger-300 text-sm">
                        <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {w}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {displayInteractions?.length > 0 && (
                <Section id="interactions" title={L.drugInteractions} icon={FlaskConical} count={displayInteractions.length}>
                  <ul className="space-y-1.5 mt-2">
                    {displayInteractions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-orange-300 text-sm">
                        <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-danger-400" /> {d}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            <div className="glass-darker p-4 rounded-xl border border-white/[0.04]">
              <p className="text-slate-600 text-xs">{L.disclaimer} {result.disclaimer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERACTION RESULT */}
      <AnimatePresence>
        {interactionResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`card border ${riskColor[interactionResult.overallRisk] || riskColor.caution}`}>
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6" />
                <div>
                  <p className="text-white font-bold">{L.overallRisk}: {interactionResult.overallRisk?.toUpperCase()}</p>
                  <p className="text-sm opacity-80 mt-1">{interactionResult.summary}</p>
                </div>
              </div>
            </div>
            {interactionResult.interactions?.map((inter, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{inter.drug1} + {inter.drug2}</p>
                    <span className={`badge border text-xs mt-1 ${severityColor[inter.severity] || severityColor.mild}`}>{inter.severity}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-2">{inter.description}</p>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                  <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                  <p className="text-primary-300 text-xs">{inter.recommendation}</p>
                </div>
              </div>
            ))}
            <div className="glass-darker p-4 rounded-xl">
              <p className="text-slate-600 text-xs">⚠️ {interactionResult.disclaimer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}