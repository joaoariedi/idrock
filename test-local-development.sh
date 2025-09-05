#!/bin/bash

# idRock MVP - Local Development Test Script
# Tests the complete fraud detection flow locally

echo "🚀 Starting idRock MVP Local Development Test..."
echo "=================================================="

# Ensure dependencies are installed
echo "1. Installing dependencies..."
npm run install:all

# Test API server
echo "2. Testing API server in background..."
npm run dev:api &
API_PID=$!
echo "API started with PID: $API_PID"

# Wait for API to start
sleep 5

# Test API health endpoint
echo "3. Testing API health..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    kill $API_PID
    exit 1
fi

# Test risk assessment endpoint
echo "4. Testing risk assessment endpoint..."
RISK_TEST=$(curl -s -X POST http://localhost:3001/api/assess-risk \
    -H "Content-Type: application/json" \
    -d '{"event":"test","amount":100,"sessionId":"test123"}')

if echo "$RISK_TEST" | grep -q "riskScore"; then
    echo "✅ Risk assessment test passed"
else
    echo "❌ Risk assessment test failed"
    kill $API_PID
    exit 1
fi

# Test demo store build
echo "5. Testing demo store build..."
cd demo-store
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Demo store build successful"
else
    echo "❌ Demo store build failed"
    cd ..
    kill $API_PID
    exit 1
fi

cd ..

# Cleanup
echo "6. Cleaning up test processes..."
kill $API_PID

echo "=================================================="
echo "🎉 All local development tests passed!"
echo "=================================================="