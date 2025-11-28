#!/bin/bash

echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client regenerated successfully!"
echo ""
echo "⚠️  IMPORTANT: You need to restart your Next.js dev server for changes to take effect."
echo ""
echo "Steps:"
echo "1. Stop your dev server (Ctrl+C in the terminal running 'npm run dev')"
echo "2. Start it again with: npm run dev"
echo ""
