/**
 * Security Audit Logging System
 * Comprehensive logging for security events, access tracking, and compliance
 */

import { auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  getFirestore 
} from 'firebase/firestore';

// Security Event Types
export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_CHALLENGE_FAILED = 'mfa_challenge_failed',
  
  // Session Events
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired',
  SESSION_TERMINATED = 'session_terminated',
  CONCURRENT_SESSION_DETECTED = 'concurrent_session_detected',
  
  // Access Control Events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHANGE = 'role_change',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  
  // Data Access Events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  BULK_DATA_OPERATION = 'bulk_data_operation',
  
  // System Security Events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MALICIOUS_REQUEST = 'malicious_request',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  CSRF_TOKEN_MISMATCH = 'csrf_token_mismatch',
  
  // API Security Events
  API_KEY_CREATED = 'api_key_created',
  API_KEY_DELETED = 'api_key_deleted',
  API_KEY_MISUSE = 'api_key_misuse',
  INVALID_API_REQUEST = 'invalid_api_request',
  API_RATE_LIMIT_EXCEEDED = 'api_rate_limit_exceeded',
  
  // Privacy Events
  GDPR_DATA_REQUEST = 'gdpr_data_request',
  GDPR_DATA_DELETION = 'gdpr_data_deletion',
  PRIVACY_SETTINGS_CHANGED = 'privacy_settings_changed',
  COOKIE_CONSENT_CHANGED = 'cookie_consent_changed',
  
  // Administrative Events
  ADMIN_LOGIN = 'admin_login',
  USER_IMPERSONATION = 'user_impersonation',
  SYSTEM_CONFIGURATION_CHANGE = 'system_configuration_change',
  SECURITY_POLICY_CHANGE = 'security_policy_change'
}

// Security Event Severity Levels
export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security Event Interface
export interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Timestamp;
  details: Record<string, any>;
  metadata: {
    location?: string;
    device?: string;
    browser?: string;
    os?: string;
    isSuspicious?: boolean;
    riskScore?: number;
  };
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  notes?: string;
}

// Security Audit Logger Class
export class SecurityAuditLogger {
  private db = getFirestore();
  private collectionName = 'security_events';

  /**
   * Log a security event
   */
  async logEvent(
    type: SecurityEventType,
    severity: SecurityEventSeverity,
    details: Record<string, any> = {},
    additionalMetadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getClientIP();

      const event: Omit<SecurityEvent, 'id'> = {
        type,
        severity,
        userId: user?.uid,
        userEmail: user?.email || undefined,
        sessionId: this.getSessionId(),
        ipAddress,
        userAgent,
        timestamp: Timestamp.now(),
        details,
        metadata: {
          location: await this.getLocation(),
          device: this.getDeviceInfo(),
          browser: this.getBrowserInfo(),
          os: this.getOSInfo(),
          isSuspicious: this.calculateSuspiciousActivity(type, details),
          riskScore: this.calculateRiskScore(type, severity, details),
          ...additionalMetadata
        },
        resolved: false
      };

      await addDoc(collection(this.db, this.collectionName), event);

      // Alert on high severity events
      if (severity === SecurityEventSeverity.HIGH || severity === SecurityEventSeverity.CRITICAL) {
        await this.sendSecurityAlert(event);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
      // Fallback logging to local storage for critical events
      this.fallbackLog(type, severity, details);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    type: SecurityEventType,
    success: boolean,
    details: Record<string, any> = {}
  ): Promise<void> {
    const severity = success 
      ? SecurityEventSeverity.LOW 
      : SecurityEventSeverity.MEDIUM;

    await this.logEvent(type, severity, {
      success,
      ...details
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    operation: 'read' | 'write' | 'delete',
    resourceType: string,
    resourceId: string,
    sensitive: boolean = false
  ): Promise<void> {
    const severity = sensitive 
      ? SecurityEventSeverity.MEDIUM 
      : SecurityEventSeverity.LOW;

    await this.logEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESS,
      severity,
      {
        operation,
        resourceType,
        resourceId,
        sensitive
      }
    );
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    description: string,
    evidence: Record<string, any> = {},
    severity: SecurityEventSeverity = SecurityEventSeverity.HIGH
  ): Promise<void> {
    await this.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity,
      {
        description,
        evidence,
        automaticDetection: true
      }
    );
  }

  /**
   * Log rate limiting events
   */
  async logRateLimitExceeded(
    endpoint: string,
    limit: number,
    attempts: number
  ): Promise<void> {
    await this.logEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventSeverity.MEDIUM,
      {
        endpoint,
        limit,
        attempts,
        timeWindow: '1hour'
      }
    );
  }

  /**
   * Get security events for a user
   */
  async getUserSecurityEvents(
    userId: string,
    limitCount: number = 50
  ): Promise<SecurityEvent[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SecurityEvent));
    } catch (error) {
      console.error('Failed to fetch user security events:', error);
      return [];
    }
  }

  /**
   * Get recent security events
   */
  async getRecentEvents(
    limitCount: number = 100,
    severity?: SecurityEventSeverity
  ): Promise<SecurityEvent[]> {
    try {
      let q = query(
        collection(this.db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (severity) {
        q = query(
          collection(this.db, this.collectionName),
          where('severity', '==', severity),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SecurityEvent));
    } catch (error) {
      console.error('Failed to fetch recent security events:', error);
      return [];
    }
  }

  /**
   * Mark security event as resolved
   */
  async resolveEvent(
    eventId: string,
    resolvedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      const eventRef = collection(this.db, this.collectionName);
      await addDoc(eventRef, {
        resolved: true,
        resolvedBy,
        resolvedAt: Timestamp.now(),
        notes
      });
    } catch (error) {
      console.error('Failed to resolve security event:', error);
    }
  }

  // Private helper methods
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private async getLocation(): Promise<string> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return `${data.city}, ${data.country_name}`;
    } catch {
      return 'unknown';
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'Mobile';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private calculateSuspiciousActivity(
    type: SecurityEventType,
    details: Record<string, any>
  ): boolean {
    const suspiciousTypes = [
      SecurityEventType.LOGIN_FAILURE,
      SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
      SecurityEventType.MALICIOUS_REQUEST,
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.RATE_LIMIT_EXCEEDED
    ];

    return suspiciousTypes.includes(type) || details.multipleFailedAttempts === true;
  }

  private calculateRiskScore(
    type: SecurityEventType,
    severity: SecurityEventSeverity,
    details: Record<string, any>
  ): number {
    let score = 0;

    // Base score by severity
    switch (severity) {
      case SecurityEventSeverity.LOW: score = 1; break;
      case SecurityEventSeverity.MEDIUM: score = 3; break;
      case SecurityEventSeverity.HIGH: score = 7; break;
      case SecurityEventSeverity.CRITICAL: score = 10; break;
    }

    // Increase score for specific types
    const highRiskTypes = [
      SecurityEventType.MALICIOUS_REQUEST,
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT
    ];

    if (highRiskTypes.includes(type)) {
      score += 3;
    }

    // Increase score for multiple failures
    if (details.consecutiveFailures > 3) {
      score += 2;
    }

    return Math.min(score, 10); // Cap at 10
  }

  private async sendSecurityAlert(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    // Implementation would depend on your alerting system
    // Could be email, Slack, PagerDuty, etc.
    console.warn('Security Alert:', {
      type: event.type,
      severity: event.severity,
      user: event.userEmail,
      time: event.timestamp.toDate()
    });
  }

  private fallbackLog(
    type: SecurityEventType,
    severity: SecurityEventSeverity,
    details: Record<string, any>
  ): void {
    const fallbackEvent = {
      type,
      severity,
      details,
      timestamp: new Date().toISOString(),
      fallback: true
    };

    const existingLogs = JSON.parse(
      localStorage.getItem('security_event_fallback') || '[]'
    );
    existingLogs.push(fallbackEvent);

    // Keep only last 100 fallback events
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }

    localStorage.setItem('security_event_fallback', JSON.stringify(existingLogs));
  }
}

// Create singleton instance
export const securityLogger = new SecurityAuditLogger();

// Convenience methods for common logging scenarios
export const logSecurityEvent = {
  // Authentication
  loginSuccess: (details?: Record<string, any>) => 
    securityLogger.logAuthEvent(SecurityEventType.LOGIN_SUCCESS, true, details),
  
  loginFailure: (details?: Record<string, any>) => 
    securityLogger.logAuthEvent(SecurityEventType.LOGIN_FAILURE, false, details),
  
  logout: () => 
    securityLogger.logEvent(SecurityEventType.LOGOUT, SecurityEventSeverity.LOW),

  // Data access
  dataAccess: (operation: 'read' | 'write' | 'delete', resource: string, sensitive = false) =>
    securityLogger.logDataAccess(operation, 'app_data', resource, sensitive),

  // Suspicious activity
  suspiciousActivity: (description: string, evidence?: Record<string, any>) =>
    securityLogger.logSuspiciousActivity(description, evidence),

  // Rate limiting
  rateLimitExceeded: (endpoint: string, limit: number, attempts: number) =>
    securityLogger.logRateLimitExceeded(endpoint, limit, attempts),

  // Privacy events
  gdprRequest: (requestType: string, details?: Record<string, any>) =>
    securityLogger.logEvent(SecurityEventType.GDPR_DATA_REQUEST, SecurityEventSeverity.MEDIUM, {
      requestType,
      ...details
    }),

  cookieConsentChanged: (preferences: Record<string, boolean>) =>
    securityLogger.logEvent(SecurityEventType.COOKIE_CONSENT_CHANGED, SecurityEventSeverity.LOW, {
      preferences
    })
};

export default SecurityAuditLogger;