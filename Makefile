# ============================================================
# EMS — Docker Compose Orchestration Targets
# ============================================================

COMPOSE := docker compose

.PHONY: help up down build logs infra-up infra-down clean \
        backend-logs dashboard-logs parent-logs staff-logs owlin-logs \
        shell-backend shell-owlin health scale-backend migrate seed

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ─── Lifecycle ──────────────────────────────────────────────
up: ## Start all services
	$(COMPOSE) up -d

down: ## Stop all services
	$(COMPOSE) down

build: ## Build all service images
	$(COMPOSE) build

build-no-cache: ## Build all images without cache
	$(COMPOSE) build --no-cache

clean: ## Remove containers, networks, volumes and images
	$(COMPOSE) down -v --rmi all

# ─── Logs ───────────────────────────────────────────────────
logs: ## Tail logs for all services
	$(COMPOSE) logs -f

backend-logs: ## Tail logs for backend
	$(COMPOSE) logs -f backend

dashboard-logs: ## Tail logs for school-dashboard
	$(COMPOSE) logs -f school-dashboard

parent-logs: ## Tail logs for parent-app
	$(COMPOSE) logs -f parent-app

staff-logs: ## Tail logs for staff-app
	$(COMPOSE) logs -f staff-app

owlin-logs: ## Tail logs for owlin-web + owlin-server
	$(COMPOSE) logs -f owlin-web owlin-server

# ─── Infrastructure only ────────────────────────────────────
infra-up: ## Start only MongoDB + Redis
	$(COMPOSE) up -d mongo redis

infra-down: ## Stop MongoDB + Redis
	$(COMPOSE) down mongo redis

infra-logs: ## Tail logs for MongoDB + Redis
	$(COMPOSE) logs -f mongo redis

# ─── Operations ─────────────────────────────────────────────
health: ## Check health status of all services
	$(COMPOSE) ps

scale-backend: ## Scale backend to 2 instances (nginx LB ready)
	$(COMPOSE) up -d --scale backend=2

shell-backend: ## Open shell in backend container
	$(COMPOSE) exec backend sh

shell-owlin: ## Open shell in owlin-server container
	$(COMPOSE) exec owlin-server sh

migrate: ## Run database migrations in backend
	$(COMPOSE) exec backend npm run migrate

seed: ## Bootstrap default school tenant
	$(COMPOSE) exec backend npm run tenant:bootstrap

db-backup: ## Trigger a Render-style DB backup script
	$(COMPOSE) exec backend npm run backup:db

tools: ## Start Mongo Express (profile: tools)
	$(COMPOSE) --profile tools up -d mongo-express
