#!/bin/bash
# # ADDED: Bash script to build standalone EXE (for Unix/Linux)
set -e

echo "🔨 Building BORTtheBOT Server..."

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "📦 Installing dependencies..."
bun install

echo "🏗️  Building TypeScript files..."
cd apps/server
bun run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "📦 Compiling executable..."
bun build ./src/launcher-dist.ts \
    --outfile ./BORTtheBOT-Server \
    --compile \
    --minify \
    --sourcemap \
    --target bun

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo ""
echo "✅ Executable created successfully: apps/server/BORTtheBOT-Server"
echo "🚀 You can now run: ./apps/server/BORTtheBOT-Server"
echo ""

