#!/usr/bin/env bash
# ============================================================
# Quick health check for all EMS services
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

check_http() {
  local url=$1
  local name=$2
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "204" ] || [ "$code" = "401" ] || [ "$code" = "404" ]; then
    echo "  ✅ $name — $url (HTTP $code)"
  else
    echo "  ⚠️  $name — $url (HTTP $code)"
  fi
}

echo "🔍 EMS Health Check"
echo ""

check_http "http://localhost:3001/healthz"     "Backend API"
check_http "http://localhost:8080"             "School Dashboard"
check_http "http://localhost:8081"             "Parent App"
check_http "http://localhost:8082"             "Staff App"
check_http "http://localhost:4000"             "Owlin Web"
check_http "http://localhost:4001/api/v1/health" "Owlin Server"

echo ""
echo "🗄️  Infrastructure"
docker compose ps mongo redis | tail -n +2 | awk '{print "  " $1 " — " $4 " (" $5 ")"}'
