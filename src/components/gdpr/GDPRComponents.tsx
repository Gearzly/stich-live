/**
 * GDPR Compliance Components and Utilities
 * Cookie consent, data processing consent, and privacy controls
 */

import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  Shield, 
  Settings, 
  X, 
  Check, 
  Info, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  cookies: CookieDetails[];
}

interface CookieDetails {
  name: string;
  purpose: string;
  duration: string;
  provider: string;
}

interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

// Cookie Consent Banner Component
export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    personalization: false
  });

  const cookieCategories: CookieCategory[] = [
    {
      id: 'necessary',
      name: 'Strictly Necessary',
      description: 'These cookies are essential for the website to function and cannot be switched off.',
      required: true,
      enabled: true,
      cookies: [
        {
          name: 'session_token',
          purpose: 'Maintains user session and authentication state',
          duration: 'Session',
          provider: 'Stich'
        },
        {
          name: 'csrf_token',
          purpose: 'Prevents cross-site request forgery attacks',
          duration: '1 hour',
          provider: 'Stich'
        }
      ]
    },
    {
      id: 'functional',
      name: 'Functional',
      description: 'These cookies enable enhanced functionality and personalization.',
      required: false,
      enabled: preferences.functional,
      cookies: [
        {
          name: 'user_preferences',
          purpose: 'Stores user interface preferences and settings',
          duration: '1 year',
          provider: 'Stich'
        },
        {
          name: 'theme_preference',
          purpose: 'Remembers chosen theme (light/dark mode)',
          duration: '1 year',
          provider: 'Stich'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'These cookies help us understand how visitors interact with our website.',
      required: false,
      enabled: preferences.analytics,
      cookies: [
        {
          name: '_ga',
          purpose: 'Used to distinguish users for analytics',
          duration: '2 years',
          provider: 'Google Analytics'
        },
        {
          name: '_gid',
          purpose: 'Used to distinguish users for analytics',
          duration: '24 hours',
          provider: 'Google Analytics'
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'These cookies are used to track visitors and display relevant advertisements.',
      required: false,
      enabled: preferences.marketing,
      cookies: [
        {
          name: 'marketing_consent',
          purpose: 'Tracks marketing communication preferences',
          duration: '1 year',
          provider: 'Stich'
        }
      ]
    }
  ];

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allEnabled = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      personalization: true
    };
    setPreferences(allEnabled);
    saveCookieConsent(allEnabled);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    saveCookieConsent(preferences);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      personalization: false
    };
    setPreferences(minimalConsent);
    saveCookieConsent(minimalConsent);
    setIsVisible(false);
  };

  const saveCookieConsent = (consent: ConsentPreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    // Apply consent preferences
    if (consent.analytics && typeof gtag !== 'undefined') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    if (consent.marketing && typeof gtag !== 'undefined') {
      gtag('consent', 'update', { ad_storage: 'granted' });
    }
  };

  const handlePreferenceChange = (category: keyof ConsentPreferences, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: enabled
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-start gap-4">
          <Cookie className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg mb-2">We value your privacy</h3>
                <p className="text-muted-foreground text-sm">
                  We use cookies to enhance your browsing experience, serve personalized content, 
                  and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="ml-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {showDetails && (
              <div className="mb-4 space-y-3">
                {cookieCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{category.name}</span>
                        {category.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {category.cookies.length} cookie{category.cookies.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Switch
                      checked={category.enabled}
                      disabled={category.required}
                      onCheckedChange={(enabled) => 
                        handlePreferenceChange(category.id as keyof ConsentPreferences, enabled)
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={handleAcceptAll} className="bg-primary">
                Accept All
              </Button>
              <Button variant="outline" onClick={handleRejectAll}>
                Reject All
              </Button>
              <Button variant="outline" onClick={handleAcceptSelected}>
                Save Preferences
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="text-muted-foreground"
              >
                {showDetails ? (
                  <>Less Options <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>More Options <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-muted-foreground"
              >
                <a href="/privacy-policy" target="_blank">
                  Privacy Policy <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cookie Management Interface
export const CookieManagement: React.FC = () => {
  const [consent, setConsent] = useState<ConsentPreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    personalization: false
  });

  const cookieCategories: CookieCategory[] = [
    {
      id: 'necessary',
      name: 'Strictly Necessary Cookies',
      description: 'These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and accessibility.',
      required: true,
      enabled: true,
      cookies: [
        {
          name: 'session_token',
          purpose: 'Maintains user session and authentication state across pages',
          duration: 'Session (deleted when browser closes)',
          provider: 'Stich Platform'
        },
        {
          name: 'csrf_token',
          purpose: 'Prevents cross-site request forgery attacks for security',
          duration: '1 hour',
          provider: 'Stich Platform'
        },
        {
          name: 'cookie_consent',
          purpose: 'Stores your cookie preferences to remember your choices',
          duration: '1 year',
          provider: 'Stich Platform'
        }
      ]
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'These cookies enhance functionality and personalization, such as language preferences and region settings.',
      required: false,
      enabled: consent.functional,
      cookies: [
        {
          name: 'user_preferences',
          purpose: 'Stores user interface preferences, theme, and dashboard layout',
          duration: '1 year',
          provider: 'Stich Platform'
        },
        {
          name: 'language_preference',
          purpose: 'Remembers your selected language for the interface',
          duration: '1 year',
          provider: 'Stich Platform'
        },
        {
          name: 'recent_projects',
          purpose: 'Stores recently accessed projects for quick navigation',
          duration: '30 days',
          provider: 'Stich Platform'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'These cookies collect information about how you use our website to help us improve user experience.',
      required: false,
      enabled: consent.analytics,
      cookies: [
        {
          name: '_ga',
          purpose: 'Used by Google Analytics to distinguish unique users',
          duration: '2 years',
          provider: 'Google Analytics'
        },
        {
          name: '_gid',
          purpose: 'Used by Google Analytics to distinguish unique users',
          duration: '24 hours',
          provider: 'Google Analytics'
        },
        {
          name: '_gat_gtag_*',
          purpose: 'Used by Google Analytics to throttle request rate',
          duration: '1 minute',
          provider: 'Google Analytics'
        },
        {
          name: 'performance_metrics',
          purpose: 'Tracks application performance and loading times',
          duration: '7 days',
          provider: 'Stich Platform'
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'These cookies are used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.',
      required: false,
      enabled: consent.marketing,
      cookies: [
        {
          name: 'marketing_consent',
          purpose: 'Tracks consent for marketing communications and campaigns',
          duration: '1 year',
          provider: 'Stich Platform'
        },
        {
          name: 'referral_source',
          purpose: 'Tracks how users found our website for attribution',
          duration: '30 days',
          provider: 'Stich Platform'
        }
      ]
    }
  ];

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie_consent');
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
      } catch (error) {
        console.error('Failed to parse cookie consent:', error);
      }
    }
  }, []);

  const handleConsentChange = (category: keyof ConsentPreferences, enabled: boolean) => {
    const updatedConsent = {
      ...consent,
      [category]: enabled
    };
    setConsent(updatedConsent);
    
    localStorage.setItem('cookie_consent', JSON.stringify({
      ...updatedConsent,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
  };

  const clearAllCookies = () => {
    // Clear all non-essential cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (!['session_token', 'csrf_token', 'cookie_consent'].includes(name)) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
    
    // Reset consent to minimal
    const minimalConsent = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      personalization: false
    };
    setConsent(minimalConsent);
    localStorage.setItem('cookie_consent', JSON.stringify({
      ...minimalConsent,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cookie Management</h2>
          <p className="text-muted-foreground">
            Manage your cookie preferences and understand how we use cookies
          </p>
        </div>
        <Button variant="outline" onClick={clearAllCookies}>
          Clear All Cookies
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Changes to your cookie preferences will take effect immediately. 
          Some features may not work properly if you disable certain cookies.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {cookieCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {category.name}
                    {category.required && (
                      <Badge variant="outline">Required</Badge>
                    )}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">
                    {category.description}
                  </p>
                </div>
                <Switch
                  checked={category.enabled}
                  disabled={category.required}
                  onCheckedChange={(enabled) => 
                    handleConsentChange(category.id as keyof ConsentPreferences, enabled)
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.cookies.map((cookie, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{cookie.name}</h4>
                        <div className="text-xs text-muted-foreground">
                          Provider: {cookie.provider}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {cookie.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cookie.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cookie Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">What are cookies?</h4>
            <p className="text-sm text-muted-foreground">
              Cookies are small text files that are stored on your device when you visit a website. 
              They help websites remember information about your visit, which can make your next visit easier and the site more useful to you.
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Managing cookies</h4>
            <p className="text-sm text-muted-foreground">
              You can control and/or delete cookies as you wish. You can delete all cookies that are already on your device and 
              you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually 
              adjust some preferences every time you visit a site.
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Third-party cookies</h4>
            <p className="text-sm text-muted-foreground">
              Some cookies are set by third-party services that appear on our pages. We have no control over these cookies. 
              You can learn more about these cookies by visiting the privacy policies of the respective services.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Data Processing Consent Component
export const DataProcessingConsent: React.FC<{
  onConsent: (consented: boolean) => void;
  purpose: string;
  dataTypes: string[];
  required?: boolean;
}> = ({ onConsent, purpose, dataTypes, required = false }) => {
  const [consented, setConsented] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleConsentChange = (consent: boolean) => {
    setConsented(consent);
    onConsent(consent);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-500 mt-1" />
          <div className="flex-1">
            <CardTitle className="text-lg">Data Processing Consent</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              We need your consent to process your personal data for: {purpose}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={consented}
            onCheckedChange={handleConsentChange}
            disabled={required}
          />
          <span className="text-sm">
            I consent to the processing of my personal data for this purpose
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="p-0 h-auto text-muted-foreground"
        >
          {showDetails ? 'Hide details' : 'Show details'}
          {showDetails ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>

        {showDetails && (
          <div className="space-y-3 mt-3 p-3 bg-background rounded-lg border">
            <div>
              <h4 className="font-medium text-sm mb-1">Data types:</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {dataTypes.map((type, index) => (
                  <li key={index}>{type}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Your rights:</h4>
              <p className="text-sm text-muted-foreground">
                You can withdraw your consent at any time. You also have the right to access, 
                rectify, erase, or restrict the processing of your personal data.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Legal basis:</h4>
              <p className="text-sm text-muted-foreground">
                {required 
                  ? 'Processing is necessary for the performance of our services.'
                  : 'Processing is based on your consent (GDPR Art. 6(1)(a)).'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default {
  CookieConsentBanner,
  CookieManagement,
  DataProcessingConsent
};