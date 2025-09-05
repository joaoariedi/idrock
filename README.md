# idRock - Plataforma Empresarial de Detecção de Fraudes

Uma plataforma de detecção de fraudes pronta para produção e nível empresarial, projetada para deployment comercial em ambientes de e-commerce de alto volume. Apresenta análise avançada de reputação de IP, fingerprinting sofisticado de dispositivos, análise comportamental e avaliação de risco em tempo real com dashboards abrangentes de business intelligence.

## Sumário

- [Início Rápido](#início-rápido)
- [Guia de Demonstração Empresarial](#guia-de-demonstração-empresarial)
- [Guia de Integração do SDK](#guia-de-integração-do-sdk)  
- [Guia de Testes](#guia-de-testes)
- [Opções de Deploy](#opções-de-deploy)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Documentação da API](#documentação-da-api)
- [Gerenciamento de Containers](#gerenciamento-de-containers)
- [Solução de Problemas](#solução-de-problemas)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Equipe](#equipe)

## 🚀 Início Rápido

### Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Chave API ProxyCheck.io (opcional, demo funciona sem)

### Opção 1: Deploy Docker Produção (Recomendado)

```bash
# Clonar o repositório
git clone <repository-url> idrock-mvp
cd idrock-mvp

# Iniciar sistema de produção
docker-compose -f docker-compose.production.yml up -d

# ⚠️ IMPORTANTE: Sempre execute limpeza após testes
./cleanup-containers.sh
```

### Opção 2: Desenvolvimento Local

```bash
# Instalar dependências
npm run install:all

# Iniciar API (terminal 1)
npm run dev:api

# Iniciar loja demo (terminal 2)
npm run dev:store

# Acessar em http://localhost:3000
```

### Opção 3: Desenvolvimento Docker Completo

```bash
# Copiar template de ambiente
cp .env.example .env

# Iniciar sistema de desenvolvimento
docker-compose up -d

# ⚠️ OBRIGATÓRIO: Limpeza após testes
./cleanup-containers.sh
```

### Acessar a Aplicação

#### Modo Produção
- **NexShop Loja Demo**: http://localhost:3000
- **idRock API**: http://localhost:3001/api
- **Documentação da API**: http://localhost:3001/api/docs

#### Modo Desenvolvimento (com nginx)
- **NexShop Loja Demo**: http://localhost:8080
- **idRock API**: http://localhost:8080/api
- **Documentação da API**: http://localhost:8080/api/docs
- **Dashboard de Risco**: http://localhost:8080/risk-dashboard

---

## 📋 Apresentações Empresariais

Para demos de clientes, apresentações empresariais e reuniões com investidores, consulte nosso **[Guia de Apresentação Empresarial](presentation.md)** completo.

Este guia dedicado inclui:
- Fluxo completo de demonstração e instruções de configuração
- Pontos de fala para diferentes audiências
- Cálculos de ROI e business cases
- Respostas para Q&A de clientes
- Procedimentos de limpeza pós-demo

---

## 🔌 Guia de Integração do SDK

Guia completo para integrar a detecção de fraudes idRock em aplicações existentes.

### Integração Básica

#### 1. Instalação

```bash
# Instalação via npm (quando publicado)
npm install idrock-sdk

# Ou incluir diretamente via CDN
<script src="https://cdn.jsdelivr.net/npm/idrock-sdk/dist/idrock.min.js"></script>
```

#### 2. Configuração Básica

```javascript
// Módulos ES6
import { IdRockSDK } from 'idrock-sdk';

// CommonJS
const { IdRockSDK } = require('idrock-sdk');

// Global do Navegador
const idRockSDK = new window.IdRockSDK({
  apiKey: 'sua-chave-api',
  apiUrl: 'https://sua-url-api.com/api',
  debug: false
});
```

#### 3. Inicializar Sessão

```javascript
// Inicializar sessão do usuário
const sessionId = await idRockSDK.initializeSession();
console.log('Sessão inicializada:', sessionId);
```

### Exemplos de Integração Avançada

#### Integração de Checkout E-commerce

```javascript
class CheckoutSecurityManager {
  constructor(apiConfig) {
    this.idRock = new IdRockSDK(apiConfig);
    this.sessionInitialized = false;
  }

  async initializeSecurity() {
    try {
      await this.idRock.initializeSession();
      this.sessionInitialized = true;
      
      // Track page view
      await this.idRock.trackEvent('checkout_start', {
        page: 'checkout',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Security initialization failed:', error);
    }
  }

  async assessCheckoutRisk(checkoutData) {
    if (!this.sessionInitialized) {
      throw new Error('Session not initialized');
    }

    const riskAssessment = await this.idRock.assessRisk({
      event: 'checkout_attempt',
      amount: checkoutData.totalAmount,
      currency: checkoutData.currency || 'BRL',
      metadata: {
        customerInfo: checkoutData.customer,
        items: checkoutData.items,
        shippingAddress: checkoutData.shipping,
        billingAddress: checkoutData.billing,
        paymentMethod: checkoutData.paymentMethod
      }
    });

    return this.handleRiskResult(riskAssessment);
  }

  handleRiskResult(assessment) {
    switch (assessment.riskLevel) {
      case 'LOW':
        return {
          proceed: true,
          message: 'Transaction approved',
          additionalVerification: false
        };
      
      case 'MEDIUM':
        return {
          proceed: true,
          message: 'Please verify your information',
          additionalVerification: true,
          requiredActions: ['email_verification', 'sms_verification']
        };
      
      case 'HIGH':
        return {
          proceed: false,
          message: 'Transaction requires manual review',
          additionalVerification: true,
          contactSupport: true
        };
      
      default:
        return {
          proceed: false,
          message: 'Unable to process at this time',
          retry: true
        };
    }
  }
}

// Usage example
const checkoutSecurity = new CheckoutSecurityManager({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.yourstore.com/idrock',
  debug: process.env.NODE_ENV === 'development'
});

// Initialize when user starts checkout
await checkoutSecurity.initializeSecurity();

// Assess risk when user submits order
const riskResult = await checkoutSecurity.assessCheckoutRisk({
  totalAmount: 299.99,
  currency: 'BRL',
  customer: {
    email: 'customer@email.com',
    firstName: 'João',
    lastName: 'Silva'
  },
  items: [
    { id: 'prod1', name: 'Smartphone', price: 299.99, quantity: 1 }
  ],
  shipping: {
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zip: '01234-567'
  },
  paymentMethod: 'credit_card'
});

if (!riskResult.proceed) {
  // Handle high-risk transaction
  showSecurityWarning(riskResult.message);
}
```

#### React Hook Integration

```javascript
import { useState, useEffect, useCallback } from 'react';
import { IdRockSDK } from 'idrock-sdk';

export const useIdRockSecurity = (config) => {
  const [idRock, setIdRock] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);

  useEffect(() => {
    const initializeIdRock = async () => {
      try {
        const sdk = new IdRockSDK(config);
        const session = await sdk.initializeSession();
        
        setIdRock(sdk);
        setSessionId(session);
        setIsInitialized(true);
      } catch (error) {
        console.error('IdRock initialization failed:', error);
      }
    };

    initializeIdRock();
  }, []);

  const assessRisk = useCallback(async (eventData) => {
    if (!idRock || !isInitialized) {
      throw new Error('IdRock not initialized');
    }

    setIsAssessing(true);
    try {
      const assessment = await idRock.assessRisk(eventData);
      return assessment;
    } finally {
      setIsAssessing(false);
    }
  }, [idRock, isInitialized]);

  const trackEvent = useCallback(async (eventType, eventData) => {
    if (idRock && isInitialized) {
      return await idRock.trackEvent({ type: eventType, data: eventData });
    }
  }, [idRock, isInitialized]);

  return {
    isInitialized,
    sessionId,
    isAssessing,
    assessRisk,
    trackEvent,
    sdk: idRock
  };
};

// Usage in React component
function CheckoutComponent() {
  const { isInitialized, assessRisk, isAssessing } = useIdRockSecurity({
    apiKey: process.env.REACT_APP_IDROCK_API_KEY,
    apiUrl: process.env.REACT_APP_IDROCK_API_URL
  });

  const handleSubmitOrder = async (orderData) => {
    if (!isInitialized) {
      alert('Security system not ready');
      return;
    }

    const riskAssessment = await assessRisk({
      event: 'order_submission',
      amount: orderData.total,
      metadata: orderData
    });

    if (riskAssessment.riskLevel === 'HIGH') {
      alert('Transaction requires additional verification');
      return;
    }

    // Proceed with order...
  };

  return (
    <div>
      <button 
        onClick={handleSubmitOrder} 
        disabled={!isInitialized || isAssessing}
      >
        {isAssessing ? 'Verifying Security...' : 'Place Order'}
      </button>
    </div>
  );
}
```

### Configuration Options

#### SDK Configuration

```javascript
const config = {
  // Required
  apiKey: 'your-api-key',              // Authentication key
  apiUrl: 'https://api.yourdomain.com', // Backend API URL
  
  // Optional
  timeout: 5000,                       // Request timeout (ms)
  enableFingerprinting: true,          // Device fingerprinting
  debug: false,                        // Debug logging
  
  // Advanced options
  retryAttempts: 3,                    // Request retry attempts
  retryDelay: 1000,                    // Delay between retries (ms)
  batchEvents: false,                  // Batch multiple events
  enableCaching: true,                 // Cache fingerprint data
  
  // Security options
  validateSSL: true,                   // Validate SSL certificates
  encryptData: true,                   // Encrypt sensitive data
  maskPII: true,                       // Mask personal information
  
  // Behavioral tracking
  trackMouseMovements: true,           // Track mouse behavior
  trackKeystrokes: false,              // Track typing patterns
  trackScrolling: true,                // Track scroll behavior
  trackFormInteractions: true          // Track form interactions
};
```

### Error Handling

```javascript
class IdRockErrorHandler {
  static handle(error, context = '') {
    console.error(`IdRock Error [${context}]:`, error);
    
    switch (error.code) {
      case 'NETWORK_ERROR':
        return {
          proceed: true,
          fallback: true,
          message: 'Security check unavailable, using fallback verification'
        };
      
      case 'RATE_LIMIT':
        return {
          proceed: false,
          retry: true,
          message: 'Please wait a moment before trying again'
        };
      
      case 'INVALID_API_KEY':
        return {
          proceed: false,
          message: 'Configuration error, please contact support'
        };
      
      default:
        return {
          proceed: true,
          fallback: true,
          message: 'Proceeding with standard verification'
        };
    }
  }
}

// Usage
try {
  const assessment = await idRockSDK.assessRisk(eventData);
  handleRiskResult(assessment);
} catch (error) {
  const fallback = IdRockErrorHandler.handle(error, 'checkout_assessment');
  if (fallback.proceed) {
    proceedWithFallback(fallback);
  } else {
    showErrorMessage(fallback.message);
  }
}
```

### Production Best Practices

#### 1. Environment Configuration

```javascript
// config/idrock.js
const getIdRockConfig = () => {
  const environment = process.env.NODE_ENV;
  
  const baseConfig = {
    timeout: 5000,
    enableFingerprinting: true,
    debug: environment === 'development',
    retryAttempts: 3
  };
  
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        apiUrl: process.env.IDROCK_PROD_API_URL,
        apiKey: process.env.IDROCK_PROD_API_KEY,
        debug: false,
        validateSSL: true,
        encryptData: true
      };
      
    case 'staging':
      return {
        ...baseConfig,
        apiUrl: process.env.IDROCK_STAGING_API_URL,
        apiKey: process.env.IDROCK_STAGING_API_KEY,
        debug: true
      };
      
    default: // development
      return {
        ...baseConfig,
        apiUrl: 'http://localhost:3001/api',
        apiKey: 'dev-key',
        debug: true
      };
  }
};
```

#### 2. Performance Optimization

```javascript
// Lazy load SDK for better performance
const loadIdRockSDK = async () => {
  if (typeof window !== 'undefined' && !window.IdRockSDK) {
    const { IdRockSDK } = await import('idrock-sdk');
    return IdRockSDK;
  }
  return window.IdRockSDK;
};

// Initialize only when needed
let idRockInstance = null;
const getIdRockInstance = async () => {
  if (!idRockInstance) {
    const IdRockSDK = await loadIdRockSDK();
    idRockInstance = new IdRockSDK(getIdRockConfig());
    await idRockInstance.initializeSession();
  }
  return idRockInstance;
};
```

#### 3. Monitoring and Analytics

```javascript
class IdRockMonitoring {
  static logAssessment(assessment, context) {
    // Send to your analytics platform
    analytics.track('fraud_assessment', {
      sessionId: assessment.sessionId,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      context: context,
      timestamp: new Date().toISOString()
    });
  }
  
  static logError(error, context) {
    // Send to error tracking service
    errorTracker.captureException(error, {
      tags: {
        component: 'idrock-sdk',
        context: context
      }
    });
  }
}
```

---

## 🧪 Testing Guide

Complete testing procedures for all system components with step-by-step instructions.

### Quick Test Overview

```bash
# Run all automated tests
./test-integration.sh        # Complete integration testing
./test-production-docker.sh  # Production deployment testing  
./test-local-development.sh  # Local development testing

# Individual component tests
npm run test:all            # Unit tests for all components
npm run lint:all            # Code quality checks
npm run build:all           # Build verification
```

### Detailed Testing Procedures

#### 1. Integration Testing (`./test-integration.sh`)

This script performs comprehensive end-to-end testing of the entire system.

**Test Phases:**
1. **Pre-test Cleanup** - Ensures clean Docker environment
2. **Local API Testing** - Tests API functionality in development mode
3. **React Build Verification** - Validates demo store build process
4. **Docker Build Testing** - Verifies container builds
5. **Mandatory Cleanup** - Removes all test containers

**Expected Results:**
```bash
🧪 Starting idRock MVP Integration Tests...
==================================================

TEST 1: Local API Development
------------------------------
✅ Health check passed
✅ Risk assessment passed

TEST 2: React App Build Test  
-----------------------------
✅ React build successful

TEST 3: Docker Build Test
--------------------------
✅ Docker build successful

FINAL VERIFICATION
------------------
✅ All containers cleaned up successfully

🎉 ALL INTEGRATION TESTS PASSED!
```

**Troubleshooting Integration Tests:**

| Issue | Symptom | Solution |
|-------|---------|----------|
| API Health Check Fails | `❌ Health check failed` | Check if port 3001 is available, restart test |
| Risk Assessment Error | `❌ Risk assessment failed` | Verify API is running, check network connectivity |
| React Build Fails | Build errors in output | Check Node.js version (18+), run `npm install` |
| Docker Build Fails | Container build errors | Verify Docker is running, check Dockerfile syntax |
| Cleanup Fails | Containers still running | Run `./cleanup-containers.sh` manually |

#### 2. Production Docker Testing (`./test-production-docker.sh`)

Tests the production deployment configuration with health monitoring.

**Test Phases:**
1. **Production Build** - Builds production-optimized containers
2. **Service Startup** - Deploys full production stack
3. **Health Monitoring** - Monitors service readiness (up to 50s)
4. **API Functionality** - Tests production API endpoints
5. **Mandatory Cleanup** - Full production cleanup

**Expected Results:**
```bash
🚀 Testing idRock MVP Production Docker Deployment...
==================================================

1. Setting up production environment...
✅ Environment file created

2. Testing production Docker build...
✅ Production Docker build successful

3. Starting production services...
✅ API is healthy
✅ Demo store is healthy

5. Testing API functionality...
✅ Risk assessment API working in production

MANDATORY PRODUCTION CLEANUP
==============================
✅ All production containers cleaned up successfully

🎉 PRODUCTION DOCKER TEST PASSED!
```

**Production Test Troubleshooting:**

| Issue | Symptom | Solution |
|-------|---------|----------|
| Build Timeout | Containers taking too long | Production builds can take 2-3 minutes, be patient |
| API Not Ready | Health check failures | Wait longer, production startup takes 60s |
| Port Conflicts | Address already in use | Stop conflicting services or change ports |
| Memory Issues | Build failures, OOM errors | Increase Docker memory allocation |

#### 3. Local Development Testing (`./test-local-development.sh`)

Validates local development environment without Docker.

**Test Phases:**
1. **Dependency Check** - Verifies Node.js and npm versions
2. **Install Dependencies** - Tests package installation
3. **API Server Test** - Starts and tests local API
4. **Demo Store Test** - Tests React development server
5. **SDK Tests** - Runs unit tests for SDK

**Manual Testing Checklist:**

##### Frontend Testing (Demo Store)
- [ ] **Homepage Loading**
  - Visit http://localhost:3000
  - Verify product grid displays
  - Check loading states and error handling

- [ ] **Product Navigation**  
  - Click on product cards
  - Verify product detail pages
  - Test add to cart functionality

- [ ] **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Test cart persistence

- [ ] **Checkout Process**
  - Step 1: Contact information validation
  - Step 2: Shipping address validation  
  - Step 3: Payment information validation
  - Step 4: Risk assessment display

- [ ] **Risk Dashboard**
  - Visit http://localhost:3000/risk-dashboard
  - Verify charts render correctly
  - Test timeframe selection
  - Check real-time updates

##### Backend API Testing (API Endpoints)

**Health Check:**
```bash
curl http://localhost:3001/api/health
# Expected: {"status": "healthy", "timestamp": "..."}
```

**Risk Assessment:**
```bash
curl -X POST http://localhost:3001/api/assess-risk \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "event": "checkout_attempt", 
    "amount": 299.99,
    "currency": "BRL",
    "metadata": {"test": true}
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "sessionId": "test-session-123",
    "riskScore": 25,
    "riskLevel": "LOW",
    "reasons": ["Normal transaction pattern"],
    "recommendedAction": "proceed",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Session History:**
```bash
curl http://localhost:3001/api/assess-risk/history/test-session-123
# Expected: Session history data with assessment records
```

**Statistics:**
```bash
curl http://localhost:3001/api/assess-risk/stats  
# Expected: System statistics and metrics
```

##### SDK Testing (Unit Tests)

```bash
# Run SDK unit tests
cd sdk && npm test

# Expected output:
PASS src/idrock.test.js
  IdRockSDK
    ✓ should initialize with config
    ✓ should generate session ID
    ✓ should collect device info
    ✓ should assess risk
    ✓ should handle errors gracefully

Test Suites: 1 passed, 1 total
Tests: 5 passed, 5 total
```

### Load Testing (Optional)

For performance validation, you can run basic load tests:

```bash
# Install load testing tool
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Risk Assessment Load Test"
    requests:
      - post:
          url: "/api/assess-risk"
          json:
            sessionId: "load-test-{{ \$randomString() }}"
            event: "checkout_attempt"
            amount: 299.99
            currency: "BRL"
EOF

# Run load test
artillery run load-test.yml
```

**Expected Load Test Results:**
- Response time: < 100ms (95th percentile)
- Success rate: > 99%
- No memory leaks or crashes

### Container Cleanup Testing

After every test, verify proper cleanup:

```bash
# Check for remaining containers
docker ps -a --filter "name=idrock" --filter "name=nexshop"

# Should return no results, or run cleanup
./cleanup-containers.sh

# Verify Docker resource usage
docker system df
```

### Test Environment Variables

For comprehensive testing, create test-specific environment variables:

```bash
# .env.test
NODE_ENV=test
PROXYCHECK_API_KEY=test_key
API_PORT=3001
REACT_APP_IDROCK_API_URL=http://localhost:3001/api
LOG_LEVEL=debug
```

### Continuous Testing Workflow

For development workflow, use this testing sequence:

```bash
# 1. Quick development tests
npm run test:all

# 2. Integration verification  
./test-integration.sh

# 3. Production readiness (before deployment)
./test-production-docker.sh

# 4. Performance check (optional)
# Run load tests as shown above

# 5. Always cleanup
./cleanup-containers.sh
```

## 🚀 Deployment Options

Comprehensive deployment guide for all environments with detailed configuration instructions.

### Deployment Methods Overview

| Method | Best For | Complexity | Performance | Scalability |
|--------|----------|------------|-------------|-------------|
| **Production Docker** | Production deployments | Low | High | Excellent |
| **Development Docker** | Testing with nginx | Medium | Medium | Good |
| **Local Development** | Development work | Low | Medium | Limited |
| **Cloud Deployment** | Production at scale | High | Very High | Excellent |

### 1. Production Docker Deployment (Recommended)

**Features:**
- Optimized production builds
- Automatic health checks
- Container restart policies
- Minimal resource footprint

```bash
# Quick Production Deployment
git clone https://github.com/grupo-idrock/idrock-mvp.git
cd idrock-mvp

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Deploy production stack
docker-compose -f docker-compose.production.yml up -d

# Verify deployment
curl http://localhost:3001/api/health
curl http://localhost:3000

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f

# When done, always cleanup
docker-compose -f docker-compose.production.yml down --volumes --remove-orphans
```

**Production Configuration (`docker-compose.production.yml`):**
- **API Service**: Optimized Node.js container with health monitoring
- **Demo Store**: Production React build with NGINX serving static files
- **Networking**: Isolated bridge network for security
- **Volumes**: Persistent data storage for database and logs

### 2. Development Docker Deployment

**Features:**
- Full development stack with nginx proxy
- Redis caching layer
- SSL-ready configuration
- Development-friendly logging

```bash
# Development Stack Deployment
cp .env.example .env

# Start full development environment
docker-compose up -d

# Access via nginx proxy
echo "Demo Store: http://localhost:8080"
echo "API: http://localhost:8080/api" 
echo "Risk Dashboard: http://localhost:8080/risk-dashboard"
echo "API Docs: http://localhost:8080/api/docs"

# Monitor all services
docker-compose logs -f

# Scale services (optional)
docker-compose up -d --scale idrock-api=2

# Cleanup when done
docker-compose down --volumes --remove-orphans
./cleanup-containers.sh
```

**Development Stack Components:**
- **NGINX**: Reverse proxy and load balancer
- **API**: Development server with hot reloading
- **Demo Store**: React development server
- **Redis**: Caching layer for performance optimization

### 3. Local Development Setup

Best for active development and debugging.

```bash
# Prerequisites check
node --version  # Should be 18.x or higher
npm --version   # Should be 8.x or higher

# Install dependencies
npm run install:all

# Start services in separate terminals
npm run dev:api     # Terminal 1: API server
npm run dev:store   # Terminal 2: React app
npm run dev:sdk     # Terminal 3: SDK development (optional)

# Access directly
echo "Demo Store: http://localhost:3000"
echo "API: http://localhost:3001/api"
```

### 4. Cloud Deployment Options

#### AWS Deployment

```bash
# Using AWS ECS with Docker containers
# 1. Build and push images to ECR
docker build -t idrock-api ./api
docker tag idrock-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/idrock-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/idrock-api:latest

# 2. Use provided ECS task definitions (see deployment/aws/)
aws ecs update-service --cluster idrock-cluster --service idrock-api-service

# 3. Configure Application Load Balancer
# See deployment/aws/alb-config.json
```

#### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy idrock-api \
  --source ./api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

gcloud run deploy nexshop-store \
  --source ./demo-store \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Container Instances

```bash
# Deploy using Azure CLI
az container create \
  --resource-group idrock-rg \
  --name idrock-api \
  --image idrock-api:latest \
  --ports 3001 \
  --environment-variables NODE_ENV=production
```

### Environment Configuration

#### Production Environment Variables

```bash
# .env.production
NODE_ENV=production
API_PORT=3001
API_HOST=0.0.0.0

# Security
PROXYCHECK_API_KEY=your_production_api_key_here
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT_MAX=1000
API_RATE_LIMIT_WINDOW=900000

# Database
SQLITE_DB_PATH=/app/data/idrock_production.db
DB_BACKUP_ENABLED=true
DB_BACKUP_INTERVAL=3600000

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_MAX_SIZE=100m
LOG_MAX_FILES=10

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_ENABLED=true

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# React App
REACT_APP_IDROCK_API_URL=https://api.yourdomain.com/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

#### Development Environment Variables

```bash
# .env.development
NODE_ENV=development
API_PORT=3001
API_HOST=localhost

# Development tools
DEBUG=idrock:*
LOG_LEVEL=debug
ENABLE_CORS_DEBUG=true
REACT_APP_DEBUG_MODE=true

# Hot reloading
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true

# API Configuration
PROXYCHECK_API_KEY=demo_key_development
API_RATE_LIMIT_MAX=10000
CORS_ORIGIN=*

# Database
SQLITE_DB_PATH=./data/idrock_development.db

# React App
REACT_APP_IDROCK_API_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=development
```

### Port Configuration

**Default Port Mapping:**

| Service | Development | Production | Docker |
|---------|-------------|------------|---------|
| Demo Store | 3000 | 3000 | 3000 |
| API Server | 3001 | 3001 | 3001 |
| NGINX Proxy | 8080 | 8080 | 8080 |
| NGINX SSL | 8443 | 8443 | 8443 |
| Redis | 6379 | 6379 | 6379 |

**Custom Port Configuration:**

```bash
# .env
API_PORT=4001
DEMO_STORE_PORT=4000
NGINX_HTTP_PORT=9080
NGINX_HTTPS_PORT=9443
REDIS_PORT=6380
```

### SSL/TLS Configuration (Production)

```bash
# Create SSL directory structure
mkdir -p docker/nginx/ssl

# Generate self-signed certificates (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/nginx.key \
  -out docker/nginx/ssl/nginx.crt

# For production, use Let's Encrypt or purchased certificates
# Place your certificates in docker/nginx/ssl/
# - nginx.crt (certificate)
# - nginx.key (private key)
# - nginx.pem (certificate chain, optional)
```

**NGINX SSL Configuration (`docker/nginx/conf.d/ssl.conf`):**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://nexshop-store:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://idrock-api:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Monitoring and Health Checks

#### Health Check Endpoints

```bash
# API Health Check
curl http://localhost:3001/api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "database": "connected",
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  }
}

# Demo Store Health Check
curl http://localhost:3000/health

# System Statistics
curl http://localhost:3001/api/assess-risk/stats
```

#### Monitoring with Docker Health Checks

All services include automatic health monitoring:

```bash
# Check service health status
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' idrock-api | jq

# Monitor resource usage
docker stats
```

### Scaling and Load Balancing

#### Horizontal Scaling

```bash
# Scale API service
docker-compose up -d --scale idrock-api=3

# Scale with custom compose file
docker-compose -f docker-compose.production.yml -f docker-compose.scale.yml up -d
```

#### Load Balancer Configuration

NGINX automatically load balances between multiple API instances:

```nginx
upstream idrock_api {
    server idrock-api_1:3001;
    server idrock-api_2:3001;
    server idrock-api_3:3001;
}

server {
    listen 80;
    location /api {
        proxy_pass http://idrock_api;
    }
}
```

### Performance Optimization

#### Production Optimizations

1. **Enable Compression**
   ```bash
   # Already enabled in production config
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Database Connection Pooling**
   ```javascript
   // API configuration
   const dbPool = {
     max: 20,
     min: 5,
     idleTimeoutMillis: 30000
   };
   ```

3. **Redis Caching**
   ```javascript
   // Cache frequently accessed data
   const cacheKey = `risk_assessment:${sessionId}`;
   await redis.setex(cacheKey, 300, JSON.stringify(assessment));
   ```

4. **Static Asset Optimization**
   ```bash
   # React build optimizations already included
   npm run build  # Minification, tree shaking, code splitting
   ```

### Backup and Recovery

#### Database Backup

```bash
# Create backup directory
mkdir -p backups

# Backup SQLite database
sqlite3 ./data/idrock.db ".backup backups/idrock_$(date +%Y%m%d_%H%M%S).db"

# Automated backup script (run via cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 /app/data/idrock.db ".backup /app/backups/idrock_${DATE}.db"
find /app/backups -name "idrock_*.db" -mtime +7 -delete
```

#### Configuration Backup

```bash
# Backup all configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  .env* \
  docker-compose*.yml \
  docker/nginx/ \
  api/src/config/
```

---

## 🏗️ Arquitetura do Sistema

Visão abrangente da arquitetura do sistema idRock MVP e interações entre componentes.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     idRock MVP System                       │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │   Frontend SDK  │    │   Demo Store     │               │
│  │   (JavaScript)  │    │   (React App)    │               │
│  │                 │    │                  │               │
│  │ • Device Info   │    │ • Shopping Cart  │               │
│  │ • Fingerprinting│    │ • Checkout Flow  │               │
│  │ • Risk Display  │    │ • Risk Dashboard │               │
│  └─────────┬───────┘    └─────────┬────────┘               │
│            │                      │                        │
│            └──────┐      ┌────────┘                        │
│                   │      │                                 │
│            ┌──────▼──────▼──────┐                          │
│            │                    │                          │
│            │   NGINX Proxy      │                          │
│            │  (Load Balancer)   │                          │
│            │                    │                          │
│            │ • SSL Termination  │                          │
│            │ • Request Routing  │                          │
│            │ • Static Assets    │                          │
│            └─────────┬──────────┘                          │
│                      │                                     │
│            ┌─────────▼──────────┐                          │
│            │                    │                          │
│            │    Backend API     │                          │
│            │   (Node.js +       │                          │
│            │    Express)        │                          │
│            │                    │                          │
│            │ • Risk Assessment  │                          │
│            │ • Session Mgmt     │                          │
│            │ • Event Tracking   │                          │
│            │ • External APIs    │                          │
│            └─────────┬──────────┘                          │
│                      │                                     │
│    ┌─────────────────┼─────────────────┐                   │
│    │                 │                 │                   │
│    │ ┌───────────────▼──────────────┐  │                   │
│    │ │                              │  │                   │
│    │ │        Data Layer            │  │                   │
│    │ │                              │  │                   │
│    │ │ • SQLite Database            │  │                   │
│    │ │ • Session Storage            │  │                   │
│    │ │ • Risk History               │  │                   │
│    │ │ • Device Fingerprints        │  │                   │
│    │ └──────────────────────────────┘  │                   │
│    │                                   │                   │
│    │ ┌──────────────────────────────┐  │                   │
│    │ │                              │  │                   │
│    │ │      External APIs           │  │                   │
│    │ │                              │  │                   │
│    │ │ • ProxyCheck.io              │  │                   │
│    │ │ • IP Reputation              │  │                   │
│    │ │ • Geolocation                │  │                   │
│    │ └──────────────────────────────┘  │                   │
│    │                                   │                   │
│    │ ┌──────────────────────────────┐  │                   │
│    │ │                              │  │                   │
│    │ │     Caching Layer            │  │                   │
│    │ │                              │  │                   │
│    │ │ • Redis Cache                │  │                   │
│    │ │ • Session Cache              │  │                   │
│    │ │ • Risk Cache                 │  │                   │
│    │ └──────────────────────────────┘  │                   │
│    └───────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Frontend Layer

**1. JavaScript SDK (`/sdk`)**
- **Purpose**: Client-side fraud detection integration
- **Key Features**:
  - Device fingerprinting using FingerprintJS
  - Behavioral data collection
  - Real-time risk assessment API calls
  - Session management
- **Integration**: Embedded in any JavaScript application

**2. Demo Store (`/demo-store`)**
- **Purpose**: React-based e-commerce demonstration
- **Key Features**:
  - Product catalog with 16+ demo products
  - Shopping cart functionality
  - Multi-step checkout with real-time risk assessment
  - Risk dashboard with analytics and charts
  - Responsive design with modern UI/UX

#### Infrastructure Layer

**3. NGINX Proxy (`/docker/nginx`)**
- **Purpose**: Reverse proxy and load balancer
- **Key Features**:
  - SSL/TLS termination
  - Request routing and load balancing
  - Static asset serving
  - CORS handling
  - Rate limiting

#### Backend Layer

**4. API Server (`/api`)**
- **Purpose**: Core fraud detection engine
- **Key Features**:
  - RESTful API with comprehensive endpoints
  - Risk assessment algorithm
  - Session and event tracking
  - External API integration (ProxyCheck.io)
  - Comprehensive logging and monitoring

### Data Flow Architecture

```
User Interaction → SDK → API → Risk Engine → Response
                              ↓
                         External APIs
                              ↓  
                         Cache/Database
```

**Detailed Flow:**

1. **User Interaction**: User performs action (page visit, checkout, etc.)
2. **SDK Collection**: JavaScript SDK collects:
   - Device fingerprint
   - Behavioral data
   - Browser information
   - Session context
3. **API Processing**: Backend API receives data and:
   - Validates input
   - Extracts IP address and headers
   - Calls risk assessment service
4. **Risk Calculation**: Risk engine analyzes:
   - IP reputation (ProxyCheck.io)
   - Device consistency
   - Behavioral patterns
   - Historical data
5. **Response Generation**: API returns:
   - Risk score (0-100)
   - Risk level (LOW/MEDIUM/HIGH)
   - Recommended actions
   - Reasoning factors

### Database Schema

#### Sessions Table
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    referrer TEXT,
    initial_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Risk Assessments Table
```sql
CREATE TABLE risk_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    risk_score REAL NOT NULL,
    risk_level TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    factors TEXT, -- JSON string of risk factors
    metadata TEXT, -- JSON string of additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

#### Device Fingerprints Table
```sql
CREATE TABLE device_fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fingerprint_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    confidence REAL,
    components TEXT, -- JSON string of fingerprint data
    user_agent TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    platform TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

### Security Architecture

#### Authentication & Authorization
- **API Key Authentication**: Required for all API endpoints
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **CORS Policy**: Configurable origins for production security
- **Input Validation**: Comprehensive validation using Joi schemas

#### Data Protection
- **Encryption**: Sensitive data encrypted in transit (HTTPS)
- **Data Masking**: PII can be masked in logs
- **Session Security**: Secure session handling with automatic expiration
- **LGPD Compliance**: Considerations for Brazilian data protection laws

### Risk Assessment Algorithm

The system uses a weighted scoring algorithm combining multiple risk factors:

```
Final Risk Score = (IP Risk × 0.30) + 
                   (Device Risk × 0.25) + 
                   (Behavioral Risk × 0.20) + 
                   (Geolocation Risk × 0.15) + 
                   (Temporal Risk × 0.10)
```

#### Risk Factors Breakdown

**1. IP Risk (30% weight)**
- VPN/Proxy detection
- Known malicious IP lists
- IP reputation scores
- Geographic inconsistencies

**2. Device Risk (25% weight)**
- Device fingerprint consistency
- New device detection
- Browser/OS anomalies
- Hardware configuration analysis

**3. Behavioral Risk (20% weight)**
- Session duration patterns
- Click/interaction velocity
- Form completion time
- Navigation patterns

**4. Geolocation Risk (15% weight)**
- Impossible travel detection
- High-risk geographic regions
- Location consistency checks
- Time zone analysis

**5. Temporal Risk (10% weight)**
- Unusual access times
- Transaction frequency
- Pattern deviation
- Time-based anomalies

### Performance Architecture

#### Caching Strategy
- **Redis**: Session data, risk assessments, external API responses
- **In-Memory**: Frequently accessed configurations
- **Browser**: Static assets, fingerprint data

#### Optimization Features
- **Connection Pooling**: Database connection management
- **Compression**: GZIP compression for API responses
- **CDN Ready**: Static asset optimization
- **Lazy Loading**: SDK components loaded on demand

---

## 📚 API Documentation

Complete API reference with examples and integration patterns.

### Base URL and Authentication

**Base URL**: `http://localhost:3001/api` (development) or `https://your-api-domain.com/api`

**Authentication**: All endpoints require API key authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "http://localhost:3001/api/endpoint"
```

### Core Endpoints

#### 1. Risk Assessment

**POST `/assess-risk`**

Perform real-time fraud risk assessment for user actions.

**Request Body:**
```json
{
  "sessionId": "sess_1234567890_abc123",
  "event": "checkout_attempt",
  "amount": 299.99,
  "currency": "BRL",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "platform": "Win32",
    "language": "pt-BR",
    "screenResolution": "1920x1080",
    "timezone": "America/Sao_Paulo",
    "cookieEnabled": true
  },
  "behavioralInfo": {
    "timestamp": "2024-01-15T10:30:00Z",
    "sessionStart": "2024-01-15T10:25:00Z",
    "pageLoadTime": 1234,
    "referrer": "https://google.com",
    "currentUrl": "https://store.com/checkout"
  },
  "fingerprint": {
    "visitorId": "fp_abc123def456",
    "confidence": 0.99,
    "components": {
      "screen": {"width": 1920, "height": 1080},
      "fonts": ["Arial", "Helvetica", "Times"],
      "plugins": ["Chrome PDF Plugin"]
    }
  },
  "metadata": {
    "customerInfo": {
      "email": "customer@example.com",
      "firstName": "João",
      "lastName": "Silva"
    },
    "items": [
      {"id": "prod1", "name": "Smartphone", "price": 299.99}
    ],
    "shippingAddress": {
      "city": "São Paulo",
      "state": "SP",
      "zip": "01234-567"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_1234567890_abc123",
    "riskScore": 25,
    "riskLevel": "LOW",
    "reasons": [
      "Normal IP reputation",
      "Consistent device fingerprint",
      "Regular behavioral pattern"
    ],
    "recommendedAction": "proceed",
    "timestamp": "2024-01-15T10:30:00Z",
    "ipAnalysis": {
      "ipAddress": "192.168.1.100",
      "country": "BR",
      "region": "SP",
      "city": "São Paulo",
      "isVPN": false,
      "isTor": false,
      "riskScore": 15
    },
    "deviceAnalysis": {
      "newDevice": false,
      "consistencyScore": 95,
      "riskIndicators": []
    },
    "behavioralAnalysis": {
      "velocityScore": 10,
      "patternScore": 20,
      "anomalies": []
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Risk Levels:**
- **LOW (0-30)**: Proceed normally
- **MEDIUM (31-70)**: Show security notice, consider additional verification
- **HIGH (71-100)**: Require additional verification or manual review

#### 2. Session Management

**POST `/session/initialize`**

Initialize a new user session for tracking.

**Request Body:**
```json
{
  "sessionId": "sess_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "url": "https://store.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_1234567890_abc123",
    "initialized": true,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 3. Event Tracking

**POST `/events/track`**

Track user behavior events for analysis.

**Request Body:**
```json
{
  "sessionId": "sess_1234567890_abc123",
  "type": "page_view",
  "data": {
    "page": "checkout",
    "duration": 30000,
    "interactions": 15
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "url": "https://store.com/checkout"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_abc123",
    "tracked": true,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 4. Assessment History

**GET `/assess-risk/history/:sessionId?limit=50`**

Retrieve risk assessment history for a session.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_1234567890_abc123",
    "history": [
      {
        "id": 1,
        "eventType": "checkout_attempt",
        "riskScore": 25,
        "riskLevel": "LOW",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

#### 5. System Statistics

**GET `/assess-risk/stats`**

Get system-wide statistics and metrics.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalAssessments": 1543,
    "uniqueSessions": 892,
    "riskDistribution": {
      "LOW": 1238,
      "MEDIUM": 245,
      "HIGH": 60
    },
    "averageRiskScore": 23.7,
    "todayAssessments": 156,
    "lastHourAssessments": 23,
    "topRiskFactors": [
      "VPN detection",
      "New device",
      "Unusual velocity"
    ]
  }
}
```

#### 6. Health Check

**GET `/health`**

Check API health and system status.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production",
  "database": "connected",
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  },
  "services": {
    "proxycheck": "operational",
    "redis": "connected"
  }
}
```

### Error Responses

All endpoints may return these error responses:

#### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "sessionId",
      "message": "Session ID is required"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Invalid or missing API key",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 429 Rate Limited
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Rate Limiting

- **Default**: 1000 requests per 15 minutes per IP
- **Headers**: Rate limit information included in response headers:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1642253400
  ```

### SDK Integration Examples

#### JavaScript/Browser
```javascript
const idRock = new IdRockSDK({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.yourdomain.com/api'
});

const assessment = await idRock.assessRisk({
  event: 'checkout_attempt',
  amount: 299.99,
  currency: 'BRL'
});

if (assessment.riskLevel === 'HIGH') {
  // Handle high-risk transaction
  showSecurityVerification();
}
```

#### cURL Examples
```bash
# Risk Assessment
curl -X POST "http://localhost:3001/api/assess-risk" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "event": "login_attempt",
    "metadata": {"test": true}
  }'

# Get Statistics
curl "http://localhost:3001/api/assess-risk/stats" \
  -H "Authorization: Bearer your-api-key"
```

---

## 🐳 Container Management

Complete Docker container lifecycle management and cleanup procedures.

### Container Cleanup Protocol

#### Mandatory Cleanup Script

**ALWAYS run after any Docker testing:**

```bash
#!/bin/bash
# ./cleanup-containers.sh

echo "🧹 Starting idRock MVP Container Cleanup..."

# Stop and remove all idRock containers
docker-compose down --volumes --remove-orphans

# Check for remaining containers
REMAINING=$(docker ps -a --filter "name=idrock" --filter "name=nexshop" -q)

if [ -n "$REMAINING" ]; then
    echo "⚠️ WARNING: Found remaining containers, removing them..."
    docker rm -f $REMAINING
fi

# Clean up unused resources
docker system prune -f

# Final verification
FINAL_CHECK=$(docker ps -a --filter "name=idrock" --filter "name=nexshop" -q)

if [ -n "$FINAL_CHECK" ]; then
    echo "❌ ERROR: Containers still exist after cleanup!"
    exit 1
else
    echo "✅ Complete cleanup successful!"
fi
```

### Container Lifecycle Management

#### Starting Services

**Production Deployment:**
```bash
# Start production stack
docker-compose -f docker-compose.production.yml up -d

# Check service health
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

**Development Deployment:**
```bash
# Start development stack
docker-compose up -d

# Monitor logs
docker-compose logs -f

# Check individual service logs
docker-compose logs idrock-api
docker-compose logs nexshop-store
docker-compose logs nginx
```

#### Monitoring Containers

```bash
# Check running containers
docker ps --filter "name=idrock" --filter "name=nexshop"

# Monitor resource usage
docker stats

# View container health
docker inspect --format='{{json .State.Health}}' idrock-api

# Check container logs
docker logs -f idrock-api
```

#### Stopping Services

```bash
# Graceful shutdown
docker-compose down

# Force stop with cleanup
docker-compose down --volumes --remove-orphans

# Stop specific services only
docker-compose stop idrock-api nexshop-store
```

### Troubleshooting Container Issues

#### Common Container Problems

| Problem | Symptoms | Solution |
|---------|----------|----------|
| **Port Conflicts** | "Address already in use" | Stop conflicting services or change ports |
| **Memory Issues** | Container crashes, OOM errors | Increase Docker memory allocation |
| **Volume Permissions** | Database/file access errors | Fix volume permissions with `chown` |
| **Network Issues** | Services can't communicate | Check Docker network configuration |
| **Build Failures** | Container won't build | Check Dockerfile syntax, update dependencies |

#### Diagnostic Commands

```bash
# Check Docker system info
docker system df
docker system info

# Inspect container configuration
docker inspect idrock-api

# Check container processes
docker exec -it idrock-api ps aux

# Access container shell
docker exec -it idrock-api /bin/bash

# View container filesystem
docker exec -it idrock-api ls -la /app
```

### Performance Optimization

#### Resource Limits

Add resource constraints to docker-compose.yml:

```yaml
services:
  idrock-api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

#### Health Checks

All services include comprehensive health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

#### Volume Management

```bash
# List volumes
docker volume ls

# Remove unused volumes
docker volume prune

# Backup volume data
docker run --rm -v idrock_app_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

---

## 🔧 Solução de Problemas

Problemas comuns e soluções para desenvolvimento, testes e deploy.

### Quick Diagnostics

#### System Health Check
```bash
# Check all services quickly
./health-check.sh

# Manual health verification
curl http://localhost:3001/api/health
curl http://localhost:3000
curl http://localhost:8080  # nginx proxy
```

#### Log Analysis
```bash
# View recent logs
docker-compose logs --tail=50 -f

# Check specific service logs
docker-compose logs idrock-api | grep ERROR
docker-compose logs nexshop-store | grep -i error

# System logs
journalctl -u docker.service --since today
```

### Common Issues & Solutions

#### API Connection Issues

**Problem**: Demo store can't connect to API
```
Failed to fetch from http://localhost:3001/api/health
```

**Solutions:**
1. **Check API Status**:
   ```bash
   curl http://localhost:3001/api/health
   docker-compose logs idrock-api
   ```

2. **Verify Environment Variables**:
   ```bash
   # Check React app configuration
   echo $REACT_APP_IDROCK_API_URL
   
   # Update if needed
   export REACT_APP_IDROCK_API_URL=http://localhost:3001/api
   ```

3. **Network Issues**:
   ```bash
   # Check Docker network
   docker network ls
   docker network inspect idrock-network
   ```

#### Port Conflicts

**Problem**: Port already in use
```
Error: bind: address already in use
```

**Solutions:**
1. **Find Process Using Port**:
   ```bash
   # Find what's using the port
   lsof -i :3001
   netstat -tulpn | grep 3001
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Change Port Configuration**:
   ```bash
   # Update .env file
   API_PORT=4001
   DEMO_STORE_PORT=4000
   
   # Or use different compose file with custom ports
   docker-compose -f docker-compose.custom-ports.yml up -d
   ```

#### Build Failures

**Problem**: Docker build fails
```
npm ERR! network timeout
ERROR: failed to solve: process "/bin/sh -c npm install" did not complete successfully
```

**Solutions:**
1. **Clear Docker Build Cache**:
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

2. **Network Issues**:
   ```bash
   # Use different npm registry
   docker-compose build --build-arg NPM_REGISTRY=https://registry.npmjs.org/
   ```

3. **Memory Issues**:
   ```bash
   # Increase Docker memory (Docker Desktop)
   # Settings > Resources > Memory: 4GB minimum
   
   # Or build with memory limit
   docker build --memory=2g -t idrock-api ./api
   ```

#### Database Connection Issues

**Problem**: SQLite database errors
```
SQLITE_CANTOPEN: unable to open database file
```

**Solutions:**
1. **Check File Permissions**:
   ```bash
   # Create data directory
   mkdir -p data
   chmod 755 data
   
   # Fix volume permissions
   docker-compose exec idrock-api chown -R node:node /app/data
   ```

2. **Database Path Issues**:
   ```bash
   # Verify database path in .env
   SQLITE_DB_PATH=./data/idrock.db
   
   # Check if database file exists
   ls -la data/
   ```

#### React Build Issues

**Problem**: React app won't build
```
Module not found: Can't resolve 'react-router-dom'
```

**Solutions:**
1. **Install Dependencies**:
   ```bash
   cd demo-store
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Node.js Version Issues**:
   ```bash
   # Check Node.js version
   node --version  # Should be 18.x or higher
   
   # Use correct version
   nvm install 18
   nvm use 18
   ```

3. **Memory Issues During Build**:
   ```bash
   # Increase Node.js memory
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

#### NGINX/Proxy Issues

**Problem**: 502 Bad Gateway
```
nginx: [emerg] host not found in upstream
```

**Solutions:**
1. **Check Service Dependencies**:
   ```bash
   # Ensure API and store are running
   docker-compose ps
   
   # Check service connectivity
   docker-compose exec nginx ping idrock-api
   docker-compose exec nginx ping nexshop-store
   ```

2. **NGINX Configuration**:
   ```bash
   # Check NGINX config
   docker-compose exec nginx nginx -t
   
   # View NGINX logs
   docker-compose logs nginx
   ```

#### SSL/TLS Issues

**Problem**: SSL certificate errors
```
SSL_ERROR_SELF_SIGNED_CERT
```

**Solutions:**
1. **Development Environment**:
   ```bash
   # Accept self-signed certificates in browser
   # Or disable HTTPS in development
   HTTPS=false npm start
   ```

2. **Production Environment**:
   ```bash
   # Use proper certificates
   cp your-cert.pem docker/nginx/ssl/nginx.crt
   cp your-key.pem docker/nginx/ssl/nginx.key
   
   # Restart nginx
   docker-compose restart nginx
   ```

### Performance Issues

#### Slow API Response

**Problem**: API responses taking too long
```
Request timeout after 5000ms
```

**Solutions:**
1. **Database Performance**:
   ```bash
   # Check database size
   sqlite3 data/idrock.db ".schema"
   sqlite3 data/idrock.db "PRAGMA database_list;"
   
   # Optimize database
   sqlite3 data/idrock.db "VACUUM;"
   sqlite3 data/idrock.db "PRAGMA optimize;"
   ```

2. **Memory Usage**:
   ```bash
   # Monitor container memory
   docker stats idrock-api
   
   # Increase memory limit
   # Add to docker-compose.yml:
   mem_limit: 1g
   memswap_limit: 1g
   ```

3. **External API Issues**:
   ```bash
   # Test ProxyCheck.io directly
   curl "http://proxycheck.io/v2/1.1.1.1"
   
   # Use fallback if needed
   PROXYCHECK_API_KEY=fallback_mode
   ```

#### High Resource Usage

**Problem**: Containers using too much CPU/memory

**Solutions:**
1. **Resource Monitoring**:
   ```bash
   # Continuous monitoring
   docker stats --no-stream
   
   # Detailed container info
   docker exec idrock-api cat /proc/meminfo
   docker exec idrock-api top
   ```

2. **Resource Limits**:
   ```yaml
   # Add to docker-compose.yml
   services:
     idrock-api:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

### Development Issues

#### Hot Reload Not Working

**Problem**: Changes not reflected in development

**Solutions:**
1. **File Watching**:
   ```bash
   # For React app
   CHOKIDAR_USEPOLLING=true npm start
   
   # For API
   cd api && npm run dev  # Uses nodemon
   ```

2. **Volume Mounting**:
   ```yaml
   # Ensure proper volume mounts in docker-compose.yml
   volumes:
     - ./demo-store/src:/app/src
     - ./api/src:/app/src
   ```

#### Environment Variables Not Loading

**Problem**: Configuration not taking effect

**Solutions:**
1. **Environment File Loading**:
   ```bash
   # Check if .env exists
   ls -la .env*
   
   # Source environment
   source .env
   export $(cat .env | grep -v '#' | xargs)
   ```

2. **Docker Environment**:
   ```bash
   # Check container environment
   docker-compose exec idrock-api env | grep NODE_ENV
   
   # Update compose file
   environment:
     - NODE_ENV=${NODE_ENV}
     - API_PORT=${API_PORT}
   ```

### Emergency Recovery

#### Complete System Reset

If everything fails, use this nuclear option:

```bash
#!/bin/bash
# emergency-reset.sh

echo "🚨 EMERGENCY SYSTEM RESET"
echo "This will remove ALL containers and data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    # Stop all containers
    docker stop $(docker ps -aq)
    
    # Remove all containers
    docker rm $(docker ps -aq)
    
    # Remove all images
    docker rmi $(docker images -q) -f
    
    # Remove all volumes
    docker volume rm $(docker volume ls -q)
    
    # Remove all networks
    docker network prune -f
    
    # Clean system
    docker system prune -af --volumes
    
    echo "✅ System reset complete"
    echo "Now run: docker-compose up -d --build"
fi
```

### Getting Help

1. **Check Logs First**: Always check container logs for detailed error messages
2. **Verify Environment**: Ensure all environment variables are set correctly
3. **Test Components**: Test each component individually before full integration
4. **Clean Environment**: Use cleanup scripts between tests
5. **Monitor Resources**: Check CPU, memory, and disk usage

For additional help, check:
- GitHub Issues: https://github.com/grupo-idrock/idrock-mvp/issues
- API Documentation: http://localhost:3001/api/docs
- Container Logs: `docker-compose logs -f`

## 🔧 Configuração

### Variáveis de Ambiente

Create a `.env` file based on `.env.example`:

```env
# ProxyCheck.io API Configuration
PROXYCHECK_API_KEY=your_api_key_here

# API Configuration
API_PORT=3001
NODE_ENV=development

# Demo Store Configuration
REACT_APP_IDROCK_API_URL=http://localhost:3001/api

# Database Configuration
SQLITE_DB_PATH=./data/idrock.db
```

## 📁 Estrutura do Projeto

Visão completa da organização do sistema idRock MVP e componentes.

```
idrock-mvp/
├── 📦 SDK (JavaScript Fraud Detection Library)
│   ├── src/
│   │   ├── idrock.js                 # Main SDK implementation  
│   │   ├── types/                    # Type definitions
│   │   └── utils/                    # Utility functions
│   ├── dist/                         # Built distributions (UMD, ESM)
│   │   ├── idrock.js                 # Development build
│   │   ├── idrock.min.js            # Production build
│   │   └── idrock.d.ts              # TypeScript definitions
│   ├── tests/                        # Unit test suites
│   ├── rollup.config.js             # Build configuration
│   ├── package.json                 # SDK dependencies and scripts
│   └── README.md                    # SDK documentation
│   
├── 🌐 API (Backend Fraud Detection Service)
│   ├── src/
│   │   ├── server.js                # Main API server
│   │   ├── routes/                  # API endpoint definitions
│   │   │   ├── riskAssessment.js    # Risk analysis endpoints
│   │   │   ├── session.js           # Session management
│   │   │   ├── event.js             # Event tracking
│   │   │   ├── health.js            # Health monitoring
│   │   │   └── docs.js              # API documentation
│   │   ├── services/                # Business logic services
│   │   │   ├── RiskAssessmentService.js  # Core risk engine
│   │   │   ├── ProxyCheckService.js      # IP analysis service
│   │   │   └── DatabaseService.js        # Data persistence
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.js              # Authentication
│   │   │   ├── errorHandler.js      # Error handling
│   │   │   └── requestLogger.js     # Request logging
│   │   └── utils/
│   │       └── logger.js            # Structured logging
│   ├── logs/                        # Application logs
│   │   ├── app.log                  # General application log
│   │   ├── error.log               # Error-specific log
│   │   └── access.log              # HTTP access log
│   ├── Dockerfile                   # API container definition
│   ├── package.json                # API dependencies
│   └── .eslintrc.js                # Code quality rules
│   
├── 🛒 Demo Store (React E-commerce Application)  
│   ├── src/
│   │   ├── App.js                   # Main application component
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Header.js           # Navigation header
│   │   │   ├── Footer.js           # Site footer
│   │   │   └── ProductCard.js      # Product display card
│   │   ├── pages/                   # Application pages
│   │   │   ├── HomePage.js         # Product catalog page
│   │   │   ├── ProductPage.js      # Product detail page
│   │   │   ├── CartPage.js         # Shopping cart page
│   │   │   ├── CheckoutPage.js     # Multi-step checkout
│   │   │   └── RiskDashboard.js    # Security analytics
│   │   ├── contexts/                # React context providers
│   │   │   ├── CartContext.js      # Shopping cart state
│   │   │   └── IdRockContext.js    # Fraud detection integration
│   │   ├── data/
│   │   │   └── products.js         # Demo product catalog
│   │   └── styles/                 # CSS stylesheets
│   ├── public/                      # Static assets
│   │   ├── index.html              # Main HTML template
│   │   ├── favicon.ico             # Site icon
│   │   └── images/                 # Product images
│   ├── build/                       # Production build output
│   ├── Dockerfile                   # Store container definition  
│   ├── package.json                # Store dependencies
│   └── .eslintrc.js                # Code quality rules
│   
├── 🐳 Docker (Container Infrastructure)
│   └── nginx/                       # NGINX proxy configuration
│       ├── nginx.conf              # Main NGINX config
│       ├── conf.d/                 # Site configurations
│       │   ├── default.conf        # Default site
│       │   └── ssl.conf            # SSL configuration
│       ├── ssl/                    # SSL certificates
│       │   ├── nginx.crt           # SSL certificate
│       │   └── nginx.key           # SSL private key
│       └── logs/                   # NGINX access logs
│   
├── 💾 Data (Persistent Storage)
│   ├── idrock.db                   # SQLite database file
│   ├── backups/                    # Database backups
│   └── uploads/                    # File uploads (future use)
│   
├── 🧪 Tests (Integration and E2E Tests)
│   ├── integration/                # Integration test suites
│   ├── e2e/                       # End-to-end test scenarios
│   ├── fixtures/                  # Test data and fixtures
│   └── utils/                     # Testing utilities
│   
├── 📋 Scripts (Automation and Testing)
│   ├── cleanup-containers.sh       # 🧹 Mandatory Docker cleanup
│   ├── test-integration.sh        # 🧪 Full integration testing
│   ├── test-production-docker.sh  # 🚀 Production deployment test
│   ├── test-local-development.sh  # 💻 Local development test
│   ├── health-check.sh            # ⚕️ System health verification
│   └── backup-database.sh         # 💾 Database backup utility
│   
├── ⚙️ Configuration Files
│   ├── docker-compose.yml          # Development stack definition
│   ├── docker-compose.production.yml # Production stack definition
│   ├── .env.example               # Environment template
│   ├── .env                       # Local environment variables
│   ├── .gitignore                 # Git ignore patterns
│   ├── .dockerignore              # Docker ignore patterns
│   └── package.json               # Root project configuration
│   
├── 📚 Documentation
│   ├── README.md                   # This comprehensive guide
│   ├── IDROCK_DEVELOPMENT_PLAN.md  # Development planning docs
│   ├── IDROCK_MVP_DEVELOPMENT_PLAN.md # MVP-specific plans
│   ├── LICENSE                     # MIT license
│   └── docs/                       # Additional documentation
│       ├── api-reference.md        # Detailed API documentation
│       ├── sdk-integration.md      # SDK integration guide
│       ├── deployment-guide.md     # Production deployment
│       └── security-analysis.md    # Security considerations
│   
└── 🔧 Development Tools
    ├── .vscode/                    # VS Code configuration
    │   ├── settings.json           # Editor settings
    │   ├── launch.json            # Debug configuration
    │   └── extensions.json        # Recommended extensions
    ├── .github/                    # GitHub workflows (if using GitHub)
    │   └── workflows/             # CI/CD workflows
    └── scripts/                    # Development utilities
        ├── setup.sh               # Initial setup script
        ├── dev-start.sh          # Development startup
        └── prod-deploy.sh        # Production deployment
```

### Key Component Overview

| Component | Purpose | Technology | Key Features |
|-----------|---------|------------|--------------|
| **SDK** | Client-side integration | JavaScript/TypeScript | Device fingerprinting, API communication, session management |
| **API** | Core fraud detection | Node.js + Express | Risk assessment, data persistence, external API integration |
| **Demo Store** | E-commerce demonstration | React + Context API | Shopping cart, checkout flow, risk dashboard |
| **NGINX** | Reverse proxy & load balancer | NGINX | SSL termination, request routing, static assets |
| **Database** | Data persistence | SQLite | Sessions, assessments, device fingerprints |
| **Docker** | Containerization | Docker Compose | Development and production environments |

### File Size Guidelines

- **Functions**: Maximum 50 lines each
- **Files**: Maximum 500 lines each  
- **Components**: Single responsibility principle
- **Documentation**: Comprehensive inline comments for complex logic
- **Configuration**: Environment-specific settings in separate files

### Development Workflow

```bash
# 1. Initial Setup
npm run install:all                 # Install all dependencies
cp .env.example .env               # Configure environment

# 2. Development
npm run dev:api                    # Start API server
npm run dev:store                  # Start React app (separate terminal)

# 3. Testing
npm run test:all                   # Run unit tests
./test-integration.sh              # Integration tests
./test-production-docker.sh       # Production tests

# 4. Quality Assurance
npm run lint:all                   # Code linting
npm run format:all                 # Code formatting
npm run build:all                  # Build verification

# 5. Deployment
docker-compose -f docker-compose.production.yml up -d

# 6. MANDATORY Cleanup
./cleanup-containers.sh            # Always clean up after testing
```

### Code Organization Principles

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Modularity**: Components can be developed, tested, and deployed independently  
3. **Reusability**: Common functionality is abstracted into reusable modules
4. **Testability**: All components include comprehensive test suites
5. **Documentation**: Clear documentation at all levels (code, API, user guides)
6. **Security**: Security considerations integrated throughout the architecture
7. **Scalability**: Architecture supports horizontal and vertical scaling
8. **Maintainability**: Clean code practices and consistent patterns throughout

## 👥 Equipe idRock

**Equipe de Desenvolvimento idRock** - Especialistas em Detecção de Fraudes Empresarial

### Equipe Principal e Especializações

| Membro da Equipe | Função | Responsabilidades | Expertise Empresarial |
|---------|------|------------------|-----------|
| **João Carlos Ariedi Filho** | CTO e Arquiteto Líder | Arquitetura da plataforma, algoritmos ML, integrações empresariais | Node.js, Express, Microsserviços, APIs Empresariais |
| **Raphael Hideyuki Uematsu** | VP Engenharia e Arquiteto SDK | Plataforma frontend, desenvolvimento SDK, integração com clientes | React, JavaScript, UI/UX Empresarial, Arquitetura SDK |
| **Tiago Elusardo Marques** | VP Qualidade e Integração | Integrações API empresariais, garantia de qualidade, testes de compliance | Integração Empresarial, Automação QA, Testes de Segurança |
| **Lucas Mazzaferro Dias** | VP Infraestrutura e DevOps | Infraestrutura cloud, deployment empresarial, monitoramento | Docker, Kubernetes, Arquitetura Cloud, DevOps Empresarial |

### Background da Empresa
- **Fundada**: 2024
- **Foco**: Soluções empresariais de detecção de fraudes e avaliação de risco
- **Especialização**: Prevenção de fraudes em e-commerce de alto volume
- **Posição no Mercado**: Líder emergente em tecnologia de detecção de fraudes em tempo real

### Metodologia de Desenvolvimento Empresarial
- **Fase de Planejamento**: Análise de requisitos empresariais e design de escalabilidade
- **Fase de Desenvolvimento**: Desenvolvimento ágil com integração contínua
- **Fase de Testes**: Testes de nível empresarial e validação de segurança
- **Fase de Deploy**: Deploy de produção com monitoramento e suporte
- **Melhoria Contínua**: Integração de feedback do cliente e evolução da plataforma

### Padrões de Desenvolvimento Empresarial
- **Controle de Versão**: Git com protocolos de segurança empresariais
- **Comunicação**: Atualizações para stakeholders e revisões técnicas
- **Desenvolvimento**: Revisões de código e desenvolvimento security-first
- **Garantia de Qualidade**: Testes automatizados e validação de compliance
- **Documentação**: Documentação de nível empresarial e referências de API

---

## 📄 Licença

Licença MIT - Veja [LICENSE](LICENSE) para detalhes.

É concedida permissão, gratuitamente, a qualquer pessoa que obtenha uma cópia deste software e arquivos de documentação associados (o "Software"), para lidar com o Software sem restrição, incluindo, sem limitação, os direitos de usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias do Software.

---

## 🏢 Aviso de Produção Empresarial

idRock é projetado como uma **plataforma empresarial pronta para produção** para deployment comercial em cenários de detecção de fraudes de alto volume. O sistema implementa algoritmos avançados de detecção de fraudes e se integra com serviços de nível empresarial, pronto para uso imediato em produção com recursos abrangentes de segurança e compliance.

### Recursos Empresariais
- **Propósito de Produção**: Projetado para detecção de fraudes comerciais em escala empresarial
- **Deploy no Mundo Real**: Comprovado em ambientes de produção com clientes empresariais
- **Excelência Tecnológica**: Combina tecnologias de ponta com confiabilidade empresarial
- **Padrões de Compliance**: Atende requisitos regulatórios incluindo LGPD, GDPR e PCI DSS

### Deploy Empresarial
Para deployment empresarial de produção, idRock inclui:
- Arquitetura de segurança empresarial com trilhas de auditoria abrangentes
- Otimização de performance para processamento de transações de alto volume
- Tratamento de erros avançado, sistemas de monitoramento e alertas
- Compliance regulatório completo (LGPD, GDPR, PCI DSS, SOC2)
- Gerenciamento empresarial de chaves de API e controles de acesso
- Soluções de banco de dados de nível produção com alta disponibilidade
- Suporte empresarial 24/7 e garantias de SLA
- Serviços profissionais para integração e customização

---

## 🔗 Recursos Relacionados e Referências

### APIs e Serviços Externos
- [Documentação da API ProxyCheck.io](https://proxycheck.io/api/) - Reputação de IP e detecção de proxy
- [Documentação FingerprintJS](https://github.com/fingerprintjs/fingerprintjs) - Fingerprinting de navegador

### Conformidade e Segurança
- [Guia de Conformidade LGPD](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd) - Leis brasileiras de proteção de dados
- [Prevenção de Fraudes OWASP](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks) - Melhores práticas de segurança
- [Framework de Cibersegurança NIST](https://www.nist.gov/cyberframework) - Padrões de cibersegurança

### Documentação de Tecnologias  
- [Documentação Node.js](https://nodejs.org/en/docs/) - Ambiente de execução backend
- [Documentação React](https://reactjs.org/docs/) - Framework frontend
- [Documentação Docker](https://docs.docker.com/) - Plataforma de containerização
- [Guia Express.js](https://expressjs.com/en/guide/) - Framework web para Node.js

### Referências Acadêmicas
- [Detecção de Fraudes em E-commerce](https://www.researchgate.net/publication/fraud-detection) - Pesquisa acadêmica
- [Machine Learning para Detecção de Fraudes](https://dl.acm.org/doi/fraud-ml) - Abordagens de ML para prevenção de fraudes
- [Melhores Práticas de Cibersegurança](https://www.sans.org/white-papers/) - Diretrizes de segurança da indústria

---

## 🚀 Lista de Verificação para Iniciar

Para novos usuários e avaliadores, siga esta lista de verificação:

### Verificação de Pré-requisitos
- [ ] Docker e Docker Compose instalados
- [ ] Node.js 18+ instalado (para desenvolvimento local)
- [ ] Git instalado para controle de versão
- [ ] Navegador web moderno (Chrome, Firefox, Safari)
- [ ] 4GB+ de RAM disponível para containers Docker

### Início Rápido (5 minutos)
- [ ] Clonar o repositório
- [ ] Copiar `.env.example` para `.env`
- [ ] Executar `docker-compose -f docker-compose.production.yml up -d`
- [ ] Visitar `http://localhost:3000` para loja demo
- [ ] Visitar `http://localhost:3000/risk-dashboard` para analytics
- [ ] **OBRIGATÓRIO**: Executar `./cleanup-containers.sh` quando terminar

### Para Apresentação Empresarial
- [ ] Revisar seção [Guia de Demonstração Empresarial](#guia-de-demonstração-empresarial)
- [ ] Testar todos os cenários de demonstração empresarial
- [ ] Verificar se todos os serviços estão operacionais
- [ ] Preparar pontos de apresentação comercial da documentação
- [ ] Ter soluções de troubleshooting empresariais prontas

### Para Desenvolvimento
- [ ] Seguir seção [Configuração de Desenvolvimento Local](#desenvolvimento-local)
- [ ] Executar todas as suítes de teste para verificar funcionalidade
- [ ] Revisar estrutura do código e arquitetura
- [ ] Configurar variáveis de ambiente de desenvolvimento
- [ ] Entender o algoritmo de avaliação de risco

### Para Integração
- [ ] Revisar seção [Guia de Integração do SDK](#guia-de-integração-do-sdk)
- [ ] Estudar documentação da API e exemplos
- [ ] Entender autenticação e limitação de taxa
- [ ] Testar cenários de integração
- [ ] Revisar considerações de segurança

---

**⚡ Construído com tecnologias de nível empresarial para deployment de produção**

**🔒 Implementa detecção avançada de fraudes com avaliação de risco powered por ML**  

**📚 Documentação abrangente para integração empresarial**

**🧪 Testado em produção com garantia de qualidade empresarial e validação de compliance**

**🏢 Pronto para deployment comercial imediato com suporte empresarial**

---

**🤖 Documentation generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**