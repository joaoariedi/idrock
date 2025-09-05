#!/bin/bash

# idRock MVP - Container Cleanup Script
# MANDATORY cleanup procedure for all testing cycles

echo "🧹 Starting idRock MVP Container Cleanup..."
echo "=================================================="

# Stop and remove containers with complete cleanup
echo "1. Stopping Docker Compose services..."
docker-compose down --volumes --remove-orphans

# Verify no containers remain
echo "2. Checking for remaining containers..."
REMAINING=$(docker ps -a --filter "name=idrock" --filter "name=nexshop" --filter "name=nginx" --filter "name=redis" -q)

if [ -n "$REMAINING" ]; then
    echo "⚠️  WARNING: Found remaining containers, removing them..."
    docker rm -f $REMAINING
else
    echo "✅ No containers remain"
fi

# Clean up unused images and volumes
echo "3. Cleaning up unused Docker resources..."
docker system prune -f

# Final verification
echo "4. Final verification..."
FINAL_CHECK=$(docker ps -a --filter "name=idrock" --filter "name=nexshop" --filter "name=nginx" --filter "name=redis" -q)

if [ -n "$FINAL_CHECK" ]; then
    echo "❌ ERROR: Containers still exist after cleanup!"
    docker ps -a
    exit 1
else
    echo "✅ Complete cleanup successful!"
fi

echo "=================================================="
echo "🎉 Container cleanup complete! System is clean."
echo "=================================================="