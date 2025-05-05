
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ValidationProvider } from "@/contexts/ValidationContext";
import ValidationModal from "@/components/ValidationModal";
import { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import MyResults from "./pages/MyResults";
import Rules from "./pages/Rules";
import Schedule from "./pages/Schedule";
import FinalistsDashboard from "./pages/FinalistsDashboard";
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TranslationProvider } from "@/hooks/use-translation";

// Create auth context
export const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  currentCompetitionId: number | null;
  setCurrentCompetitionId: (id: number | null) => void;
}>({
  session: null,
  loading: true,
  currentCompetitionId: null,
  setCurrentCompetitionId: () => {},
});

export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [currentCompetitionId, setCurrentCompetitionId] = useState<number | null>(null);

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      // Try to get competition ID from localStorage
      const savedCompId = localStorage.getItem('currentCompetitionId');
      if (savedCompId && !isNaN(parseInt(savedCompId, 10))) {
        setCurrentCompetitionId(parseInt(savedCompId, 10));
        console.log('Set competition ID from localStorage:', parseInt(savedCompId, 10));
      } else {
        // Fetch current competition if none in localStorage
        console.log('Fetching default competition ID...');
        fetchDefaultCompetitionId();
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  // Save competition ID to localStorage when it changes
  useEffect(() => {
    if (currentCompetitionId) {
      localStorage.setItem('currentCompetitionId', currentCompetitionId.toString());
    }
  }, [currentCompetitionId]);

  // Fetch the default competition ID (most recent)
  const fetchDefaultCompetitionId = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching competitions:', error);
        return;
      }

      console.log('Fetched competitions:', data);

      if (data && data.length > 0) {
        const compId = data[0].id;
        console.log('Setting current competition ID to:', compId);
        setCurrentCompetitionId(compId);
        localStorage.setItem('currentCompetitionId', compId.toString());
      } else {
        console.log('No competitions found in database');
      }
    } catch (error) {
      console.error('Error fetching default competition:', error);
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isConfigured) return <Navigate to="/" replace />;
    if (loading) return <div>Loading...</div>;
    if (!session) return <Navigate to="/auth" replace />;
    return <>{children}</>;
  };

  // Admin route - check for admin role in user metadata
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isConfigured) return <Navigate to="/" replace />;
    if (loading) return <div>Loading...</div>;
    if (!session) return <Navigate to="/auth" replace />;

    // Check if user is admin based on user metadata
    const isAdmin = session.user.user_metadata.isAdmin === true;
    if (!isAdmin) {
      // If not in metadata, we'll check in the database during component mount
      // For now, allow access and let the component handle the check
      console.log('Admin status not found in metadata, component will verify');
    }

    return <>{children}</>;
  };

  // Super Admin route - more restricted access
  const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isConfigured) return <Navigate to="/" replace />;
    if (loading) return <div>Loading...</div>;
    if (!session) return <Navigate to="/auth" replace />;

    // The SuperAdmin component will handle the detailed permission check
    // This is just a basic auth check
    return <>{children}</>;
  };

  // Show configuration message if Supabase is not configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-lg">
          <AlertTitle>Supabase Configuration Missing</AlertTitle>
          <AlertDescription>
            <p className="mb-4">
              Please set the following environment variables to connect to your Supabase project:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li><code>VITE_SUPABASE_URL</code></li>
              <li><code>VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
            <p>
              You can get these values from your Supabase project dashboard under
              Settings &gt; API.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      currentCompetitionId,
      setCurrentCompetitionId
    }}>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider>
          <ValidationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ValidationModal />
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/superadmin"
                  element={
                    <SuperAdminRoute>
                      <SuperAdmin />
                    </SuperAdminRoute>
                  }
                />
                <Route
                  path="/finalists-dashboard"
                  element={
                    <AdminRoute>
                      <FinalistsDashboard />
                    </AdminRoute>
                  }
                />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/myresults"
                  element={
                    <ProtectedRoute>
                      <MyResults />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </ValidationProvider>
        </TranslationProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

export default App;
