# Development commands
.PHONY: dev
dev: ## Start development environment
	docker-compose -f docker-compose.prod.yaml run -d -p 5432:5432 postgres
	@echo "Development database started on port 5432"
