# Landing — 0mega.pp.ua

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

## Структура сайту

Односторінковий застосунок із hash-роутингом (без залежностей на роутер):

| Маршрут | Що показує |
|---|---|
| `#/` | обкладинка: ім'я, роль, три напрямки, швидкі посилання |
| `#/work` | горизонтальна галерея проєктів |
| `#/work/<id>` | повноекранна картка проєкту (Esc — назад, ← → — гортати) |
| `#/stack` | технології за групами |
| `#/services` | прайс і модель співпраці |
| `#/about` | напрямки, суміжні області, досвід |
| `#/connect` | контакти та спільнота |

Мова перемикається кнопкою UA/EN, вибір зберігається в `localStorage`.

## Як влаштовано

```
web/                     React SPA
  src/App.tsx            роутер, сторінки, деталі проєкту
  src/styles.css         дизайн-система (моно, чорний фон, акценти по секціях)
  src/fallback.ts        офлайн-копія (ім'я, роль, контакти)
  public/avatar.jpg       аватар локально, без зовнішніх запитів
api/
  src/server.js          Express: /api/profile, /api/health, роздача SPA
  src/db.js              Mongoose-моделі, підключення, версійний сід
  data/profile.json      джерело правди для контенту
Dockerfile               multi-stage: build React → runtime Node
docker-compose.yml       app + mongo, мережа web (для Caddy)
```

Особливості:

- `/api/profile` віддає документ із MongoDB. Якщо база недоступна — сторінка
  рендериться з `data/profile.json` (мінімальна копія у фронтенді), 500 назовні
  не вилітає.
- Поки відповідь не прийшла, показується екран `initialising` — щоб ніколи не
  показати «0 проєктів» через повільну мережу. Таймаут — 4 с, далі офлайн-режим.
- **Версійний сід:** у `profile.json` є поле `version`. Якщо воно відрізняється
  від збереженого в Mongo — документ перезаписується при старті. Змінив текст →
  підняв `version` → задеплоїв.
- Лічильник переглядів (`stats.visits`) інкрементується раз на IP за 6 годин,
  мапа в пам'яті обмежена 5000 записами.
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

Публічні адреси на VPS `0mega`:

| Домен | Що віддає |
|---|---|
| `0mega.pp.ua` | цей лендінг (`landing:3000`) |
| `0mega.pp.ua/<token>` | сумісність: старі публічні посилання на рахунки → `rahunoktest:4000` |
| `r.0mega.pp.ua`, `omegasmp.pp.ua`, `k.ipit.ooo` | застосунок «Рахунки» (`rahunoktest:4000`) |

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

Оновлення контенту: правиш `api/data/profile.json`, піднімаєш `version`,
`rsync` + `docker compose up -d --build`. Документ у Mongo перезапишеться
автоматично (див. «Версійний сід» вище).

## Безпека

- Контейнер застосунку: non-root (`USER node`), `read_only`, `tmpfs /tmp`,
  `cap_drop: ALL`, `no-new-privileges`.
- MongoDB не має опублікованих портів і живе лише в `internal`-мережі.
- Назовні дивиться тільки Caddy (80/443).
- CSP без `unsafe-eval`, `frame-ancestors 'none'`, `form-action 'none'`.
- Секретів у репозиторії немає: усе, що потрібно, — `MONGO_URL` у compose.
