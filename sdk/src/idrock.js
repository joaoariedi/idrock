/**
 * idRock SDK - Fraud Detection and Risk Assessment Library
 * 
 * @author Grupo idRock
 * @version 1.0.0
 * @license MIT
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import axios from 'axios';

/**
 * Main idRock SDK class for fraud detection and risk assessment
 */
export class IdRockSDK {
  /**
   * Initialize the idRock SDK
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - API key for authentication
   * @param {string} config.apiUrl - Backend API URL
   * @param {number} config.timeout - Request timeout in milliseconds (default: 5000)
   * @param {boolean} config.enableFingerprinting - Enable device fingerprinting (default: true)
   */
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      apiUrl: config.apiUrl || 'http://localhost:3001/api',
      timeout: config.timeout || 5000,
      enableFingerprinting: config.enableFingerprinting !== false,
      debug: config.debug || false
    };

    if (!this.config.apiKey) {
      console.warn('idRock SDK: API key not provided. Some features may not work correctly.');
    }

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    this.fingerprintPromise = null;
    this.sessionId = this.generateSessionId();
    
    if (this.config.enableFingerprinting) {
      this.initializeFingerprinting();
    }
  }

  /**
   * Initialize device fingerprinting
   * @private
   */
  async initializeFingerprinting() {
    try {
      const fp = await FingerprintJS.load();
      this.fingerprintPromise = fp.get();
      this.log('Fingerprinting initialized successfully');
    } catch (error) {
      this.log('Failed to initialize fingerprinting:', error.message);
      this.fingerprintPromise = Promise.resolve({
        visitorId: 'fallback_' + Math.random().toString(36).substr(2, 9),
        components: {}
      });
    }
  }

  /**
   * Generate unique session ID
   * @private
   * @returns {string} Session ID
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Collect device and browser information
   * @private
   * @returns {Object} Device information
   */
  collectDeviceInfo() {
    const navigator = window.navigator;
    const screen = window.screen;
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      screenResolution: `${screen.width}x${screen.height}`,
      screenColorDepth: screen.colorDepth,
      screenPixelDepth: screen.pixelDepth,
      availableScreenResolution: `${screen.availWidth}x${screen.availHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset()
    };
  }

  /**
   * Collect behavioral data
   * @private
   * @returns {Object} Behavioral information
   */
  collectBehavioralInfo() {
    return {
      timestamp: new Date().toISOString(),
      sessionStart: this.sessionStart || new Date().toISOString(),
      pageLoadTime: performance.now(),
      referrer: document.referrer,
      currentUrl: window.location.href,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      documentSize: `${document.documentElement.scrollWidth}x${document.documentElement.scrollHeight}`
    };
  }

  /**
   * Assess risk for a specific event
   * @param {Object} eventData - Event data for risk assessment
   * @param {string} eventData.event - Event type (e.g., 'login', 'checkout', 'payment')
   * @param {number} [eventData.amount] - Transaction amount (if applicable)
   * @param {string} [eventData.currency] - Currency code (if applicable)
   * @param {Object} [eventData.metadata] - Additional metadata
   * @returns {Promise<Object>} Risk assessment result
   */
  async assessRisk(eventData = {}) {
    try {
      this.log('Starting risk assessment for event:', eventData.event);

      // Collect device fingerprint
      let fingerprint = null;
      if (this.config.enableFingerprinting && this.fingerprintPromise) {
        fingerprint = await this.fingerprintPromise;
      }

      // Prepare assessment data
      const assessmentData = {
        sessionId: this.sessionId,
        event: eventData.event || 'unknown',
        amount: eventData.amount,
        currency: eventData.currency || 'BRL',
        metadata: eventData.metadata || {},
        deviceInfo: this.collectDeviceInfo(),
        behavioralInfo: this.collectBehavioralInfo(),
        fingerprint: fingerprint ? {
          visitorId: fingerprint.visitorId,
          confidence: fingerprint.confidence,
          components: fingerprint.components
        } : null,
        userAgent: window.navigator.userAgent,
        ipAddress: null // Will be determined by backend
      };

      // Send to backend for analysis
      const response = await this.httpClient.post('/assess-risk', assessmentData);
      
      this.log('Risk assessment completed:', response.data);
      return response.data;

    } catch (error) {
      this.log('Risk assessment failed:', error.message);
      
      // Return fallback response
      return {
        sessionId: this.sessionId,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        reasons: ['Unable to perform complete risk analysis'],
        recommendedAction: 'manual_review',
        timestamp: new Date().toISOString(),
        error: true,
        errorMessage: error.message
      };
    }
  }

  /**
   * Track user behavior event
   * @param {Object} event - Behavior event data
   * @param {string} event.type - Event type
   * @param {Object} event.data - Event data
   * @returns {Promise<void>}
   */
  async trackEvent(event) {
    try {
      const trackingData = {
        sessionId: this.sessionId,
        type: event.type,
        data: event.data,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      await this.httpClient.post('/track-event', trackingData);
      this.log('Event tracked:', event.type);
    } catch (error) {
      this.log('Failed to track event:', error.message);
    }
  }

  /**
   * Initialize session tracking
   * @returns {Promise<string>} Session ID
   */
  async initializeSession() {
    try {
      const sessionData = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: window.navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href
      };

      await this.httpClient.post('/initialize-session', sessionData);
      this.sessionStart = new Date().toISOString();
      this.log('Session initialized:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      this.log('Failed to initialize session:', error.message);
      return this.sessionId;
    }
  }

  /**
   * Get current session information
   * @returns {Object} Session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      apiUrl: this.config.apiUrl,
      fingerprintingEnabled: this.config.enableFingerprinting
    };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update HTTP client headers if API key changed
    if (newConfig.apiKey) {
      this.httpClient.defaults.headers['Authorization'] = `Bearer ${newConfig.apiKey}`;
    }
  }

  /**
   * Enable debug mode
   */
  enableDebug() {
    this.config.debug = true;
  }

  /**
   * Disable debug mode
   */
  disableDebug() {
    this.config.debug = false;
  }

  /**
   * Log debug messages
   * @private
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[idRock SDK]', ...args);
    }
  }
}

// Export default instance creation function
export default function createIdRockSDK(config) {
  return new IdRockSDK(config);
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  window.IdRockSDK = IdRockSDK;
  window.createIdRockSDK = createIdRockSDK;
}