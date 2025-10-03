# Stich Production

**AI-Powered Web Application Generator**

A sophisticated AI-powered web application generator built on Vercel's platform with Firebase backend. Transform natural language descriptions into fully functional web applications with real-time code generation, live previews, and one-click deployment.

## 🚀 Features

- **AI-Powered Code Generation**: Multi-provider AI integration (OpenAI, Anthropic, Google AI, Cerebras)
- **Real-time Development**: Live code generation with progress tracking
- **Instant Previews**: Real-time application previews during generation
- **One-Click Deployment**: Seamless deployment to Vercel
- **Modern Stack**: React 19.1.1, TypeScript, Firebase, Tailwind CSS
- **Authentication**: Firebase Auth with Google/GitHub OAuth
- **File Management**: Firebase Storage for generated assets
- **Responsive Design**: Mobile-first responsive UI with shadcn/ui

## 🏗️ Tech Stack

### Frontend
- **React 19.1.1** - Modern React with latest features
- **TypeScript** - Strict type safety
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible UI components
- **React Router v7** - Client-side routing
- **Framer Motion** - Animations and transitions

### Backend
- **Firebase Functions** - Serverless backend API
- **Express.js/Hono.js** - Web framework
- **Firebase Firestore** - NoSQL database
- **Firebase Auth** - Authentication and authorization
- **Firebase Storage** - File storage and CDN
- **Firebase Realtime Database** - Real-time updates

### Deployment
- **Vercel** - Frontend hosting and deployment
- **Firebase Hosting** - Alternative hosting option
- **GitHub Actions** - CI/CD pipeline

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase CLI
- Vercel CLI (optional)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gearzly/stich-production.git
   cd stich-production
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Setup Firebase**
   ```bash
   firebase login
   firebase use --add  # Select your Firebase project
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase config
   ```

5. **Start development servers**
   ```bash
   # Start Firebase emulators
   npm run firebase:emulators

   # In another terminal, start the frontend
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Firebase Emulator UI: http://localhost:4000

## 📁 Project Structure

```
stich-production/
├── src/                    # React frontend application
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── layout/        # Layout components
│   │   └── shared/        # Shared components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── routes/            # Page components
│   ├── lib/               # Utility libraries
│   ├── styles/            # Global styles
│   └── assets/            # Static assets
├── functions/             # Firebase Functions backend
│   ├── src/
│   │   ├── api/           # REST API endpoints
│   │   ├── agents/        # AI code generation agents
│   │   ├── services/      # Business logic services
│   │   ├── models/        # Data models
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration
│   │   └── utils/         # Utility functions
├── firebase/              # Firebase configuration
├── shared/                # Shared types and utilities
├── scripts/               # Build and deployment scripts
└── public/                # Static public assets
```

## 🔧 Available Scripts

### Frontend Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking
- `npm test` - Run tests

### Backend Development  
- `npm run functions:build` - Build Firebase Functions
- `npm run functions:serve` - Serve functions locally
- `npm run functions:deploy` - Deploy functions to Firebase

### Firebase Operations
- `npm run firebase:emulators` - Start Firebase emulators
- `npm run firebase:deploy` - Deploy all Firebase services
- `npm run firestore:deploy` - Deploy Firestore rules
- `npm run storage:deploy` - Deploy Storage rules

### Deployment
- `npm run deploy` - Deploy to Vercel (production)
- `npm run deploy:preview` - Deploy to Vercel (preview)

## 🌐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI Provider API Keys (for Functions)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key
CEREBRAS_API_KEY=your_cerebras_key
```

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run function tests
cd functions
npm test
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Deploy frontend to Vercel
npm run deploy

# Deploy Firebase Functions
npm run functions:deploy

# Deploy all Firebase services
npm run firebase:deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for the comprehensive backend platform
- [Vercel](https://vercel.com/) for excellent frontend hosting and deployment
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [React](https://react.dev/) for the powerful frontend framework

---

Built with ❤️ by the Stich Production Team