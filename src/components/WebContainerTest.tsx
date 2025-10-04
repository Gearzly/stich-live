/**
 * WebContainer Test Page
 * Test page for demonstrating WebContainer functionality
 */

import { useState } from 'react';
import { CodePreview } from '@/components/CodePreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSystemTree } from '@webcontainer/api';

// Sample React project files
const sampleReactProject: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'sample-react-app',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.43',
          '@types/react-dom': '^18.2.17',
          '@vitejs/plugin-react': '^4.2.1',
          vite: '^5.0.8'
        }
      }, null, 2)
    }
  },
  'index.html': {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sample React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
    }
  },
  'vite.config.js': {
    file: {
      contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`
    }
  },
  src: {
    directory: {
      'main.jsx': {
        file: {
          contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        }
      },
      'App.jsx': {
        file: {
          contents: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Sample React App</h1>
      <p>This is running in a WebContainer!</p>
      
      <div style={{ margin: '2rem 0' }}>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Count: {count}
        </button>
      </div>
      
      <p style={{ color: '#666' }}>
        Click the button to test React state management!
      </p>
    </div>
  )
}

export default App`
        }
      }
    }
  }
};

// Sample Node.js project
const sampleNodeProject: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'sample-node-app',
        version: '1.0.0',
        type: 'module',
        main: 'server.js',
        scripts: {
          dev: 'node server.js',
          start: 'node server.js'
        },
        dependencies: {}
      }, null, 2)
    }
  },
  'server.js': {
    file: {
      contents: `import http from 'http';
import url from 'url';

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  
  const html = \`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sample Node.js Server</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        .button { padding: 0.5rem 1rem; margin: 0.5rem; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Sample Node.js Server</h1>
        <p>This server is running in a WebContainer!</p>
        <p>Current time: \${new Date().toLocaleString()}</p>
        <p>Path: \${pathname}</p>
        <button class="button" onclick="location.reload()">Refresh</button>
        <button class="button" onclick="window.location='/about'">About</button>
      </div>
    </body>
    </html>
  \`;
  
  res.end(html);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`
    }
  }
};

export function WebContainerTest() {
  const [selectedProject, setSelectedProject] = useState<'react' | 'node'>('react');
  const [currentFiles, setCurrentFiles] = useState<FileSystemTree>(sampleReactProject);

  const switchProject = (projectType: 'react' | 'node') => {
    setSelectedProject(projectType);
    setCurrentFiles(projectType === 'react' ? sampleReactProject : sampleNodeProject);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WebContainer Test Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This page demonstrates the WebContainer integration for running code in the browser.
            Select a project type below to test live code execution.
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant={selectedProject === 'react' ? 'default' : 'outline'}
              onClick={() => switchProject('react')}
            >
              React Project
            </Button>
            <Button
              variant={selectedProject === 'node' ? 'default' : 'outline'}
              onClick={() => switchProject('node')}
            >
              Node.js Server
            </Button>
          </div>
        </CardContent>
      </Card>

      <CodePreview files={currentFiles} />
    </div>
  );
}