#!/bin/bash
set -e

echo "🔨 Building shared package..."
pnpm --filter @ontheway/shared build

echo "🔨 Building server..."
pnpm --filter @ontheway/server build

echo "🔨 Building web..."
pnpm --filter @ontheway/web build

echo "✅ Build complete!"
echo ""
echo "To deploy:"
echo "  vercel --prod"
