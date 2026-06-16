SHELL := /bin/sh

BUN ?= bun
NODE ?= node

.DEFAULT_GOAL := help

.PHONY: help install dev start build test lint lint-fix typecheck check clean run-dist

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make <target>\n\nTargets:\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	$(BUN) install

dev: ## Run the CLI in watch mode
	$(BUN) run dev

start: ## Run the CLI from TypeScript
	$(BUN) run start

build: ## Build the bundled Node.js executable
	$(BUN) run build

test: ## Run tests
	$(BUN) run test

lint: ## Run Biome checks
	$(BUN) run lint

lint-fix: ## Run Biome checks and write fixes
	$(BUN) run lint:fix

typecheck: ## Run TypeScript type checks
	$(BUN) run typecheck

check: lint typecheck test ## Run lint, typecheck, and tests

run-dist: build ## Build and run the bundled CLI
	$(NODE) dist/addx.js

clean: ## Remove build output
	rm -rf dist
