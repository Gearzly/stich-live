import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Pages that should not show the sidebar
  const noSidebarPages = ['/login', '/register', '/'];
  const showSidebar = isAuthenticated && !noSidebarPages.includes(location.pathname);

  // Pages that should not show the header/footer
  const fullPageRoutes = ['/login', '/register'];
  const isFullPage = fullPageRoutes.includes(location.pathname);

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {showSidebar && (
          <aside className="w-64 min-h-[calc(100vh-4rem)] bg-card border-r border-border">
            <Sidebar />
          </aside>
        )}
        
        <main className={`flex-1 ${showSidebar ? 'min-h-[calc(100vh-4rem)]' : 'min-h-[calc(100vh-8rem)]'}`}>
          <div className="container-safe py-6">
            {children}
          </div>
        </main>
      </div>
      
      {!showSidebar && <Footer />}
    </div>
  );
}