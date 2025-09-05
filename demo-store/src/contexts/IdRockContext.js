import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import axios from 'axios';

const IdRockContext = createContext();

// Risk levels configuration
export const RISK_LEVELS = {
  LOW: {
    value: 'LOW',
    color: '#28a745',
    background: '#d4edda',
    threshold: 30,
    description: 'Transaction appears safe to proceed'
  },
  MEDIUM: {
    value: 'MEDIUM', 
    color: '#ffc107',
    background: '#fff3cd',
    threshold: 70,
    description: 'Transaction requires additional verification'
  },
  HIGH: {
    value: 'HIGH',
    color: '#dc3545', 
    background: '#f8d7da',
    threshold: 100,
    description: 'Transaction flagged as high risk - manual review required'
  }
};

export function IdRockProvider({ children }) {
  const sdkRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentRiskAssessment, setCurrentRiskAssessment] = useState(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // Initialize IdRock SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Create SDK instance with configuration
        // For demo purposes, we'll create a mock implementation
        const IdRockSDK = class {
          constructor(config) {
            this.config = config;
            this.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          }
          
          async initializeSession() {
            return this.sessionId;
          }
          
          async assessRisk(eventData) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            // Generate realistic risk assessment
            const baseScore = Math.random() * 100;
            let riskScore, riskLevel, reasons = [], recommendedAction;
            
            if (baseScore < 30) {
              riskScore = Math.floor(baseScore);
              riskLevel = 'LOW';
              reasons = ['Transaction patterns appear normal', 'Device recognized', 'Geolocation consistent'];
              recommendedAction = 'approve';
            } else if (baseScore < 70) {
              riskScore = Math.floor(30 + Math.random() * 40);
              riskLevel = 'MEDIUM';
              reasons = ['First-time purchase', 'New payment method', 'Higher than average order value'];
              recommendedAction = 'review';
            } else {
              riskScore = Math.floor(70 + Math.random() * 30);
              riskLevel = 'HIGH';
              reasons = ['Suspicious velocity patterns', 'Unusual purchase behavior', 'High-risk geolocation'];
              recommendedAction = 'block';
            }
            
            return {
              sessionId: this.sessionId,
              riskScore,
              riskLevel,
              reasons,
              recommendedAction,
              timestamp: new Date().toISOString(),
              event: eventData.event,
              amount: eventData.amount,
              currency: eventData.currency || 'BRL'
            };
          }
          
          async trackEvent(event) {
            // Mock event tracking
            console.log('Event tracked:', event);
          }
        };
        
        sdkRef.current = new IdRockSDK({
          apiUrl: process.env.REACT_APP_IDROCK_API_URL || 'http://localhost:8080/api',
          apiKey: process.env.REACT_APP_IDROCK_API_KEY || 'demo_key',
          enableFingerprinting: true,
          debug: process.env.REACT_APP_ENVIRONMENT === 'development'
        });

        // Initialize session
        const sessionId = await sdkRef.current.initializeSession();
        setSessionId(sessionId);
        setIsInitialized(true);
        
        console.log('IdRock SDK initialized successfully with session:', sessionId);
      } catch (error) {
        console.error('Failed to initialize IdRock SDK:', error);
        setIsInitialized(false);
      }
    };

    initializeSDK();
  }, []);

  // Assess risk for transaction/event
  const assessRisk = async (eventData) => {
    if (!sdkRef.current || !isInitialized) {
      console.warn('IdRock SDK not initialized');
      return createFallbackAssessment();
    }

    setIsAssessing(true);
    
    try {
      const assessment = await sdkRef.current.assessRisk(eventData);
      
      // Enhance assessment with UI helpers
      const enhancedAssessment = {
        ...assessment,
        riskLevel: getRiskLevel(assessment.riskScore),
        riskConfig: getRiskConfig(assessment.riskScore),
        timestamp: new Date().toISOString()
      };
      
      setCurrentRiskAssessment(enhancedAssessment);
      return enhancedAssessment;
    } catch (error) {
      console.error('Risk assessment failed:', error);
      const fallback = createFallbackAssessment();
      setCurrentRiskAssessment(fallback);
      return fallback;
    } finally {
      setIsAssessing(false);
    }
  };

  // Track user behavior event
  const trackEvent = async (eventType, eventData) => {
    if (!sdkRef.current || !isInitialized) {
      return;
    }

    try {
      await sdkRef.current.trackEvent({
        type: eventType,
        data: eventData
      });
    } catch (error) {
      console.error('Event tracking failed:', error);
    }
  };

  // Get risk level based on score
  const getRiskLevel = (riskScore) => {
    if (riskScore < RISK_LEVELS.LOW.threshold) return RISK_LEVELS.LOW.value;
    if (riskScore < RISK_LEVELS.MEDIUM.threshold) return RISK_LEVELS.MEDIUM.value;
    return RISK_LEVELS.HIGH.value;
  };

  // Get risk configuration based on score
  const getRiskConfig = (riskScore) => {
    const level = getRiskLevel(riskScore);
    return RISK_LEVELS[level];
  };

  // Create fallback assessment when SDK fails
  const createFallbackAssessment = () => {
    return {
      sessionId: sessionId || 'fallback_session',
      riskScore: 50,
      riskLevel: 'MEDIUM',
      riskConfig: RISK_LEVELS.MEDIUM,
      reasons: ['Unable to perform complete risk analysis'],
      recommendedAction: 'manual_review',
      timestamp: new Date().toISOString(),
      error: true,
      errorMessage: 'SDK not available or initialization failed'
    };
  };

  // Assess checkout risk
  const assessCheckoutRisk = async (checkoutData) => {
    const eventData = {
      event: 'checkout',
      amount: checkoutData.amount,
      currency: checkoutData.currency || 'BRL',
      metadata: {
        items: checkoutData.items,
        customerInfo: checkoutData.customerInfo,
        paymentMethod: checkoutData.paymentMethod,
        shippingAddress: checkoutData.shippingAddress,
        billingAddress: checkoutData.billingAddress
      }
    };

    return await assessRisk(eventData);
  };

  // Clear current assessment
  const clearAssessment = () => {
    setCurrentRiskAssessment(null);
  };

  const value = {
    isInitialized,
    sessionId,
    currentRiskAssessment,
    isAssessing,
    assessRisk,
    assessCheckoutRisk,
    trackEvent,
    clearAssessment,
    getRiskLevel,
    getRiskConfig,
    RISK_LEVELS
  };

  return (
    <IdRockContext.Provider value={value}>
      {children}
    </IdRockContext.Provider>
  );
}

export function useIdRock() {
  const context = useContext(IdRockContext);
  if (!context) {
    throw new Error('useIdRock must be used within an IdRockProvider');
  }
  return context;
}

export default IdRockContext;