import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, Navigation, X } from 'lucide-react';

export default function FloatingEmergencyBtn() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on emergency page
  if (location.pathname === '/emergency') return null;

  const actions = [
    {
      icon: AlertTriangle,
      label: 'Emergency Mode',
      color: 'bg-danger-600',
      onClick: () => navigate('/emergency')
    },
    {
      icon: Phone,
      label: 'Call 112',
      color: 'bg-orange-600',
      onClick: () => window.open('tel:112')
    },
    {
      icon: Navigation,
      label: 'Nearest Hospital',
      color: 'bg-blue-600',
      onClick: () => navigate('/nearby-hospitals')
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {expanded && (
          <>
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { action.onClick(); setExpanded(false); }}
                className={`flex items-center gap-3 ${action.color} text-white text-sm font-semibold px-4 py-3 rounded-full shadow-xl`}
              >
                <action.icon className="w-4 h-4 flex-shrink-0" />
                {action.label}
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main pulse button */}
      <motion.button
        onClick={() => setExpanded(e => !e)}
        className="relative w-14 h-14 rounded-full bg-danger-600 text-white shadow-xl shadow-danger-600/40 flex items-center justify-center"
        whileTap={{ scale: 0.9 }}
        animate={expanded ? {} : { scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Pulse rings */}
        {!expanded && (
          <>
            <span className="absolute inset-0 rounded-full bg-danger-500/40 animate-ping" />
            <span className="absolute -inset-2 rounded-full bg-danger-500/20 animate-ping" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        <motion.div animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {expanded ? <X className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
