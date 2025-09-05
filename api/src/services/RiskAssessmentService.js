/**
 * Risk Assessment Service
 * Core fraud detection and risk scoring engine
 * 
 * @author Grupo idRock
 */

const axios = require('axios');
const logger = require('../utils/logger');
const DatabaseService = require('./DatabaseService');
const ProxyCheckService = require('./ProxyCheckService');

class RiskAssessmentService {
  constructor() {
    this.riskFactors = {
      IP_REPUTATION: { weight: 0.3, maxScore: 100 },
      DEVICE_FINGERPRINT: { weight: 0.25, maxScore: 100 },
      BEHAVIORAL_ANALYSIS: { weight: 0.2, maxScore: 100 },
      GEOLOCATION: { weight: 0.15, maxScore: 100 },
      TEMPORAL_PATTERNS: { weight: 0.1, maxScore: 100 }
    };

    this.riskLevels = {
      LOW: { min: 0, max: 30, action: 'allow' },
      MEDIUM: { min: 31, max: 70, action: 'review' },
      HIGH: { min: 71, max: 100, action: 'block' }
    };
  }

  /**
   * Perform comprehensive risk assessment
   * @param {Object} assessmentData - Data for risk assessment
   * @returns {Promise<Object>} Risk assessment result
   */
  async assessRisk(assessmentData) {
    try {
      logger.info(`Starting risk assessment for session: ${assessmentData.sessionId}`);

      // Initialize assessment result
      const assessment = {
        sessionId: assessmentData.sessionId,
        timestamp: new Date().toISOString(),
        event: assessmentData.event,
        riskFactors: {},
        riskScore: 0,
        riskLevel: 'LOW',
        reasons: [],
        recommendedAction: 'allow',
        metadata: {
          processingTime: 0,
          version: '1.0.0'
        }
      };

      const startTime = Date.now();

      // 1. IP Reputation Analysis
      const ipAnalysis = await this.analyzeIPReputation(
        assessmentData.ipAddress || this.extractIPFromRequest(assessmentData)
      );
      assessment.riskFactors.ipReputation = ipAnalysis;

      // 2. Device Fingerprint Analysis
      const deviceAnalysis = await this.analyzeDeviceFingerprint(
        assessmentData.fingerprint,
        assessmentData.deviceInfo
      );
      assessment.riskFactors.deviceFingerprint = deviceAnalysis;

      // 3. Behavioral Analysis
      const behavioralAnalysis = await this.analyzeBehavioralPatterns(
        assessmentData.sessionId,
        assessmentData.behavioralInfo,
        assessmentData.event
      );
      assessment.riskFactors.behavioral = behavioralAnalysis;

      // 4. Geolocation Analysis
      const geoAnalysis = await this.analyzeGeolocation(
        ipAnalysis.location,
        assessmentData.sessionId
      );
      assessment.riskFactors.geolocation = geoAnalysis;

      // 5. Temporal Pattern Analysis
      const temporalAnalysis = await this.analyzeTemporalPatterns(
        assessmentData.sessionId,
        assessmentData.timestamp || new Date().toISOString()
      );
      assessment.riskFactors.temporal = temporalAnalysis;

      // Calculate overall risk score
      assessment.riskScore = this.calculateOverallRiskScore(assessment.riskFactors);
      assessment.riskLevel = this.determineRiskLevel(assessment.riskScore);
      assessment.recommendedAction = this.getRecommendedAction(assessment.riskLevel);
      assessment.reasons = this.generateRiskReasons(assessment.riskFactors);

      // Store assessment result
      await this.storeAssessmentResult(assessment);

      assessment.metadata.processingTime = Date.now() - startTime;
      logger.info(`Risk assessment completed: ${assessment.riskLevel} (${assessment.riskScore})`);

      return assessment;

    } catch (error) {
      logger.error('Risk assessment failed:', error);
      throw error;
    }
  }

  /**
   * Analyze IP reputation and characteristics
   * @param {string} ipAddress - IP address to analyze
   * @returns {Promise<Object>} IP analysis result
   */
  async analyzeIPReputation(ipAddress) {
    try {
      if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
        return {
          score: 10,
          reputation: 'localhost',
          type: 'localhost',
          location: { country: 'LOCAL', region: 'LOCAL' },
          isMalicious: false,
          isProxy: false,
          isVPN: false
        };
      }

      // Use ProxyCheck.io service for IP analysis
      const proxyCheckResult = await ProxyCheckService.checkIP(ipAddress);
      
      let riskScore = 0;
      const reasons = [];

      // Evaluate risk factors
      if (proxyCheckResult.proxy === 'yes') {
        riskScore += 40;
        reasons.push('Proxy connection detected');
      }

      if (proxyCheckResult.type === 'VPN') {
        riskScore += 30;
        reasons.push('VPN connection detected');
      }

      if (proxyCheckResult.risk === 'high') {
        riskScore += 50;
        reasons.push('High-risk IP address');
      }

      if (proxyCheckResult.risk === 'medium') {
        riskScore += 25;
        reasons.push('Medium-risk IP address');
      }

      return {
        score: Math.min(riskScore, 100),
        reputation: proxyCheckResult.risk || 'unknown',
        type: proxyCheckResult.type || 'unknown',
        location: {
          country: proxyCheckResult.country || 'unknown',
          region: proxyCheckResult.region || 'unknown',
          city: proxyCheckResult.city || 'unknown'
        },
        isMalicious: proxyCheckResult.risk === 'high',
        isProxy: proxyCheckResult.proxy === 'yes',
        isVPN: proxyCheckResult.type === 'VPN',
        provider: proxyCheckResult.provider,
        reasons: reasons
      };

    } catch (error) {
      logger.warn('IP reputation analysis failed:', error.message);
      return {
        score: 20,
        reputation: 'unknown',
        type: 'unknown',
        location: { country: 'unknown', region: 'unknown' },
        isMalicious: false,
        isProxy: false,
        isVPN: false,
        reasons: ['Unable to verify IP reputation']
      };
    }
  }

  /**
   * Analyze device fingerprint for anomalies
   * @param {Object} fingerprint - Device fingerprint data
   * @param {Object} deviceInfo - Additional device information
   * @returns {Promise<Object>} Device analysis result
   */
  async analyzeDeviceFingerprint(fingerprint, deviceInfo) {
    try {
      let riskScore = 0;
      const reasons = [];

      if (!fingerprint || !fingerprint.visitorId) {
        riskScore += 30;
        reasons.push('Unable to generate device fingerprint');
      } else {
        // Check if device is known
        const knownDevice = await DatabaseService.findDeviceByFingerprint(fingerprint.visitorId);
        
        if (!knownDevice) {
          riskScore += 15;
          reasons.push('New device detected');
        }

        // Analyze fingerprint confidence
        if (fingerprint.confidence && fingerprint.confidence < 0.5) {
          riskScore += 20;
          reasons.push('Low fingerprint confidence');
        }
      }

      // Analyze device characteristics
      if (deviceInfo) {
        // Check for suspicious user agents
        if (this.isSuspiciousUserAgent(deviceInfo.userAgent)) {
          riskScore += 25;
          reasons.push('Suspicious user agent detected');
        }

        // Check for automation indicators
        if (this.hasAutomationIndicators(deviceInfo)) {
          riskScore += 35;
          reasons.push('Automation indicators detected');
        }

        // Check for inconsistent device information
        if (this.hasInconsistentDeviceInfo(deviceInfo)) {
          riskScore += 20;
          reasons.push('Inconsistent device information');
        }
      }

      return {
        score: Math.min(riskScore, 100),
        isKnownDevice: !!knownDevice,
        fingerprintId: fingerprint?.visitorId,
        confidence: fingerprint?.confidence || 0,
        reasons: reasons
      };

    } catch (error) {
      logger.warn('Device fingerprint analysis failed:', error.message);
      return {
        score: 25,
        isKnownDevice: false,
        fingerprintId: null,
        confidence: 0,
        reasons: ['Unable to analyze device fingerprint']
      };
    }
  }

  /**
   * Analyze user behavioral patterns
   * @param {string} sessionId - Session identifier
   * @param {Object} behavioralInfo - Behavioral data
   * @param {string} eventType - Type of event being assessed
   * @returns {Promise<Object>} Behavioral analysis result
   */
  async analyzeBehavioralPatterns(sessionId, behavioralInfo, eventType) {
    try {
      let riskScore = 0;
      const reasons = [];

      // Get historical behavioral data
      const behaviorHistory = await DatabaseService.getBehaviorHistory(sessionId);

      // Analyze session duration
      if (behavioralInfo && behavioralInfo.sessionStart) {
        const sessionDuration = new Date() - new Date(behavioralInfo.sessionStart);
        const sessionMinutes = sessionDuration / (1000 * 60);

        if (sessionMinutes < 0.5 && eventType === 'checkout') {
          riskScore += 30;
          reasons.push('Very short session before checkout');
        }
      }

      // Analyze page load time
      if (behavioralInfo && behavioralInfo.pageLoadTime) {
        if (behavioralInfo.pageLoadTime < 100) {
          riskScore += 15;
          reasons.push('Unusually fast page interaction');
        }
      }

      // Check for behavioral anomalies
      if (behaviorHistory.length > 0) {
        const anomalies = this.detectBehavioralAnomalies(behaviorHistory, behavioralInfo);
        riskScore += anomalies.score;
        reasons.push(...anomalies.reasons);
      }

      return {
        score: Math.min(riskScore, 100),
        sessionDuration: behavioralInfo?.sessionStart ? 
          new Date() - new Date(behavioralInfo.sessionStart) : 0,
        historicalDataPoints: behaviorHistory.length,
        reasons: reasons
      };

    } catch (error) {
      logger.warn('Behavioral analysis failed:', error.message);
      return {
        score: 15,
        sessionDuration: 0,
        historicalDataPoints: 0,
        reasons: ['Unable to analyze behavioral patterns']
      };
    }
  }

  /**
   * Analyze geolocation patterns
   * @param {Object} location - Current location data
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Geolocation analysis result
   */
  async analyzeGeolocation(location, sessionId) {
    try {
      let riskScore = 0;
      const reasons = [];

      if (!location || location.country === 'unknown') {
        riskScore += 10;
        reasons.push('Unable to determine location');
        return { score: riskScore, reasons: reasons };
      }

      // Get historical location data
      const locationHistory = await DatabaseService.getLocationHistory(sessionId);

      if (locationHistory.length > 0) {
        const lastLocation = locationHistory[0];
        
        // Check for impossible travel
        const travelCheck = this.checkImpossibleTravel(lastLocation, location);
        if (travelCheck.isImpossible) {
          riskScore += 40;
          reasons.push('Impossible travel detected');
        }

        // Check for frequent location changes
        const uniqueCountries = new Set(locationHistory.map(loc => loc.country));
        if (uniqueCountries.size > 3) {
          riskScore += 20;
          reasons.push('Frequent location changes');
        }
      }

      // Check for high-risk countries (simplified for demo)
      const highRiskCountries = ['XX', 'YY']; // Placeholder
      if (highRiskCountries.includes(location.country)) {
        riskScore += 15;
        reasons.push('High-risk geographic region');
      }

      return {
        score: Math.min(riskScore, 100),
        currentLocation: location,
        historicalLocations: locationHistory.length,
        reasons: reasons
      };

    } catch (error) {
      logger.warn('Geolocation analysis failed:', error.message);
      return {
        score: 10,
        currentLocation: location,
        historicalLocations: 0,
        reasons: ['Unable to analyze geolocation patterns']
      };
    }
  }

  /**
   * Analyze temporal access patterns
   * @param {string} sessionId - Session identifier
   * @param {string} timestamp - Current timestamp
   * @returns {Promise<Object>} Temporal analysis result
   */
  async analyzeTemporalPatterns(sessionId, timestamp) {
    try {
      let riskScore = 0;
      const reasons = [];

      const accessTime = new Date(timestamp);
      const hour = accessTime.getHours();
      const dayOfWeek = accessTime.getDay();

      // Check for unusual hours (2-6 AM local time)
      if (hour >= 2 && hour <= 6) {
        riskScore += 15;
        reasons.push('Access during unusual hours');
      }

      // Get historical access patterns
      const accessHistory = await DatabaseService.getAccessHistory(sessionId);
      
      if (accessHistory.length > 5) {
        const patterns = this.analyzeAccessPatterns(accessHistory, accessTime);
        riskScore += patterns.score;
        reasons.push(...patterns.reasons);
      }

      return {
        score: Math.min(riskScore, 100),
        accessHour: hour,
        dayOfWeek: dayOfWeek,
        historicalAccesses: accessHistory.length,
        reasons: reasons
      };

    } catch (error) {
      logger.warn('Temporal analysis failed:', error.message);
      return {
        score: 5,
        accessHour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        historicalAccesses: 0,
        reasons: ['Unable to analyze temporal patterns']
      };
    }
  }

  /**
   * Calculate overall risk score from individual factors
   * @param {Object} riskFactors - Individual risk factor scores
   * @returns {number} Overall risk score (0-100)
   */
  calculateOverallRiskScore(riskFactors) {
    let totalScore = 0;

    Object.keys(this.riskFactors).forEach(factor => {
      const factorKey = factor.toLowerCase().replace('_', '');
      const factorData = riskFactors[factorKey] || riskFactors[factor];
      
      if (factorData && typeof factorData.score === 'number') {
        const weight = this.riskFactors[factor].weight;
        totalScore += factorData.score * weight;
      }
    });

    return Math.min(Math.round(totalScore), 100);
  }

  /**
   * Determine risk level from score
   * @param {number} score - Risk score
   * @returns {string} Risk level
   */
  determineRiskLevel(score) {
    if (score <= this.riskLevels.LOW.max) return 'LOW';
    if (score <= this.riskLevels.MEDIUM.max) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Get recommended action based on risk level
   * @param {string} riskLevel - Risk level
   * @returns {string} Recommended action
   */
  getRecommendedAction(riskLevel) {
    return this.riskLevels[riskLevel]?.action || 'review';
  }

  /**
   * Generate human-readable risk reasons
   * @param {Object} riskFactors - Risk factor analysis results
   * @returns {Array<string>} Risk reasons
   */
  generateRiskReasons(riskFactors) {
    const reasons = [];
    
    Object.values(riskFactors).forEach(factor => {
      if (factor.reasons && Array.isArray(factor.reasons)) {
        reasons.push(...factor.reasons);
      }
    });

    return reasons;
  }

  // Helper methods
  extractIPFromRequest(data) {
    return data.headers?.['x-forwarded-for'] || 
           data.headers?.['x-real-ip'] || 
           data.connection?.remoteAddress || 
           '127.0.0.1';
  }

  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;
    
    const suspiciousPatterns = [
      /headless/i,
      /phantom/i,
      /selenium/i,
      /webdriver/i,
      /bot/i,
      /crawler/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  hasAutomationIndicators(deviceInfo) {
    if (!deviceInfo) return false;

    // Check for automation indicators
    return (
      !deviceInfo.cookieEnabled ||
      deviceInfo.hardwareConcurrency > 16 ||
      deviceInfo.deviceMemory > 32 ||
      !deviceInfo.languages || deviceInfo.languages.length === 0
    );
  }

  hasInconsistentDeviceInfo(deviceInfo) {
    if (!deviceInfo) return false;

    // Check for inconsistencies
    const screenWidth = parseInt(deviceInfo.screenResolution?.split('x')[0] || 0);
    const windowWidth = parseInt(deviceInfo.windowSize?.split('x')[0] || 0);

    return windowWidth > screenWidth; // Window larger than screen
  }

  detectBehavioralAnomalies(history, current) {
    // Simplified anomaly detection
    return { score: 0, reasons: [] };
  }

  checkImpossibleTravel(lastLocation, currentLocation) {
    // Simplified impossible travel check
    return { isImpossible: false };
  }

  analyzeAccessPatterns(history, currentTime) {
    // Simplified pattern analysis
    return { score: 0, reasons: [] };
  }

  async storeAssessmentResult(assessment) {
    try {
      await DatabaseService.storeRiskAssessment(assessment);
    } catch (error) {
      logger.warn('Failed to store assessment result:', error.message);
    }
  }
}

module.exports = new RiskAssessmentService();