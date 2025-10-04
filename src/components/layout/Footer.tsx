// import React from 'react'; // React 17+ with JSX transform doesn't require this
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Stich</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered web application generator for modern developers.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link></li>
              <li><Link to="/gallery" className="text-muted-foreground hover:text-primary">Gallery</Link></li>
              <li><Link to="/search" className="text-muted-foreground hover:text-primary">Search</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="text-muted-foreground hover:text-primary">Help Center</Link></li>
              <li><Link to="/api-docs" className="text-muted-foreground hover:text-primary">API Docs</Link></li>
              <li><Link to="/tutorials" className="text-muted-foreground hover:text-primary">Tutorials</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Stich Production. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
