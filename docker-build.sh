#!/bin/bash

# Docker build script for AssetFlow

echo "🐳 Building AssetFlow Docker image..."

# Build the Docker image
docker build -t assetflow:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 To run the container:"
    echo "   docker run -p 3000:3000 assetflow:latest"
    echo ""
    echo "🐙 Or use Docker Compose:"
    echo "   docker-compose up -d"
    echo ""
    echo "📊 Check container status:"
    echo "   docker-compose ps"
else
    echo "❌ Docker build failed!"
    exit 1
fi