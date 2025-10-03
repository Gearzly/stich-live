import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="relative">
            <div className="text-8xl font-bold text-muted-foreground/20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Compass className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <p className="text-muted-foreground">
              Sorry, we couldn't find the page you're looking for. 
              The page might have been moved, deleted, or the URL might be incorrect.
            </p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Here are some helpful links instead:
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Link 
              to="/"
              className="flex items-center justify-center gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Go Home</span>
            </Link>
            
            <Link 
              to="/dashboard"
              className="flex items-center justify-center gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="font-medium">View Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          
          <Button asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
        </div>

        {/* Contact Info */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please{' '}
            <a 
              href="mailto:support@stichproduction.com" 
              className="text-primary hover:text-primary/90 underline"
            >
              contact support
            </a>
            {' '}or try refreshing the page.
          </p>
        </div>

        {/* Additional Help */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Common solutions:
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
            <li>• Check the URL for typos</li>
            <li>• Clear your browser cache and cookies</li>
            <li>• Make sure you're logged in if required</li>
            <li>• Try accessing the page from our main navigation</li>
          </ul>
        </div>

        {/* Error Code */}
        <div className="text-xs text-muted-foreground/50">
          Error Code: 404 - Page Not Found
        </div>
      </div>
    </div>
  );
}