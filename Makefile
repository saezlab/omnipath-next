# Development commands
.PHONY: dev
dev: ## Start development environment
	docker-compose -f docker-compose.yaml run -d -p 5432:5432 omnipath-next-postgres
	@echo "Development database started on port 5432"
