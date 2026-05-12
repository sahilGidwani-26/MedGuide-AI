import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import EmergencyPage from './pages/EmergencyPage';
import NearbyHospitalsPage from './pages/NearbyHospitalsPage';
import LiveMapPage from './pages/LiveMapPage';
import ChatAssistantPage from './pages/ChatAssistantPage';
import MedicalReportsPage from './pages/MedicalReportsPage';
import ProfilePage from './pages/ProfilePage';
import DoctorsPage from './pages/DoctorsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MedicineScannerPage from './pages/MedicineScannerPage';
import FirstAidGuidePage from './pages/FirstAidGuidePage';

// Layout
import MainLayout from './components/layout/MainLayout';
import FloatingEmergencyBtn from './components/emergency/FloatingEmergencyBtn';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-primary-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-4 rounded-full bg-primary-500/20" />
      </div>
      <p className="text-slate-400 text-sm font-medium">Loading MedGuide AI...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected - with layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
          <Route path="/nearby-hospitals" element={<NearbyHospitalsPage />} />
          <Route path="/live-map" element={<LiveMapPage />} />
          <Route path="/chat" element={<ChatAssistantPage />} />
          <Route path="/reports" element={<MedicalReportsPage />} />
          <Route path="/medicine-scanner" element={<MedicineScannerPage />} />
          <Route path="/first-aid" element={<FirstAidGuidePage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Emergency - standalone */}
        <Route path="/emergency" element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isAuthenticated && <FloatingEmergencyBtn />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#15b38a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            duration: 3500,
          }}
        />
      </AuthProvider>
    </Router>
  );
}
