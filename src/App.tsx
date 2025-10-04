import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Import error handling
import { GlobalErrorHandler } from './components/error/GlobalErrorHandler';
import { ErrorBoundary } from './components/error/ErrorBoundary';

// Import pages
import HomePage from './routes/HomePage';
import DashboardPage from './routes/DashboardPage';
import LoginPage from './routes/LoginPage';
import RegisterPage from './routes/RegisterPage';
import ProfilePage from './routes/ProfilePage';
import NotFoundPage from './routes/NotFoundPage';

// Import layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <GlobalErrorHandler>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Layout>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
        
        {/* Global toast notifications */}
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
      </GlobalErrorHandler>
    </ErrorBoundary>
  );
}

export default App;
