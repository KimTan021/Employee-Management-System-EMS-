import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HRDashboard from './pages/HRDashboard';
import PortalDashboard from './pages/PortalDashboard';
import NotFound from './pages/NotFound';
import NotAuthorized from './pages/NotAuthorized';
import { ThemeProvider } from './components/theme-provider';
import { ToastProvider } from './components/ToastContext';
const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const role = useAuthStore((state) => state.role);
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

// Root Redirector based on role
const RootRedirect = () => {
    const role = useAuthStore((state) => state.role);
    if (!role) return <Navigate to="/login" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'HR_MANAGER') return <Navigate to="/hr/dashboard" replace />;
    return <Navigate to="/portal/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/403" element={<NotAuthorized />} />
              
              <Route path="/" element={<RootRedirect />} />
              
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/hr/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['HR_MANAGER']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/portal/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                    <PortalDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
