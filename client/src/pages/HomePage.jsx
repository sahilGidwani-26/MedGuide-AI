import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, Shield, MapPin, Brain, Mic, Phone,
  FileText, ArrowRight, CheckCircle, Zap, Heart
} from 'lucide-react';

const features = [
  { icon: Brain,    title: 'AI Symptom Analysis',  desc: 'Powered by Google Gemini AI for instant health insights',          color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: MapPin,   title: 'Nearby Hospitals',      desc: 'Real-time detection of hospitals, clinics & pharmacies',            color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
  { icon: Mic,      title: 'Voice Input',            desc: 'Describe symptoms in Hindi or English using voice',                 color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: Shield,   title: 'Emergency Mode',         desc: 'Instant emergency access with one tap SOS',                        color: 'text-danger-400', bg: 'bg-danger-500/10 border-danger-500/20' },
  { icon: FileText, title: 'Medical Reports',        desc: 'Securely upload and manage your health documents',                  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  { icon: Heart,    title: 'Health Dashboard',       desc: 'Track your health history and AI analyses over time',              color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20' },
];

const stats = [
  { label: 'AI Accuracy',       value: '98%'  },
  { label: 'Hospitals Tracked', value: '50K+' },
  { label: 'Happy Users',       value: '10K+' },
  { label: 'Response Time',     value: '<2s'  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-white text-base sm:text-lg leading-none">MedGuide AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-5"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-14 sm:pt-16">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-80 sm:h-80 bg-violet-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-[600px] sm:h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              Powered by Google Gemini AI
            </div>

            {/* Heading */}
            <h1 className="font-display font-extrabold leading-tight mb-4 sm:mb-6 w-full"
                style={{ fontSize: 'clamp(2rem, 8vw, 4.5rem)' }}>
              <span className="text-white">Your AI-Powered</span>
              <br />
              <span className="gradient-text">Healthcare</span>
              <span className="text-white"> Assistant</span>
            </h1>

            {/* Subtext */}
            <p className="text-slate-400 text-sm sm:text-lg max-w-xs sm:max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Describe your symptoms, find nearby hospitals, and get instant AI health
              guidance — all in one powerful platform. Free, fast, and always available.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto">
              <button
                onClick={() => navigate('/register')}
                className="flex items-center justify-center gap-2 btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 rounded-2xl w-full sm:w-auto"
              >
                Start for Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => navigate('/emergency')}
                className="flex items-center justify-center gap-2 btn-danger text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 rounded-2xl w-full sm:w-auto"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" /> Emergency Help
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 sm:mt-10">
              {['No credit card required', 'Free forever', 'HIPAA-friendly design'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" /> {t}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 sm:py-16 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display font-extrabold gradient-text mb-1"
                   style={{ fontSize: 'clamp(1.75rem, 6vw, 2.25rem)' }}>
                {s.value}
              </div>
              <div className="text-slate-500 text-xs sm:text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-display font-bold text-white mb-3 sm:mb-4"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>
            Everything You Need
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-sm sm:max-w-xl mx-auto px-4">
            A complete healthcare companion with AI, maps, voice, and emergency features — all free.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`glass p-5 sm:p-6 border ${f.bg} hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${f.bg} border flex items-center justify-center mb-3 sm:mb-4`}>
                <f.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${f.color}`} />
              </div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg mb-1.5 sm:mb-2">{f.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-teal-900/20 to-primary-900/30" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display font-extrabold text-white mb-3 sm:mb-4 px-2"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-sm mx-auto">
            Join thousands of users who trust MedGuide AI for their healthcare needs.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 btn-primary text-sm sm:text-lg py-3 sm:py-4 px-8 sm:px-10 rounded-2xl"
          >
            Get Started Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-6 sm:py-8 text-center text-slate-600 text-xs sm:text-sm px-4">
        <p>© 2025 MedGuide AI. Built with ❤️ for better healthcare access.</p>
        <p className="mt-1 text-slate-700">Not a substitute for professional medical advice. Always consult a doctor.</p>
      </footer>
    </div>
  );
}