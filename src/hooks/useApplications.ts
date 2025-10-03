import { useState, useEffect, useCallback } from 'react';
import { 
  ApplicationService,
  type Application,
  type CreateApplicationData,
  type UpdateApplicationData,
  type ApplicationSearchOptions
} from '../services';

// Custom hook for application management
export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationService = new ApplicationService();

  // Load user's applications
  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apps = await applicationService.getUserApplications();
      setApplications(apps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new application
  const createApplication = async (data: CreateApplicationData): Promise<Application> => {
    try {
      setError(null);
      const newApp = await applicationService.createApplication(data);
      setApplications(prev => [newApp, ...prev]);
      return newApp;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application');
      throw err;
    }
  };

  // Update application
  const updateApplication = async (id: string, data: UpdateApplicationData) => {
    try {
      setError(null);
      await applicationService.updateApplication(id, data);
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, ...data, updatedAt: new Date() } as Application : app
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
      throw err;
    }
  };

  // Delete application
  const deleteApplication = async (id: string) => {
    try {
      setError(null);
      await applicationService.deleteApplication(id);
      
      // Update local state
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application');
      throw err;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const newFavoriteStatus = await applicationService.toggleFavorite(id);
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, isFavorite: newFavoriteStatus } : app
      ));
      
      return newFavoriteStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
      throw err;
    }
  };

  // Load applications on mount
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  return {
    applications,
    loading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    toggleFavorite,
    reload: loadApplications,
  };
}

// Custom hook for application discovery
export function useApplicationSearch() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const applicationService = new ApplicationService();

  // Search applications
  const searchApplications = async (options: ApplicationSearchOptions = {}) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const results = await applicationService.searchApplications(options);
      setApplications(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Get public applications
  const getPublicApplications = async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const results = await applicationService.getPublicApplications(limit);
      setApplications(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load public applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Get trending applications
  const getTrendingApplications = async (limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const results = await applicationService.getTrendingApplications(limit);
      setApplications(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Clone application
  const cloneApplication = async (id: string, newName?: string): Promise<Application> => {
    try {
      setError(null);
      const clonedApp = await applicationService.cloneApplication(id, newName);
      return clonedApp;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone application');
      throw err;
    }
  };

  // Clear search results
  const clearResults = () => {
    setApplications([]);
    setError(null);
    setHasSearched(false);
  };

  return {
    applications,
    loading,
    error,
    hasSearched,
    searchApplications,
    getPublicApplications,
    getTrendingApplications,
    cloneApplication,
    clearResults,
  };
}

// Custom hook for single application
export function useApplication(id: string | null) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationService = new ApplicationService();

  // Load application
  const loadApplication = useCallback(async () => {
    if (!id) {
      setApplication(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const app = await applicationService.getApplication(id);
      setApplication(app);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Update application
  const updateApplication = async (data: UpdateApplicationData) => {
    if (!id) return;

    try {
      setError(null);
      await applicationService.updateApplication(id, data);
      
      // Update local state
      if (application) {
        setApplication({ ...application, ...data, updatedAt: new Date() } as Application);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
      throw err;
    }
  };

  // Increment analytics
  const incrementAnalytics = async (metric: 'views' | 'likes' | 'forks' | 'shares') => {
    if (!id) return;

    try {
      await applicationService.incrementAnalytics(id, metric);
      
      // Update local state
      if (application) {
        setApplication((prev: Application | null) => prev ? {
          ...prev,
          analytics: {
            ...prev.analytics,
            [metric]: prev.analytics[metric] + 1,
          },
        } as Application : null);
      }
    } catch (err) {
      // Don't show error for analytics failures
      console.warn('Failed to increment analytics:', err);
    }
  };

  // Load application when ID changes
  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  return {
    application,
    loading,
    error,
    updateApplication,
    incrementAnalytics,
    reload: loadApplication,
  };
}

// Custom hook for application categories and tags
export function useApplicationMetadata() {
  const [categories, setCategories] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationService = new ApplicationService();

  // Load metadata
  const loadMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesResult, tagsResult] = await Promise.all([
        applicationService.getCategories(),
        applicationService.getPopularTags(30),
      ]);
      
      setCategories(categoriesResult);
      setPopularTags(tagsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  };

  // Load metadata on mount
  useEffect(() => {
    loadMetadata();
  }, []);

  return {
    categories,
    popularTags,
    loading,
    error,
    reload: loadMetadata,
  };
}