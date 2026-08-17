SHELL := /bin/sh

HOST ?= 127.0.0.1
PORT ?= 8989
RUN_DIR := .run
PID_FILE := $(RUN_DIR)/blog.pid
LOG_FILE := $(RUN_DIR)/blog.log
VITE := ./node_modules/.bin/vite
NPM ?= npm

.PHONY: help install build start stop restart status logs

help:
	@printf '%s\n' \
		'make install  Install dependencies' \
		'make build    Build the static blog' \
		'make start    Build and start the server in the background' \
		'make stop     Stop the background server' \
		'make restart  Rebuild and restart the server' \
		'make status   Show whether the server is running' \
		'make logs     Follow the server log'

install:
	$(NPM) ci

build:
	$(NPM) run build

start:
	@mkdir -p "$(RUN_DIR)"
	@if [ -f "$(PID_FILE)" ]; then \
		pid=$$(cat "$(PID_FILE)"); \
		if kill -0 "$$pid" 2>/dev/null; then \
			echo "Blog is already running (PID $$pid)."; \
			exit 1; \
		fi; \
		rm -f "$(PID_FILE)"; \
	fi
	@if command -v lsof >/dev/null 2>&1 && \
		lsof -nP -iTCP:"$(PORT)" -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "Port $(PORT) is already in use; the blog was not started."; \
		exit 1; \
	elif ! command -v lsof >/dev/null 2>&1 && command -v nc >/dev/null 2>&1 && \
		nc -z 127.0.0.1 "$(PORT)" >/dev/null 2>&1; then \
		echo "Port $(PORT) is already in use; the blog was not started."; \
		exit 1; \
	fi
	@$(MAKE) --no-print-directory build
	@nohup "$(VITE)" preview --host "$(HOST)" --port "$(PORT)" > "$(LOG_FILE)" 2>&1 & echo $$! > "$(PID_FILE)"
	@sleep 1; \
	i=0; \
	while [ $$i -lt 15 ]; do \
		pid=$$(cat "$(PID_FILE)"); \
		if ! kill -0 "$$pid" 2>/dev/null; then \
			echo 'Server failed to start:'; \
			cat "$(LOG_FILE)"; \
			rm -f "$(PID_FILE)"; \
			exit 1; \
		fi; \
		if curl -fsS "http://127.0.0.1:$(PORT)/" >/dev/null 2>&1; then \
			echo "Blog started at http://$(HOST):$(PORT) (PID $$pid)."; \
			exit 0; \
		fi; \
		i=$$((i + 1)); \
		sleep 1; \
	done; \
	echo "Server did not become ready; see $(LOG_FILE)."; \
	exit 1

stop:
	@if [ ! -f "$(PID_FILE)" ]; then \
		echo 'Blog is not running.'; \
		exit 0; \
	fi; \
	pid=$$(cat "$(PID_FILE)"); \
	if kill -0 "$$pid" 2>/dev/null; then \
		kill "$$pid"; \
		i=0; \
		while kill -0 "$$pid" 2>/dev/null && [ $$i -lt 10 ]; do \
			i=$$((i + 1)); \
			sleep 1; \
		done; \
		if kill -0 "$$pid" 2>/dev/null; then \
			echo "Could not stop PID $$pid; check it manually."; \
			exit 1; \
		fi; \
		echo "Blog stopped (PID $$pid)."; \
	else \
		echo 'Removed a stale PID file.'; \
	fi; \
	rm -f "$(PID_FILE)"

restart: stop
	@$(MAKE) --no-print-directory start

status:
	@if [ -f "$(PID_FILE)" ]; then \
		pid=$$(cat "$(PID_FILE)"); \
		if kill -0 "$$pid" 2>/dev/null; then \
			echo "Blog is running at http://$(HOST):$(PORT) (PID $$pid)."; \
			exit 0; \
		fi; \
	fi; \
	echo 'Blog is not running.'; \
	exit 1

logs:
	@mkdir -p "$(RUN_DIR)"
	@touch "$(LOG_FILE)"
	tail -f "$(LOG_FILE)"
