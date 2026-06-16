#!/usr/bin/env bash
# ============================================================
# EMS — One-command bootstrap for local development
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🚀 EMS Bootstrap"
echo ""

# Check prerequisites
for cmd in docker docker-compose; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "❌ $cmd is required but not installed."
    exit 1
  fi
done

# Ensure backend env file exists
if [ ! -f "../EMS-backend/.env.docker" ]; then
  if [ -f "../EMS-backend/.env.example" ]; then
    echo "⚠️  EMS-backend/.env.docker not found — copying from .env.example"
    cp ../EMS-backend/.env.example ../EMS-backend/.env.docker
    echo "   Please review ../EMS-backend/.env.docker and update secrets."
  else
    echo "❌ Neither .env.docker nor .env.example found in ../EMS-backend/"
    exit 1
  fi
fi

echo "🔨 Building images..."
docker compose build

echo ""
echo "🐳 Starting services..."
docker compose up -d

echo ""
./scripts/wait-for-services.sh

echo ""
echo "🌱 Optional next steps:"
echo "   make migrate    # run DB migrations"
echo "   make seed       # bootstrap default tenant"
echo "   make logs       # tail all logs"
