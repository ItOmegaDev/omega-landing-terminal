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

## Як працює сайт

Це термінал, а не звичайна сторінка: навігація — командами.

| Команда | Що робить |
|---|---|
| `help` | список команд |
| `work` | обрані проєкти |
| `open <n>` | деталі проєкту за номером |
| `stack` | технології |
| `services` | послуги та ціни |
| `about` | напрямки, суміжні області, досвід |
| `contact` | контакти |
| `whoami` | коротка ідентичність |
| `lang uk\|en` | мова (або кнопка `UA`/`EN` у заголовку вікна) |
| `clear` | очистити екран |

Дрібниці, які роблять його схожим на справжній shell:

- `↑` / `↓` — історія команд, `Tab` — автодоповнення.
- Deep links: `#/work`, `#/open/2`, `#/services` виконують команду одразу.
- Вивід минулих команд перемальовується при зміні мови.
- `sudo` відповідає жартом, а не помилкою.

## Як влаштовано

```
web/                     React SPA
  src/App.tsx            термінал: команди, вивід, історія, deep links
  src/styles.css         оформлення консолі
  src/fallback.ts        імпорт api/data/profile.json у бандл
  public/avatar.jpg       аватар локально, без зовнішніх запитів
api/
  src/server.js          Express: /api/profile, /api/health, роздача SPA
  src/db.js              Mongoose-моделі, підключення, версійний сід
  data/profile.json      джерело правди для контенту
Dockerfile               multi-stage: build React → runtime Node
docker-compose.yml       app + mongo, мережа web (для Caddy)
```

Особливості:

- Контент вбудовується у фронтенд-бандл при збірці (`import ... from
  '../../api/data/profile.json'`), тому перший кадр завжди повний — без
  «порожніх» станів і без спалаху.
- `/api/profile` віддає документ із MongoDB і оновлює сторінку в фоні. Якщо база
  недоступна — лишається вбудована копія, 500 назовні не вилітає.
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
