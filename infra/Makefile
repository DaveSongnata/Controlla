SHELL := /bin/bash
COMPOSE := docker compose --env-file .env -f docker-compose.yml

.PHONY: up down restart logs ps build rebuild migrate fresh seed shell-backend shell-frontend psql clean

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) build --no-cache

migrate:
	$(COMPOSE) exec app node ace migration:run

fresh:
	$(COMPOSE) exec app node ace migration:fresh --seed

seed:
	$(COMPOSE) exec app node ace db:seed

shell:
	$(COMPOSE) exec app sh

psql:
	$(COMPOSE) exec postgres psql -U $${DB_USER:-controlla} -d $${DB_DATABASE:-controlla}

clean:
	$(COMPOSE) down -v
