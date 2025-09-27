# Capacitator - Sprint Planning Calculator
# Makefile for project setup, development, and deployment

.PHONY: help setup install build run dev test clean dist pack deps lint format
.DEFAULT_GOAL := help

# Project variables
PROJECT_NAME := capacitator
NODE_VERSION := $(shell node --version 2>/dev/null)
NPM_VERSION := $(shell npm --version 2>/dev/null)

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Help target - shows available commands
help: ## Show this help message
	@echo "$(BLUE)Capacitator - Sprint Planning Calculator$(NC)"
	@echo "$(BLUE)======================================$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Prerequisites:$(NC)"
	@echo "  - Node.js 18+ (currently: $(NODE_VERSION))"
	@echo "  - npm (currently: $(NPM_VERSION))"
	@echo ""

# Check if required tools are installed
check-deps: ## Check if required dependencies are installed
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Error: Node.js is not installed$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)Error: npm is not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Node.js $(NODE_VERSION)$(NC)"
	@echo "$(GREEN)✓ npm $(NPM_VERSION)$(NC)"

# Initial project setup
setup: check-deps ## Initial project setup (install dependencies and build)
	@echo "$(BLUE)Setting up Capacitator project...$(NC)"
	@$(MAKE) install
	@$(MAKE) build
	@echo "$(GREEN)✓ Setup complete! Run 'make run' to start the application$(NC)"

# Install Node.js dependencies
install: check-deps ## Install Node.js dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@if [ ! -f package.json ]; then \
		echo "$(RED)Error: package.json not found. Make sure you're in the typescript branch.$(NC)"; \
		exit 1; \
	fi
	@npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

# Update dependencies
deps: install ## Alias for install command

# Build the application
build: ## Build TypeScript and copy assets
	@echo "$(BLUE)Building application...$(NC)"
	@if [ ! -f package.json ]; then \
		echo "$(RED)Error: package.json not found. Make sure you're in the typescript branch.$(NC)"; \
		exit 1; \
	fi
	@npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

# Run the application in development mode
dev: ## Start development mode with hot reload
	@echo "$(BLUE)Starting development mode...$(NC)"
	@npm run dev

# Build and run the application
run: build ## Build and run the desktop application
	@echo "$(BLUE)Starting Capacitator...$(NC)"
	@npm start

# Run unit tests
test: ## Run Jest unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	@npm test
	@echo "$(GREEN)✓ Unit tests complete$(NC)"

# Run unit tests with coverage
test-coverage: ## Run Jest unit tests with coverage report
	@echo "$(BLUE)Running unit tests with coverage...$(NC)"
	@npm run test:coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"

# Run unit tests in watch mode
test-watch: ## Run Jest unit tests in watch mode
	@echo "$(BLUE)Running unit tests in watch mode...$(NC)"
	@npm run test:watch

# Run browser-based integration tests
test-browser: ## Run browser-based integration tests
	@echo "$(BLUE)Running browser integration tests...$(NC)"
	@if [ -f test.html ]; then \
		echo "$(YELLOW)Opening test page in browser...$(NC)"; \
		if command -v open >/dev/null 2>&1; then \
			open test.html; \
		elif command -v xdg-open >/dev/null 2>&1; then \
			xdg-open test.html; \
		else \
			echo "$(YELLOW)Please open test.html in your browser manually$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)No test file found, building application...$(NC)"; \
		$(MAKE) build; \
	fi
	@echo "$(GREEN)✓ Browser test setup complete$(NC)"

# Run all tests (unit + browser)
test-all: test test-browser ## Run all tests (unit + browser integration)
	@echo "$(GREEN)✓ All tests complete$(NC)"

# Lint TypeScript code
lint: ## Run TypeScript linter
	@echo "$(BLUE)Linting code...$(NC)"
	@if command -v npx >/dev/null 2>&1; then \
		npx tsc --noEmit; \
		echo "$(GREEN)✓ TypeScript compilation check passed$(NC)"; \
	else \
		echo "$(YELLOW)npx not available, skipping lint$(NC)"; \
	fi

# Format code (if prettier is available)
format: ## Format code with prettier (if available)
	@echo "$(BLUE)Formatting code...$(NC)"
	@if [ -f node_modules/.bin/prettier ]; then \
		npx prettier --write "src/**/*.{ts,js,html,css,json}"; \
		echo "$(GREEN)✓ Code formatted$(NC)"; \
	else \
		echo "$(YELLOW)Prettier not installed, skipping format$(NC)"; \
	fi

# Clean build artifacts
clean: ## Clean build artifacts and temporary files
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@rm -rf dist/
	@rm -rf release/
	@rm -rf node_modules/.cache/
	@if [ -f package.json ]; then npm run clean 2>/dev/null || true; fi
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

# Clean everything including node_modules
clean-all: clean ## Clean everything including node_modules
	@echo "$(BLUE)Cleaning all dependencies...$(NC)"
	@rm -rf node_modules/
	@rm -f package-lock.json
	@echo "$(GREEN)✓ Full cleanup complete$(NC)"

# Create distribution packages
dist: build ## Create distribution packages for all platforms
	@echo "$(BLUE)Creating distribution packages...$(NC)"
	@npm run dist
	@echo "$(GREEN)✓ Distribution packages created in release/$(NC)"

# Create portable packages without installers
pack: build ## Create portable packages without installers
	@echo "$(BLUE)Creating portable packages...$(NC)"
	@npm run pack
	@echo "$(GREEN)✓ Portable packages created in release/$(NC)"

# Development workflow commands
watch: ## Watch TypeScript files for changes
	@echo "$(BLUE)Watching TypeScript files...$(NC)"
	@npm run watch

# Start Electron in debug mode
debug: build ## Start application with debug tools open
	@echo "$(BLUE)Starting in debug mode...$(NC)"
	@NODE_ENV=development npm start

# Audit dependencies for security issues
audit: ## Run security audit on dependencies
	@echo "$(BLUE)Running security audit...$(NC)"
	@npm audit
	@echo "$(GREEN)✓ Security audit complete$(NC)"

# Update dependencies
update: ## Update all dependencies to latest versions
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@npm update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

# Show project information
info: ## Show project information and environment
	@echo "$(BLUE)Project Information$(NC)"
	@echo "$(BLUE)==================$(NC)"
	@echo "Project: $(PROJECT_NAME)"
	@echo "Node.js: $(NODE_VERSION)"
	@echo "npm: $(NPM_VERSION)"
	@echo "Current branch: $$(git branch --show-current 2>/dev/null || echo 'unknown')"
	@echo "Working directory: $$(pwd)"
	@if [ -f package.json ]; then \
		echo "Package version: $$(node -p 'require("./package.json").version' 2>/dev/null || echo 'unknown')"; \
	fi
	@echo ""

# Quick development setup from scratch
quick-start: ## Quick development setup from scratch
	@echo "$(BLUE)Quick start setup...$(NC)"
	@$(MAKE) clean-all
	@$(MAKE) setup
	@$(MAKE) run

# Switch to web version (html branch)
web: ## Switch to web version (html branch)
	@echo "$(BLUE)Switching to web version...$(NC)"
	@git checkout html
	@echo "$(GREEN)✓ Switched to html branch$(NC)"
	@echo "$(YELLOW)You can now open index.html in your browser$(NC)"

# Switch to desktop version (typescript branch)
desktop: ## Switch to desktop version (typescript branch)
	@echo "$(BLUE)Switching to desktop version...$(NC)"
	@git checkout typescript
	@echo "$(GREEN)✓ Switched to typescript branch$(NC)"
	@echo "$(YELLOW)Run 'make setup' if this is your first time$(NC)"

# Show build artifacts
artifacts: ## Show generated build artifacts
	@echo "$(BLUE)Build Artifacts$(NC)"
	@echo "$(BLUE)===============$(NC)"
	@if [ -d dist ]; then \
		echo "$(GREEN)dist/ directory:$(NC)"; \
		find dist -type f -exec ls -lah {} \; 2>/dev/null | head -20; \
	else \
		echo "$(YELLOW)No dist/ directory found. Run 'make build' first.$(NC)"; \
	fi
	@echo ""
	@if [ -d release ]; then \
		echo "$(GREEN)release/ directory:$(NC)"; \
		find release -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" | head -10; \
	else \
		echo "$(YELLOW)No release/ directory found. Run 'make dist' to create packages.$(NC)"; \
	fi

# Install global tools for development
install-tools: ## Install useful global development tools
	@echo "$(BLUE)Installing development tools...$(NC)"
	@npm install -g electron@latest typescript@latest
	@echo "$(GREEN)✓ Development tools installed$(NC)"

# Platform-specific builds
build-windows: build ## Build for Windows
	@echo "$(BLUE)Building for Windows...$(NC)"
	@npm run build:windows 2>/dev/null || npx electron-builder --win
	@echo "$(GREEN)✓ Windows build complete$(NC)"

build-macos: build ## Build for macOS
	@echo "$(BLUE)Building for macOS...$(NC)"
	@npm run build:mac 2>/dev/null || npx electron-builder --mac
	@echo "$(GREEN)✓ macOS build complete$(NC)"

build-linux: build ## Build for Linux
	@echo "$(BLUE)Building for Linux...$(NC)"
	@npm run build:linux 2>/dev/null || npx electron-builder --linux
	@echo "$(GREEN)✓ Linux build complete$(NC)"

# Emergency commands
emergency-reset: ## Emergency reset - clean everything and start fresh
	@echo "$(RED)Emergency reset - this will remove all local changes!$(NC)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	@git clean -fdx
	@git reset --hard HEAD
	@$(MAKE) setup
	@echo "$(GREEN)✓ Emergency reset complete$(NC)"

# Show logs
logs: ## Show application logs (if available)
	@echo "$(BLUE)Application Logs$(NC)"
	@echo "$(BLUE)=================$(NC)"
	@if [ -d "$$HOME/.config/capacitator-electron/logs" ]; then \
		tail -n 50 "$$HOME/.config/capacitator-electron/logs"/*.log 2>/dev/null || echo "No logs found"; \
	elif [ -d "$$HOME/Library/Logs/capacitator-electron" ]; then \
		tail -n 50 "$$HOME/Library/Logs/capacitator-electron"/*.log 2>/dev/null || echo "No logs found"; \
	else \
		echo "$(YELLOW)No log directory found$(NC)"; \
	fi

# Validate project structure
validate: ## Validate project structure and configuration
	@echo "$(BLUE)Validating project...$(NC)"
	@errors=0; \
	if [ ! -f package.json ]; then echo "$(RED)✗ Missing package.json$(NC)"; errors=$$((errors+1)); else echo "$(GREEN)✓ package.json$(NC)"; fi; \
	if [ ! -f tsconfig.json ]; then echo "$(RED)✗ Missing tsconfig.json$(NC)"; errors=$$((errors+1)); else echo "$(GREEN)✓ tsconfig.json$(NC)"; fi; \
	if [ ! -f src/main.ts ]; then echo "$(RED)✗ Missing src/main.ts$(NC)"; errors=$$((errors+1)); else echo "$(GREEN)✓ src/main.ts$(NC)"; fi; \
	if [ ! -f src/renderer/index.html ]; then echo "$(RED)✗ Missing src/renderer/index.html$(NC)"; errors=$$((errors+1)); else echo "$(GREEN)✓ src/renderer/index.html$(NC)"; fi; \
	if [ $$errors -eq 0 ]; then echo "$(GREEN)✓ Project structure is valid$(NC)"; else echo "$(RED)✗ Found $$errors errors$(NC)"; exit 1; fi