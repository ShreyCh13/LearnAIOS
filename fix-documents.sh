#!/bin/bash
set -e

echo "🔧 Fixing Document Upload Feature..."

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_db?schema=public"

cd /Users/shrey/LearnAIOS

echo "📦 Step 1: Regenerating Prisma Client..."
cd packages/db
npx prisma generate

echo "🔨 Step 2: Rebuilding DB package..."
npm run build

echo "✅ Done! API server will auto-reload. Try uploading a document now."
echo ""
echo "If API server didn't reload, manually restart it:"
echo "  cd /Users/shrey/LearnAIOS/apps/api"
echo "  npm run dev"


