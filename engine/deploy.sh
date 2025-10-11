#!/bin/bash

# Deployment script for Google Cloud Run
# Usage: ./deploy.sh [project-id] [region]

PROJECT_ID=${1:-"your-gcp-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="checkmait-engine"

echo "🚀 Deploying CheckmAIt Chess Engine to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

# Push to Google Container Registry
echo "📤 Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image=gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3000 \
  --set-env-vars=HTTP_PORT=3000,WS_BASE_PORT=9000 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --project=$PROJECT_ID

echo "✅ Deployment complete!"
echo "Your service URL:"
gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --project=$PROJECT_ID --format='value(status.url)'
