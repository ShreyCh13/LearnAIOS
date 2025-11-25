#!/bin/bash
set -e

cd /Users/shrey/LearnAIOS

echo "🔧 Restoring working state..."

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_db?schema=public"

cd packages/db
echo "📦 Regenerating Prisma client..."
npx prisma generate

echo "🔨 Rebuilding db package..."
npm run build

echo "✅ Done! The API server should auto-reload and work now."
echo "Refresh your browser: http://localhost:3000/instructor"


