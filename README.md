# Landing — l.0mega.pp.ua

Особиста візитка Omega (ItOmegaDev): MERN-застосунок, який одночасно є
портфоліо і демонстрацією стеку.

## Стек

| Шар | Технології |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js 22, Express 4, Mongoose 8 |
| База | MongoDB 7 (контейнер, без публікації портів) |
| Проксі | Caddy 2 (TLS Let's Encrypt, HSTS, CSP) |
| Деплой | Docker Compose на Ubuntu 24.04 |

## Як влаштовано

```
web/                  React SPA (UA/EN перемикач, темна тема)
  src/App.tsx         вся сторінка
  src/styles.css      дизайн
  public/avatar.jpg   аватар (локальний файл, без зовнішніх запитів)
api/
  src/server.js       Express: /api/profile, /api/health, роздача SPA
  src/db.js           Mongoose-моделі, підключення, лічильник переглядів
  data/profile.json   джерело правди; сідиться в Mongo при старті
Dockerfile            multi-stage: build React → runtime Node
docker-compose.yml    app + mongo, мережа web (для Caddy)
```

Особливості:

- `/api/profile` віддає вміст із MongoDB. Якщо база недоступна — та сама
  сторінка рендериться з `data/profile.json` + мінімальної копії у фронтенді,
  тому 500 назовні не вилітає.
- Лічильник переглядів (`stats.visits`) інкрементується один раз на IP за 6
  годин, мапа в пам'яті обмежена 5000 записами.
- `/api/*` обмежено 90 запитами на хвилину з IP.

## Локальна розробка

```bash
# термінал 1 — API (без Mongo працює на файлі)
cd api && npm install && PORT=3000 npm run dev

# термінал 2 — фронтенд з проксі на /api
cd web && npm install && npm run dev   # http://127.0.0.1:5173
```

Перевірка типів і збірка:

```bash
cd web && npm run build      # tsc --noEmit + vite build
```

## Деплой

```bash
rsync -az -e ssh --exclude node_modules --exclude dist --exclude .git \
  ./ 0mega:~/apps/landing/

ssh 0mega 'cd ~/apps/landing && docker compose up -d --build'
ssh 0mega 'docker exec caddy caddy reload --config /etc/caddy/Caddyfile'
```

Caddy-блок лежить у `deploy/Caddyfile.snippet` і вже доданий у
`~/apps/caddy/Caddyfile` на сервері.

## Експлуатація

```bash
ssh 0mega 'docker compose -f ~/apps/landing/docker-compose.yml ps'
ssh 0mega 'docker logs landing --tail 50'
ssh 0mega 'docker exec landing-db mongosh landing --quiet --eval "db.stats().ok"'
```

Бекап бази:

```bash
ssh 0mega 'docker exec landing-db mongodump --db landing --archive' > landing-$(date +%F).archive
```

Оновлення контенту — правити `api/data/profile.json`, потім `rsync` + rebuild.
Сід виконується через `$setOnInsert`, тому вже наявний документ у Mongo не
перезаписується: для зміни тексту оновіть документ напряму або видаліть
колекцію `profile` перед рестартом.

## Безпека

- Контейнер застосунку: non-root (`USER node`), `read_only`, `tmpfs /tmp`,
  `cap_drop: ALL`, `no-new-privileges`.
- MongoDB не має опублікованих портів і живе лише в `internal`-мережі.
- Назовні дивиться тільки Caddy (80/443).
- CSP без `unsafe-eval`, `frame-ancestors 'none'`, `form-action 'none'`.
- Секретів у репозиторії немає: усе, що потрібно, — `MONGO_URL` у compose.
