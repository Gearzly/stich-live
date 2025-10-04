/**
 * Settings Context
 * Manages application settings and user preferences
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationContext';

export interface UserSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  
  // Editor preferences
  editorTheme: 'vs-light' | 'vs-dark' | 'hc-black';
  editorFontSize: number;
  editorTabSize: number;
  editorWordWrap: boolean;
  editorMinimap: boolean;
  
  // AI preferences
  preferredAIProvider: 'openai' | 'anthropic' | 'google' | 'cerebras';
  aiModel: string;
  creativityLevel: number; // 0-1
  codeStyle: 'clean' | 'documented' | 'minimal' | 'comprehensive';
  
  // Privacy
  analytics: boolean;
  crashReporting: boolean;
  usageData: boolean;
  marketingEmails: boolean;
  
  // Development
  autoSave: boolean;
  autoPreview: boolean;
  showLineNumbers: boolean;
  enableLinting: boolean;
  
  // Account
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}

const defaultSettings: UserSettings = {
  // Appearance
  theme: 'system',
  language: 'en',
  fontSize: 'medium',
  reducedMotion: false,
  
  // Editor
  editorTheme: 'vs-dark',
  editorFontSize: 14,
  editorTabSize: 2,
  editorWordWrap: true,
  editorMinimap: true,
  
  // AI
  preferredAIProvider: 'openai',
  aiModel: 'gpt-4o',
  creativityLevel: 0.7,
  codeStyle: 'documented',
  
  // Privacy
  analytics: true,
  crashReporting: true,
  usageData: true,
  marketingEmails: false,
  
  // Development
  autoSave: true,
  autoPreview: false,
  showLineNumbers: true,
  enableLinting: true,
  
  // Account
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<boolean>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotifications();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply theme changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Apply font size changes
  useEffect(() => {
    applyFontSize(settings.fontSize);
  }, [settings.fontSize]);

  // Apply reduced motion preference
  useEffect(() => {
    applyReducedMotion(settings.reducedMotion);
  }, [settings.reducedMotion]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage
      const savedSettings = localStorage.getItem('user-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }

      // TODO: Load from backend/user profile
      // const userSettings = await api.getUserSettings();
      // setSettings({ ...defaultSettings, ...userSettings });
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      showError('Settings Error', 'Failed to load your settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      // Save to localStorage
      localStorage.setItem('user-settings', JSON.stringify(newSettings));
      
      // TODO: Save to backend
      // await api.updateUserSettings(newSettings);
      
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Save Failed', 'Unable to save your settings. Please try again.');
      return false;
    }
  };

  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    const success = await saveSettings(newSettings);
    if (success) {
      showSuccess('Settings Updated', `${key} has been updated successfully.`);
    }
  }, [settings, saveSettings, showSuccess]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    const success = await saveSettings(newSettings);
    if (success) {
      showSuccess('Settings Updated', 'Your preferences have been saved.');
    }
  }, [settings, saveSettings, showSuccess]);

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    const success = await saveSettings(defaultSettings);
    if (success) {
      showSuccess('Settings Reset', 'All settings have been reset to defaults.');
    }
  }, [saveSettings, showSuccess]);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback(async (settingsJson: string): Promise<boolean> => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // Validate imported settings
      const validatedSettings = { ...defaultSettings, ...importedSettings };
      
      setSettings(validatedSettings);
      const success = await saveSettings(validatedSettings);
      
      if (success) {
        showSuccess('Settings Imported', 'Your settings have been imported successfully.');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to import settings:', error);
      showError('Import Failed', 'Invalid settings file. Please check the format and try again.');
      return false;
    }
  }, [saveSettings, showSuccess, showError]);

  // Theme application
  const applyTheme = (theme: UserSettings['theme']) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Font size application
  const applyFontSize = (fontSize: UserSettings['fontSize']) => {
    const root = document.documentElement;
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.fontSize = sizeMap[fontSize];
  };

  // Reduced motion application
  const applyReducedMotion = (reducedMotion: boolean) => {
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', reducedMotion);
  };

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    loading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}