.PHONY: help dev build lint typecheck test clean db-up db-down db-reset seed studio

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Development ───────────────────────────────────────────────
dev: ## Start all services in dev mode
	npm run dev

build: ## Build all packages for production
	npm run build

lint: ## Lint all packages
	npm run lint

typecheck: ## Typecheck all packages
	npm run typecheck

test: ## Run all tests
	npm run test

clean: ## Remove all build artifacts
	npm run clean

# ── Database ──────────────────────────────────────────────────
db-up: ## Start local Docker services (postgres, redis, mailhog)
	docker compose up -d
	@echo "Waiting for PostgreSQL..."
	@sleep 3

db-down: ## Stop local Docker services
	docker compose down

db-reset: ## Drop + recreate database, run migrations
	cd apps/api && npx prisma migrate reset --force

db-migrate: ## Run pending migrations
	cd apps/api && npx prisma migrate dev

seed: ## Seed database with demo data
	cd apps/api && npm run db:seed

studio: ## Open Prisma Studio
	cd apps/api && npx prisma studio

# ── First-time setup ──────────────────────────────────────────
setup: ## Full first-time setup
	@echo "1. Installing dependencies..."
	npm install
	@echo "2. Starting Docker services..."
	$(MAKE) db-up
	@echo "3. Running migrations..."
	$(MAKE) db-migrate
	@echo "4. Seeding database..."
	$(MAKE) seed
	@echo "✅ Setup complete! Run 'make dev' to start."
