#!/usr/bin/env bash
# ============================================================
# Wait for EMS services to become healthy
# ============================================================
set -euo pipefail

SERVICES="mongo redis backend school-dashboard parent-app staff-app owlin-web owlin-server"
TIMEOUT=${TIMEOUT:-120}
INTERVAL=${INTERVAL:-5}

wait_for_service() {
  local svc=$1
  local elapsed=0
  echo "⏳ Waiting for $svc..."
  while true; do
    status=$(docker compose ps -q "$svc" 2>/dev/null | xargs -I {} docker inspect --format='{{.State.Health.Status}}' {} 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      echo "  ✅ $svc is healthy"
      return 0
    fi
    if [ "$elapsed" -ge "$TIMEOUT" ]; then
      echo "  ❌ $svc not healthy after ${TIMEOUT}s (status: $status)"
      return 1
    fi
    sleep "$INTERVAL"
    elapsed=$((elapsed + INTERVAL))
  done
}

all_healthy=true
for svc in $SERVICES; do
  if ! wait_for_service "$svc"; then
    all_healthy=false
  fi
done

if [ "$all_healthy" = true ]; then
  echo ""
  echo "🚀 All services are up!"
  echo "   Backend API      → http://localhost:3001"
  echo "   School Dashboard → http://localhost:8080"
  echo "   Parent App       → http://localhost:8081"
  echo "   Staff App        → http://localhost:8082"
  echo "   Owlin Web        → http://localhost:4000"
  echo "   Owlin Server     → http://localhost:4001"
  exit 0
else
  echo ""
  echo "⚠️  Some services are not healthy. Run 'make logs' for details."
  exit 1
fi
