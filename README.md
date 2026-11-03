# Omega — Landing

Personal site of **Omega (`ItOmegaDev`)** — Software Engineer, Full-Stack & Infrastructure.
The current version is an interactive terminal; a simpler page is planned on the `simple` branch.

**Live:** https://0mega.pp.ua

---

## What it is

A terminal-style portfolio. Instead of pages and cards, the visitor gets a shell:

```
omega@0mega:~$ work
selected projects — 6

 01  ControlPanel    SaaS / hosting panel       2026
 02  EdgeProxy       Networking / proxy         2026
 03  OmegaSMP        Game infrastructure        2025—2026
 04  DiscordAuth     Java plugins               2025—2026
 05  OmegaOS         Experiment                 2026
 06  Нитка           E-commerce                 2025
```

### Commands

| Command | Description |
| --- | --- |
| `help` | list commands |
| `work` | selected projects |
| `open <n>` | project details by number |
| `stack` | technologies |
| `services` | services and pricing |
| `about` | directions, adjacent areas, experience |
| `contact` | links |
| `whoami` | short identity |
| `lang uk\|en` | switch language (or the `UA`/`EN` button) |
| `clear` | clear the screen |

Shell behaviour: `↑` / `↓` command history, `Tab` completion, `Esc` not needed anywhere,
deep links (`#/work`, `#/open/2`, `#/services`) run the command on load, and every previous
output block is re-rendered when the language changes.

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js 22, Express 4, Mongoose 8 |
| Database | MongoDB 7 (container, no published ports) |
| Proxy | Caddy 2 (Let's Encrypt TLS, HSTS, CSP) |
| Deploy | Docker Compose on Ubuntu 24.04 |

Page weight: ~87 KB gzipped in 3 requests, zero external fonts, analytics or CDNs.
Two runtime dependencies (`react`, `react-dom`).

---

## Architecture

```
web/                     React SPA
  src/App.tsx            terminal: commands, output, history, deep links
  src/styles.css         console styling
  src/fallback.ts        imports api/data/profile.json into the bundle
  public/avatar.jpg      avatar (local file, no external requests)
api/
  src/server.js          Express: /api/profile, /api/health, serves the SPA
  src/db.js              Mongoose models, connection, versioned seeding
  data/profile.json      single source of truth for content
Dockerfile               multi-stage: build React → Node runtime
docker-compose.yml       app + mongo, shares the `web` network with Caddy
deploy/Caddyfile.snippet site block for the edge proxy
```

Notes:

- Content is bundled at build time (`import ... from '../../api/data/profile.json'`), so the
  first paint is always complete — no empty states, no flash. `/api/profile` refreshes it at
  runtime; MongoDB remains the source of truth.
- If the database is unavailable the site keeps working from the bundled copy and never
  returns a 500 to the visitor.
- **Versioned seeding:** `profile.json` carries a `version`. When it differs from the stored
  document, MongoDB is updated on boot. Bump the version after editing content.

---

## Local development

```bash
# terminal 1 — API (works without MongoDB, reads the bundled file)
cd api && npm install && PORT=3000 npm run dev

# terminal 2 — frontend with /api proxied
cd web && npm install && npm run dev   # http://127.0.0.1:5173
```

Type check and production build:

```bash
cd web && npm run build      # tsc --noEmit + vite build
```

---

## Deployment

```bash
rsync -az -e ssh --exclude node_modules --exclude dist --exclude .git \
  ./ 0mega:~/apps/landing/

ssh 0mega 'cd ~/apps/landing && docker compose up -d --build'
ssh 0mega 'docker exec caddy caddy reload --config /etc/caddy/Caddyfile'
```

Public hosts on that server:

| Host | Serves |
| --- | --- |
| `0mega.pp.ua` | this landing (`landing:3000`) |
| `0mega.pp.ua/<token>` | compatibility route: old public invoice links → `rahunoktest:4000` |
| `r.0mega.pp.ua`, `omegasmp.pp.ua`, `k.ipit.ooo` | the "Rahunok" application (`rahunoktest:4000`) |

### Operations

```bash
ssh 0mega 'docker compose -f ~/apps/landing/docker-compose.yml ps'
ssh 0mega 'docker logs landing --tail 50'
ssh 0mega 'docker exec landing-db mongosh landing --quiet --eval "db.stats().ok"'
```

Backup:

```bash
ssh 0mega 'docker exec landing-db mongodump --db landing --archive' > landing-$(date +%F).archive
```

---

## Security

- Application container: non-root (`USER node`), `read_only`, `tmpfs /tmp`, `cap_drop: ALL`,
  `no-new-privileges`.
- MongoDB publishes no ports and lives only on the internal network.
- Only Caddy is exposed (80/443).
- CSP without `unsafe-eval`, `frame-ancestors 'none'`, `form-action 'none'`, plus HSTS and nosniff.
- No secrets in the repository; the only configuration is `MONGO_URL` in Compose.
- `/api/*` is rate limited (90 requests per minute per IP).

---

## Roadmap

- [ ] `simple` branch — a conventional landing page (hero, services, projects, contacts)
- [ ] Screenshots or previews for the strongest projects
- [ ] `og:image` generated at build time instead of reusing the avatar

## License

All rights reserved. Contact the author before reusing the content.
