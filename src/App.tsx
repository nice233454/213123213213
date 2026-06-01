import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Subscribers from './pages/Subscribers';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setPage(hash);
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthPage />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    subscribers: <Subscribers />,
    campaigns: <Campaigns />,
    settings: <Settings />,
  };

  return (
    <Layout>
      {pages[page] ?? <Dashboard />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
