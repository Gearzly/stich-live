import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { Suspense, lazy } from 'react';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SearchProvider } from './contexts/SearchContext';

// Import error handling
import { GlobalErrorHandler } from './components/error/GlobalErrorHandler';
import { ErrorBoundary } from './components/error/ErrorBoundary';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('./routes/HomePage'));
const DashboardPage = lazy(() => import('./routes/DashboardPage'));
const ChatPage = lazy(() => import('./routes/ChatPage'));
const LoginPage = lazy(() => import('./routes/LoginPage'));
const RegisterPage = lazy(() => import('./routes/RegisterPage'));
const ProfilePage = lazy(() => import('./routes/ProfilePage'));
const SettingsPage = lazy(() => import('./routes/Settings'));
const SearchPage = lazy(() => import('./routes/SearchPage'));
const DiscoveryPage = lazy(() => import('./routes/DiscoveryPage'));
const NotFoundPage = lazy(() => import('./routes/NotFoundPage'));

// Lazy-loaded components
const WebContainerTest = lazy(() => import('./components/WebContainerTest').then(module => ({ default: module.WebContainerTest })));
const RealtimeGeneration = lazy(() => import('./components/RealtimeGeneration').then(module => ({ default: module.RealtimeGeneration })));

// Import layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <GlobalErrorHandler>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <SettingsProvider>
                <SearchProvider>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/discovery" element={<DiscoveryPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/chat/:chatId" element={<ChatPage />} />
                        <Route path="/webcontainer-test" element={<WebContainerTest />} />
                        <Route path="/realtime-test" element={<RealtimeGeneration />} />
                        
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
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        } />
                        
                        {/* 404 page */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                  
                  {/* Global toast notifications */}
                  <Toaster />
                </SearchProvider>
              </SettingsProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </GlobalErrorHandler>
    </ErrorBoundary>
  );
}

export default App;
