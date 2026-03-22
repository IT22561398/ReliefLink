# ReliefLink Platform Makefile

.PHONY: help install dev build test clean docker-up docker-down lint setup

# Default target
help:
	@echo "ReliefLink Platform Commands:"
	@echo ""
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build all packages and services"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linting"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make setup        - Full development setup"
	@echo ""

# Install dependencies
install:
	pnpm install

# Start development
dev:
	pnpm dev

# Build everything
build:
	pnpm build

# Build only packages
build-packages:
	pnpm build:packages

# Build only services
build-services:
	pnpm build:services

# Run tests
test:
	pnpm test

# Run unit tests
test-unit:
	pnpm test:unit

# Run integration tests
test-integration:
	pnpm test:integration

# Lint code
lint:
	pnpm lint

# Fix linting issues
lint-fix:
	pnpm lint:fix

# Type check
typecheck:
	pnpm typecheck

# Clean build artifacts
clean:
	pnpm clean

# Start Docker containers
docker-up:
	docker compose -f infrastructure/docker/docker-compose.yml up -d

# Stop Docker containers
docker-down:
	docker compose -f infrastructure/docker/docker-compose.yml down

# View Docker logs
docker-logs:
	docker compose -f infrastructure/docker/docker-compose.yml logs -f

# Database migrations
db-migrate:
	pnpm db:migrate

# Generate Prisma client
db-generate:
	pnpm db:generate

# Push schema to database
db-push:
	pnpm db:push

# Full setup
setup:
	@echo "🚀 Setting up ReliefLink..."
	@make install
	@make docker-up
	@sleep 5
	@make build-packages
	@make db-generate
	@make db-push
	@echo "✅ Setup complete! Run 'make dev' to start development."
