#!/bin/bash
echo "🚨 COMPLETE RESET - Restoring Working State"
echo ""

cd /Users/shrey/LearnAIOS

# Kill everything
echo "1️⃣ Stopping all servers..."
pkill -9 -f "npm run dev"
pkill -9 -f "ts-node-dev"
pkill -9 -f "next dev"
sleep 2

# Clean Prisma client
echo "2️⃣ Cleaning Prisma client cache..."
cd packages/db
rm -rf node_modules/.prisma
rm -rf ../../node_modules/.pnpm/@prisma+client@*

# Regenerate everything
echo "3️⃣ Regenerating Prisma client..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_db?schema=public"
npx prisma generate

echo "4️⃣ Rebuilding db package..."
npm run build

# Restart servers
echo "5️⃣ Starting API server..."
cd /Users/shrey/LearnAIOS/apps/api
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_db?schema=public" \
  API_PORT=3001 \
  JWT_SECRET="dev-secret-key-change-in-production" \
  OPENAI_API_KEY="your-openai-api-key-here" \
  npm run dev &

sleep 4

echo "6️⃣ Starting Web server..."
cd /Users/shrey/LearnAIOS/apps/web
npm run dev &

sleep 3

echo ""
echo "✅ DONE!"
echo ""
echo "🌐 Open: http://localhost:3000"
echo "📧 Login: instructor@example.com"
echo ""
echo "All Prompt 13 features should now work (WITHOUT document uploads)"


