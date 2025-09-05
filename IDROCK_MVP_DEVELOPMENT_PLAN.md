# idRock MVP - Academic Fraud Detection System
## Streamlined Development Plan for College Implementation

### Project Overview

**Project Name:** idRock MVP - Academic Fraud Detection System  
**Client:** NexShop (Simulated)  
**Team:** Grupo idRock (João Carlos Ariedi Filho, Raphael Hideyuki Uematsu, Tiago Elusardo Marques, Lucas Mazzaferro Dias)  
**Academic Institution:** FIAP - Faculdade de Informática e Administração Paulista  
**Course:** Defesa Cibernética (2TDCOB)  
**Year:** 2025  
**Scope:** Academic Demonstration MVP

### Executive Summary

The idRock MVP is a simplified fraud detection system designed specifically for academic demonstration. This streamlined version focuses on core fraud detection concepts while maintaining practical applicability. The system demonstrates IP reputation analysis, device fingerprinting, and risk assessment through a complete integration example with a mock e-commerce platform.

**Key MVP Principles:**
- Academic-appropriate complexity level
- Demonstrable core fraud detection concepts
- Complete end-to-end integration example
- Docker-based development environment
- Clear educational value and practical application

---

## 1. MVP Scope Definition

### 1.1 Core Objectives
- Demonstrate fundamental fraud detection principles
- Showcase real-world security integration patterns
- Provide hands-on experience with modern web security
- Create a portfolio-worthy academic project
- Establish foundation for future commercial development

### 1.2 Academic Context
- **Complexity Level:** Intermediate - suitable for final year computer science students
- **Implementation Time:** 6-8 weeks (academic timeline)
- **Team Size:** 4 students with defined roles
- **Technology Focus:** Modern JavaScript ecosystem, API integration, containerization
- **Evaluation Criteria:** Technical implementation, security understanding, presentation quality

### 1.3 Success Metrics
- **Functional Requirements:** All MVP features working correctly
- **Integration Success:** Complete e-commerce checkout flow with fraud detection
- **Performance:** Risk assessment response time < 2 seconds
- **Demonstration Quality:** Clear presentation of fraud detection in action
- **Code Quality:** Well-documented, testable, maintainable codebase

---

## 2. Simplified Architecture

### 2.1 MVP Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    idRock MVP System                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend SDK (JavaScript)                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   IP Analysis   │  │  Device Fingerp │  │  Risk Calc   │ │
│  │   Integration   │  │  Collection     │  │  Engine      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                               │                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            HTTP/REST API Communication                  │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Node.js + Express)                           │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│  │     Risk Assessment         │ │     Data Storage        │ │
│  │     Service                 │ │     (SQLite + JSON)     │ │
│  │     - IP Reputation Check   │ │     - User Sessions     │ │
│  │     - Device Fingerprinting │ │     - Risk History      │ │
│  │     - Risk Score Calculation│ │     - Analytics Data    │ │
│  └─────────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Demo Environment (Docker Compose)                          │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│  │     Mock NexShop Store      │ │     nginx Proxy         │ │
│  │     (React Application)     │ │     (Load Balancer)     │ │
│  │     - Product Catalog       │ │     - SSL Termination   │ │
│  │     - Shopping Cart         │ │     - Static Assets     │ │
│  │     - Checkout with idRock  │ │     - Service Routing   │ │
│  └─────────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack (Simplified)

**Frontend:**
- **Core Language:** JavaScript (ES6+)
- **SDK Framework:** Vanilla JS (maximum compatibility)
- **Demo Store:** React.js (modern UI framework)
- **HTTP Client:** Axios (API communication)

**Backend:**
- **Runtime:** Node.js (LTS version)
- **Web Framework:** Express.js (lightweight REST API)
- **Database:** SQLite (embedded, zero-config)
- **Configuration:** JSON files (simple configuration management)

**External Services:**
- **IP Analysis:** ProxyCheck.io API (free tier)
- **Device Fingerprinting:** FingerprintJS Open Source

**Development Environment:**
- **Containerization:** Docker + Docker Compose
- **Process Management:** PM2 (development mode)
- **Reverse Proxy:** nginx (request routing)

**Development Tools:**
- **Version Control:** Git with feature branches
- **Code Quality:** ESLint + Prettier (automated formatting)
- **Testing:** Jest (unit tests) + Postman (API testing)
- **Documentation:** JSDoc (code documentation)

---

## 3. Core MVP Features

### 3.1 IP Reputation Analysis
**Primary Goal:** Detect suspicious IP addresses and connection types

**Implementation:**
- ProxyCheck.io API integration for IP analysis
- VPN/Proxy detection capabilities
- Geographic location validation
- ISP and organization identification

**Risk Factors Evaluated:**
- Known malicious IP reputation
- Anonymous connection methods (VPN, Proxy, TOR)
- Geographic inconsistencies with user profile
- Hosting provider vs residential IP classification

**API Response Example:**
```javascript
{
  "ip": "192.168.1.100",
  "reputation": "clean",
  "connectionType": "residential",
  "country": "BR",
  "region": "SP",
  "riskScore": 15,
  "riskFactors": []
}
```

### 3.2 Device Fingerprinting
**Primary Goal:** Identify and track devices across sessions

**Implementation:**
- FingerprintJS integration for browser fingerprinting
- Hardware characteristic collection
- Browser and OS identification
- Canvas and WebGL fingerprinting

**Collected Attributes:**
- Screen resolution and color depth
- Timezone and language preferences  
- Browser plugins and extensions
- Hardware specifications (memory, CPU cores)
- WebGL renderer information

**Privacy Considerations:**
- No personally identifiable information collected
- LGPD compliance with user consent
- Data minimization principles applied
- Transparent data collection practices

### 3.3 Risk Scoring Engine
**Primary Goal:** Combine multiple signals into actionable risk assessment

**Algorithm Design:**
```javascript
// Simplified Risk Calculation
riskScore = (ipRisk * 0.4) + (deviceRisk * 0.3) + (behavioralRisk * 0.3)

// Risk Levels
LOW: 0-30    (Proceed normally)
MEDIUM: 31-70 (Show security notice)
HIGH: 71-100  (Require additional verification)
```

**Scoring Factors:**
- IP reputation score (0-100)
- Device recognition status (new/known)
- Geographic consistency check
- Connection type assessment
- Historical access patterns

**Response Format:**
```javascript
{
  "sessionId": "sess_abc123",
  "riskScore": 45,
  "riskLevel": "MEDIUM",
  "reasons": [
    "New device detected",
    "VPN connection identified"
  ],
  "recommendedAction": "show_security_notice",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 3.4 Integration SDK
**Primary Goal:** Provide easy integration for customer applications

**SDK Features:**
- Simple JavaScript library (< 50KB)
- Asynchronous risk assessment
- Configurable risk thresholds
- Event-based integration hooks
- Error handling and fallback mechanisms

**Integration Example:**
```javascript
// Initialize idRock SDK
const idRock = new IdRockSDK({
  apiKey: 'your-api-key',
  endpoint: 'https://api.idrock.example.com',
  timeout: 5000
});

// Assess risk during sensitive operations
const result = await idRock.assessRisk({
  event: 'checkout_attempt',
  amount: 299.99,
  currency: 'BRL'
});

// Handle risk assessment result
switch(result.riskLevel) {
  case 'LOW':
    // Proceed with transaction
    break;
  case 'MEDIUM':
    // Show security notice
    showSecurityWarning(result.reasons);
    break;
  case 'HIGH':
    // Require additional verification
    requireTwoFactorAuth();
    break;
}
```

---

## 4. Docker Compose Development Environment

### 4.1 Environment Overview
The complete development environment runs with a single `docker-compose up` command, providing:
- idRock API service
- Mock NexShop e-commerce store
- nginx reverse proxy
- Development tools and utilities

### 4.2 Service Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # idRock Fraud Detection API
  idrock-api:
    build: ./services/idrock-api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PROXYCHECK_API_KEY=${PROXYCHECK_API_KEY}
      - SQLITE_DB=/app/data/idrock.db
    volumes:
      - ./data:/app/data
      - ./services/idrock-api:/app
    depends_on:
      - nginx

  # Mock E-commerce Store (NexShop)
  nexshop-store:
    build: ./services/nexshop-store
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_IDROCK_API=http://localhost:8080/api
    volumes:
      - ./services/nexshop-store:/app
    depends_on:
      - idrock-api

  # Reverse Proxy and Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - idrock-api
      - nexshop-store

volumes:
  app_data:
    driver: local
```

### 4.3 Quick Start Guide

```bash
# Clone repository
git clone [repository-url] idrock-mvp
cd idrock-mvp

# Set up environment variables
cp .env.example .env
# Edit .env with your ProxyCheck.io API key

# Start complete development environment
docker-compose up -d

# Access applications
# NexShop Store: http://localhost:8080
# idRock API: http://localhost:8080/api
# API Documentation: http://localhost:8080/docs
```

### 4.4 Development Workflow

**Daily Development:**
```bash
# Start services in development mode
docker-compose up

# View logs from specific service
docker-compose logs -f idrock-api

# Restart specific service after changes
docker-compose restart nexshop-store

# Run tests in API container
docker-compose exec idrock-api npm test

# Access database for debugging
docker-compose exec idrock-api sqlite3 /app/data/idrock.db
```

---

## 5. Mock Customer Service Integration

### 5.1 NexShop E-commerce Simulation

**Store Features:**
- Product catalog with 20+ demo products
- Shopping cart with add/remove functionality
- User account simulation (no real registration)
- Checkout process with payment simulation
- Order confirmation and tracking

**Product Categories:**
- Electronics (Smartphones, Laptops)
- Fashion (Clothing, Accessories)  
- Home & Garden (Furniture, Appliances)
- Books & Media (Digital content)

### 5.2 idRock Integration Points

**Integration Checkpoints:**
1. **User Login Simulation** - Initial risk assessment
2. **Add to Cart** - Behavioral pattern analysis
3. **Checkout Initiation** - Comprehensive fraud check
4. **Payment Processing** - Final security validation

**Checkout Flow Integration:**
```javascript
// Stage 1: Checkout Initiation
const initialRisk = await idRock.assessRisk({
  event: 'checkout_start',
  cartValue: calculateCartTotal(),
  itemCount: cart.length
});

// Stage 2: Shipping Information
if (initialRisk.riskLevel === 'MEDIUM') {
  showSecurityNotice('Please verify your shipping address');
}

// Stage 3: Payment Processing
const paymentRisk = await idRock.assessRisk({
  event: 'payment_attempt',
  amount: orderTotal,
  paymentMethod: selectedPaymentMethod
});

// Stage 4: Order Completion
if (paymentRisk.riskLevel === 'HIGH') {
  requireAdditionalVerification();
} else {
  processOrder();
}
```

### 5.3 Demonstration Scenarios

**Scenario 1: Normal Customer Journey**
- Standard browser, residential IP
- Expected risk level: LOW
- Smooth checkout experience
- No additional friction

**Scenario 2: Cautious Customer (VPN User)**
- VPN connection detected
- Expected risk level: MEDIUM  
- Security notice displayed
- Optional additional verification

**Scenario 3: Suspicious Activity Simulation**
- Proxy server connection
- Rapid cart additions
- Expected risk level: HIGH
- Two-factor authentication required

### 5.4 Visual Fraud Detection Dashboard

**Real-time Risk Display:**
- Risk meter visualization (gauge chart)
- Risk factor breakdown
- Geographic location map
- Device fingerprint details
- Historical access patterns

**Administrative Interface:**
- Risk assessment logs
- User session analytics
- Fraud detection statistics
- System performance metrics

---

## 6. Academic Implementation Timeline

### 6.1 Phase 1: Foundation Setup (Weeks 1-2)

**Week 1 Objectives:**
- Development environment setup
- Docker Compose configuration
- Basic project structure creation
- Team role assignments and Git workflow

**Team Assignments:**
- **João Carlos Ariedi Filho:** Project lead, backend API development
- **Raphael Hideyuki Uematsu:** Frontend SDK and React integration
- **Tiago Elusardo Marques:** External API integration and testing
- **Lucas Mazzaferro Dias:** Docker setup and deployment configuration

**Week 1 Deliverables:**
- Working Docker Compose environment
- Basic Express.js API structure
- React application template
- Git repository with branch protection

**Week 2 Objectives:**
- ProxyCheck.io API integration
- Basic IP reputation analysis
- FingerprintJS integration setup
- Initial risk scoring algorithm

**Week 2 Deliverables:**
- IP analysis endpoint functional
- Device fingerprinting data collection
- Basic risk calculation logic
- Unit tests for core functions

### 6.2 Phase 2: Core Feature Development (Weeks 3-4)

**Week 3 Objectives:**
- Complete risk assessment engine
- Frontend SDK development
- Mock e-commerce store creation
- Integration between all components

**Week 3 Deliverables:**
- Functional risk assessment API
- JavaScript SDK with all methods
- Basic e-commerce product catalog
- Shopping cart functionality

**Week 4 Objectives:**
- Checkout integration with idRock
- Visual risk display components
- Error handling and edge cases
- Performance optimization

**Week 4 Deliverables:**
- Complete checkout flow with fraud detection
- Risk visualization dashboard
- Comprehensive error handling
- API response time optimization

### 6.3 Phase 3: Testing and Refinement (Weeks 5-6)

**Week 5 Objectives:**
- Comprehensive testing strategy
- Documentation creation
- Security validation
- Performance benchmarking

**Week 5 Deliverables:**
- Test suite with >80% coverage
- API documentation with examples
- Security assessment report
- Performance benchmark results

**Week 6 Objectives:**
- Integration testing
- User experience refinement
- Presentation preparation
- Final bug fixes and optimization

**Week 6 Deliverables:**
- End-to-end integration tests
- Polished user interface
- Presentation materials
- Final codebase with documentation

### 6.4 Phase 4: Presentation and Deployment (Weeks 7-8)

**Week 7 Objectives:**
- Presentation preparation
- Demo scenario scripting
- Production-ready deployment
- Final system validation

**Week 7 Deliverables:**
- Academic presentation slides
- Live demonstration script
- Deployment documentation
- System architecture diagram

**Week 8 Objectives:**
- Final presentation delivery
- Project retrospective
- Future enhancement planning
- Academic evaluation preparation

**Week 8 Deliverables:**
- Successful project presentation
- Peer and instructor evaluation
- Lessons learned documentation
- Future roadmap proposal

---

## 7. Academic Success Criteria

### 7.1 Technical Evaluation Criteria

**Functionality (40% of grade):**
- All MVP features working correctly
- Proper error handling and edge cases
- Integration between all system components
- Real-time fraud detection capabilities

**Code Quality (25% of grade):**
- Well-structured, readable code
- Proper commenting and documentation
- Following JavaScript best practices
- Appropriate use of design patterns

**Innovation and Complexity (20% of grade):**
- Understanding of fraud detection concepts
- Creative integration approaches
- Problem-solving methodology
- Technical depth and sophistication

**Testing and Quality Assurance (15% of grade):**
- Comprehensive test coverage
- Various testing methodologies
- Performance and security considerations
- Documentation quality

### 7.2 Academic Learning Objectives

**Technical Skills Demonstrated:**
- Modern JavaScript development (ES6+, async/await)
- RESTful API design and implementation
- External API integration patterns
- Containerization with Docker
- Database design and management
- Frontend-backend communication

**Security Concepts Mastered:**
- Threat modeling and risk assessment
- IP reputation and geolocation analysis
- Device fingerprinting techniques
- Fraud detection methodologies
- Privacy and compliance considerations

**Software Engineering Practices:**
- Version control with Git
- Code review processes
- Testing strategies (unit, integration)
- Documentation standards
- Deployment automation

### 7.3 Presentation Requirements

**Technical Demonstration (15 minutes):**
- Live system demonstration
- Key feature walkthrough
- Integration scenario presentation
- Q&A session with technical questions

**Architecture Presentation (10 minutes):**
- System design explanation
- Technology choices justification
- Security considerations discussion
- Scalability and future enhancements

**Team Reflection (5 minutes):**
- Development process retrospective
- Challenges faced and solutions
- Individual contribution highlights
- Lessons learned and future applications

---

## 8. Risk Management and Contingency Planning

### 8.1 Technical Risks

**External API Dependency Risk:**
- **Risk:** ProxyCheck.io API downtime or rate limits
- **Mitigation:** Implement caching, fallback responses, and circuit breaker patterns
- **Contingency:** Use mock data for demonstration if API unavailable

**Browser Compatibility Risk:**
- **Risk:** Fingerprinting features may not work in all browsers
- **Mitigation:** Feature detection and graceful degradation
- **Contingency:** Focus on modern browsers (Chrome, Firefox, Safari, Edge)

**Performance Risk:**
- **Risk:** Slow response times affecting user experience
- **Mitigation:** Asynchronous processing, caching strategies, and timeout handling
- **Contingency:** Optimize for demonstration scenarios rather than production scale

### 8.2 Academic Timeline Risks

**Development Velocity Risk:**
- **Risk:** Features taking longer than estimated to implement
- **Mitigation:** Agile development with weekly sprints and scope adjustment
- **Contingency:** Prioritize core features, defer advanced features to future versions

**Team Coordination Risk:**
- **Risk:** Communication gaps affecting integration between components
- **Mitigation:** Daily standups, shared documentation, and clear interface definitions
- **Contingency:** Implement mock interfaces to allow parallel development

**Technology Learning Curve Risk:**
- **Risk:** Unfamiliar technologies slowing development progress
- **Mitigation:** Early prototyping, pair programming, and knowledge sharing sessions
- **Contingency:** Simplify technology stack if necessary while maintaining core functionality

### 8.3 Presentation Risks

**Live Demo Risk:**
- **Risk:** Technical issues during presentation
- **Mitigation:** Rehearse demonstrations, prepare backup scenarios, record demo videos
- **Contingency:** Use recorded demonstrations if live demo fails

**Q&A Preparation Risk:**
- **Risk:** Inability to answer technical questions during evaluation
- **Mitigation:** Create comprehensive FAQ document, practice technical explanations
- **Contingency:** Acknowledge limitations honestly and explain learning process

---

## 9. Future Enhancement Roadmap

### 9.1 Post-MVP Academic Extensions

**Advanced Risk Analysis:**
- Machine learning integration with TensorFlow.js
- Behavioral biometrics analysis
- Real-time anomaly detection
- Graph-based fraud ring detection

**Enhanced Security Features:**
- Multi-factor authentication integration
- Passwordless authentication with WebAuthn
- Advanced CAPTCHA systems
- Blockchain-based identity verification

**Scalability Improvements:**
- Microservices architecture
- Redis caching layer
- Load balancing strategies
- Database optimization

### 9.2 Commercial Development Path

**Enterprise Features:**
- Admin dashboard and analytics
- Real-time monitoring and alerting
- API rate limiting and quotas
- White-label customization options

**Integration Ecosystem:**
- WordPress plugin development
- Shopify app store listing
- REST API for third-party integrations
- Webhook system for real-time notifications

**Compliance and Certification:**
- SOC 2 Type II compliance
- ISO 27001 certification preparation
- GDPR compliance enhancements
- Industry-specific compliance modules

---

## 10. Resources and References

### 10.1 Technical Documentation

**Essential Reading:**
- ProxyCheck.io API Documentation: https://proxycheck.io/api/
- FingerprintJS Documentation: https://github.com/fingerprintjs/fingerprintjs
- Express.js Guide: https://expressjs.com/en/guide/
- React Documentation: https://react.dev/
- Docker Compose Reference: https://docs.docker.com/compose/

**Security Resources:**
- OWASP Fraud Prevention Guide
- NIST Cybersecurity Framework
- SANS Security Guidelines
- Brazilian LGPD Compliance Guide

### 10.2 Learning Materials

**Online Courses:**
- "Web Security Fundamentals" - edX/MITx
- "JavaScript Algorithms and Data Structures" - freeCodeCamp
- "Docker for Developers" - Docker Official Training
- "API Design Best Practices" - Postman Academy

**Academic Papers:**
- "Device Fingerprinting for Web Authentication" - IEEE Security & Privacy
- "IP Geolocation and Fraud Detection" - ACM Digital Library
- "Machine Learning for Cybersecurity" - Springer Cybersecurity Series

### 10.3 Tools and Utilities

**Development Tools:**
- Visual Studio Code with relevant extensions
- Postman for API testing
- Git with GitHub/GitLab integration
- Docker Desktop for containerization

**Monitoring and Analytics:**
- Google Analytics for usage tracking
- New Relic APM for performance monitoring
- Sentry for error tracking
- LogRocket for session replay

---

## 11. Conclusion

This MVP development plan provides a structured, academically-appropriate approach to building a functional fraud detection system. The plan balances educational value with practical application, ensuring students gain valuable experience in modern web security, API integration, and system architecture.

The simplified scope allows for successful completion within academic constraints while maintaining the core concepts and real-world applicability that make this project valuable for both learning and portfolio purposes.

By following this plan, the Grupo idRock team will deliver a comprehensive demonstration of fraud detection principles, modern development practices, and security implementation that showcases both technical competence and understanding of cybersecurity fundamentals.

---

**Document Version:** 1.0 MVP  
**Created:** January 15, 2025  
**Academic Year:** 2025  
**Course:** Defesa Cibernética (2TDCOB) - FIAP  
**Team:** Grupo idRock

---

*This MVP development plan is specifically designed for academic implementation and demonstration. All complexity levels and timelines are calibrated for college-level coursework while maintaining professional development practices and real-world applicability.*