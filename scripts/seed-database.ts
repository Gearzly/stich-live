import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Database seeding script for Stich Production
 * Sets up initial data for development and testing
 */

interface Template {
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  config: {
    framework: string;
    language: string;
    styling: string;
    features: string[];
    dependencies: string[];
  };
  metadata: {
    version: string;
    author: string;
    tags: string[];
    estimatedTime: number;
    complexity: number;
  };
  usage: {
    timesUsed: number;
    successRate: number;
    averageRating: number;
    totalRatings: number;
  };
  assets: {
    thumbnail: string;
    preview: string[];
    demoUrl?: string;
  };
  status: 'active' | 'deprecated' | 'beta';
  featured: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const initialTemplates: Omit<Template, 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'React Dashboard',
    description: 'Modern React dashboard with charts, tables, and responsive design',
    category: 'Dashboard',
    difficulty: 'intermediate',
    config: {
      framework: 'React',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
      features: ['Charts', 'Data Tables', 'User Management', 'Dark Mode'],
      dependencies: ['react-router-dom', 'recharts', 'lucide-react', '@headlessui/react']
    },
    metadata: {
      version: '1.0.0',
      author: 'Stich Production',
      tags: ['react', 'dashboard', 'admin', 'charts', 'typescript'],
      estimatedTime: 300000, // 5 minutes in milliseconds
      complexity: 7
    },
    usage: {
      timesUsed: 156,
      successRate: 94.2,
      averageRating: 4.6,
      totalRatings: 42
    },
    assets: {
      thumbnail: '/templates/react-dashboard-thumb.jpg',
      preview: ['/templates/react-dashboard-1.jpg', '/templates/react-dashboard-2.jpg'],
      demoUrl: 'https://react-dashboard-demo.stich.app'
    },
    status: 'active',
    featured: true
  },
  {
    name: 'E-commerce Store',
    description: 'Complete e-commerce solution with product catalog, cart, and checkout',
    category: 'E-commerce',
    difficulty: 'advanced',
    config: {
      framework: 'Next.js',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
      features: ['Product Catalog', 'Shopping Cart', 'Payment Integration', 'User Auth'],
      dependencies: ['stripe', 'next-auth', 'prisma', 'zustand']
    },
    metadata: {
      version: '1.2.0',
      author: 'Stich Production',
      tags: ['nextjs', 'ecommerce', 'stripe', 'shopping', 'typescript'],
      estimatedTime: 600000, // 10 minutes
      complexity: 9
    },
    usage: {
      timesUsed: 89,
      successRate: 87.6,
      averageRating: 4.8,
      totalRatings: 31
    },
    assets: {
      thumbnail: '/templates/ecommerce-thumb.jpg',
      preview: ['/templates/ecommerce-1.jpg', '/templates/ecommerce-2.jpg'],
      demoUrl: 'https://ecommerce-demo.stich.app'
    },
    status: 'active',
    featured: true
  },
  {
    name: 'Landing Page',
    description: 'Responsive landing page with hero section, features, and contact form',
    category: 'Marketing',
    difficulty: 'beginner',
    config: {
      framework: 'React',
      language: 'JavaScript',
      styling: 'Tailwind CSS',
      features: ['Hero Section', 'Feature Cards', 'Contact Form', 'Responsive Design'],
      dependencies: ['react-hook-form', 'framer-motion', 'react-intersection-observer']
    },
    metadata: {
      version: '1.0.0',
      author: 'Stich Production',
      tags: ['react', 'landing', 'marketing', 'responsive', 'javascript'],
      estimatedTime: 180000, // 3 minutes
      complexity: 3
    },
    usage: {
      timesUsed: 234,
      successRate: 96.8,
      averageRating: 4.4,
      totalRatings: 67
    },
    assets: {
      thumbnail: '/templates/landing-thumb.jpg',
      preview: ['/templates/landing-1.jpg', '/templates/landing-2.jpg']
    },
    status: 'active',
    featured: false
  },
  {
    name: 'Blog Platform',
    description: 'Full-featured blog with markdown support, categories, and search',
    category: 'Content',
    difficulty: 'intermediate',
    config: {
      framework: 'Next.js',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
      features: ['Markdown Posts', 'Categories', 'Search', 'Comments', 'SEO'],
      dependencies: ['gray-matter', 'remark', 'rehype', 'fuse.js']
    },
    metadata: {
      version: '1.1.0',
      author: 'Stich Production',
      tags: ['nextjs', 'blog', 'markdown', 'cms', 'typescript'],
      estimatedTime: 420000, // 7 minutes
      complexity: 6
    },
    usage: {
      timesUsed: 127,
      successRate: 91.3,
      averageRating: 4.5,
      totalRatings: 38
    },
    assets: {
      thumbnail: '/templates/blog-thumb.jpg',
      preview: ['/templates/blog-1.jpg', '/templates/blog-2.jpg'],
      demoUrl: 'https://blog-demo.stich.app'
    },
    status: 'active',
    featured: false
  },
  {
    name: 'Portfolio Site',
    description: 'Personal portfolio with project showcase and contact information',
    category: 'Portfolio',
    difficulty: 'beginner',
    config: {
      framework: 'React',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
      features: ['Project Gallery', 'About Section', 'Contact Form', 'Resume Download'],
      dependencies: ['framer-motion', 'react-hook-form', 'lucide-react']
    },
    metadata: {
      version: '1.0.0',
      author: 'Stich Production',
      tags: ['react', 'portfolio', 'personal', 'showcase', 'typescript'],
      estimatedTime: 240000, // 4 minutes
      complexity: 4
    },
    usage: {
      timesUsed: 198,
      successRate: 95.5,
      averageRating: 4.3,
      totalRatings: 54
    },
    assets: {
      thumbnail: '/templates/portfolio-thumb.jpg',
      preview: ['/templates/portfolio-1.jpg', '/templates/portfolio-2.jpg']
    },
    status: 'active',
    featured: false
  }
];

async function seedTemplates() {
  console.log('🌱 Seeding templates...');
  
  const batch = db.batch();
  const now = Timestamp.now();
  
  for (const template of initialTemplates) {
    const docRef = db.collection('templates').doc();
    batch.set(docRef, {
      ...template,
      createdAt: now,
      updatedAt: now
    });
  }
  
  await batch.commit();
  console.log(`✅ Seeded ${initialTemplates.length} templates`);
}

async function seedAdminUser() {
  console.log('🔑 Creating admin user...');
  
  // Create a sample admin user (this would normally be done through Firebase Auth)
  const adminUserId = 'admin_sample_uid_123';
  const adminUserRef = db.collection('users').doc(adminUserId);
  
  await adminUserRef.set({
    email: 'admin@stich.app',
    displayName: 'Stich Admin',
    role: 'admin',
    subscriptionTier: 'enterprise',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    },
    usage: {
      appsCreated: 0,
      generationsUsed: 0,
      storageUsed: 0
    },
    metadata: {
      emailVerified: true,
      provider: 'email',
      firstLoginAt: Timestamp.now()
    }
  });
  
  console.log('✅ Created admin user');
}

async function seedUsageDefaults() {
  console.log('📊 Setting up usage defaults...');
  
  // Create usage document for admin user
  const adminUsageRef = db.collection('usage').doc('admin_sample_uid_123');
  const now = Timestamp.now();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  
  await adminUsageRef.set({
    current: {
      period: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
      periodStart: now,
      periodEnd: Timestamp.fromDate(periodEnd),
      apps: {
        created: 0,
        limit: -1 // Unlimited for admin
      },
      generations: {
        used: 0,
        limit: -1 // Unlimited for admin
      },
      storage: {
        used: 0,
        limit: 10737418240 // 10GB in bytes
      },
      bandwidth: {
        used: 0,
        limit: 107374182400 // 100GB in bytes
      }
    },
    history: {},
    quotas: {
      subscriptionTier: 'enterprise',
      upgradeDate: now,
      customLimits: {}
    },
    updatedAt: now,
    resetAt: Timestamp.fromDate(periodEnd)
  });
  
  console.log('✅ Set up usage defaults');
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...');
    
    await seedTemplates();
    await seedAdminUser();
    await seedUsageDefaults();
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

export { seedTemplates, seedAdminUser, seedUsageDefaults };