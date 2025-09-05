#!/bin/bash

# idRock MVP - Production Docker Test Script
# Complete production deployment test with mandatory cleanup

echo "🚀 Testing idRock MVP Production Docker Deployment..."
echo "=================================================="

# Clean up first
echo "0. Pre-test cleanup..."
./cleanup-containers.sh

# Create environment file for production
echo ""
echo "1. Setting up production environment..."
cat > .env << EOF
PROXYCHECK_API_KEY=demo_key_production
NODE_ENV=production
REACT_APP_IDROCK_API_URL=http://localhost:3001/api
EOF
echo "✅ Environment file created"

# Test production build
echo ""
echo "2. Testing production Docker build..."
docker-compose -f docker-compose.production.yml build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Production Docker build successful"
else
    echo "❌ Production Docker build failed"
    ./cleanup-containers.sh
    exit 1
fi

# Start production services
echo ""
echo "3. Starting production services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Health checks
echo ""
echo "4. Running health checks..."

# Check API health
echo "Testing API health..."
for i in {1..10}; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ API is healthy"
        break
    else
        echo "⏳ Attempt $i: API not ready yet..."
        sleep 5
    fi
    if [ $i -eq 10 ]; then
        echo "❌ API health check failed after 50s"
        docker-compose -f docker-compose.production.yml logs idrock-api
        ./cleanup-containers.sh
        exit 1
    fi
done

# Check demo store health  
echo "Testing demo store health..."
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Demo store is healthy"
        break
    else
        echo "⏳ Attempt $i: Demo store not ready yet..."
        sleep 5
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Demo store health check failed after 50s"
        docker-compose -f docker-compose.production.yml logs nexshop-store
        ./cleanup-containers.sh
        exit 1
    fi
done

# Test API endpoint
echo ""
echo "5. Testing API functionality..."
RISK_TEST=$(curl -s -X POST http://localhost:3001/api/assess-risk \
    -H "Content-Type: application/json" \
    -d '{"event":"production_test","amount":499.99,"sessionId":"prod_test_123"}')

if echo "$RISK_TEST" | grep -q "riskScore"; then
    echo "✅ Risk assessment API working in production"
else
    echo "❌ Risk assessment API failed in production"
    echo "Response: $RISK_TEST"
    ./cleanup-containers.sh
    exit 1
fi

# Show running containers
echo ""
echo "6. Current running containers..."
docker ps --filter "name=idrock" --filter "name=nexshop"

# MANDATORY cleanup
echo ""
echo "MANDATORY PRODUCTION CLEANUP"
echo "=============================="
docker-compose -f docker-compose.production.yml down --volumes --remove-orphans

# Final verification
echo ""
echo "7. Final cleanup verification..."
REMAINING=$(docker ps -a --filter "name=idrock" --filter "name=nexshop" -q | wc -l)
if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All production containers cleaned up successfully"
else
    echo "❌ WARNING: $REMAINING containers still remain!"
    docker ps -a --filter "name=idrock" --filter "name=nexshop"
    ./cleanup-containers.sh
    exit 1
fi

echo ""
echo "=================================================="
echo "🎉 PRODUCTION DOCKER TEST PASSED!"
echo "✅ Production build: Working"
echo "✅ Service startup: Working"
echo "✅ API functionality: Working"
echo "✅ Demo store: Working"
echo "✅ Container cleanup: Working"
echo "=================================================="