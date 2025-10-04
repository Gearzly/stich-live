import React from 'react';
import { useParams } from 'react-router';
import FileManager from '../components/FileManager';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react';

const FileManagerPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();

  if (!appId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Invalid Application
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            The application ID is missing or invalid.
          </p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  File Manager
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Edit and manage your application files
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* File Manager */}
      <div className="container mx-auto px-6 py-6">
        <FileManager 
          appId={appId}
          height="calc(100vh - 200px)"
          showToolbar={true}
        />
      </div>
    </div>
  );
};

export default FileManagerPage;