import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import rateLimit from 'express-rate-limit';

import {
  bumpCounter,
  connect,
  disconnect,
  isConnected,
  readCounter,
  readProfile,
  seedProfile,
} from './db.js';
import { loadProfileFile } from './profileFile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT ?? 3000);
const MONGO_URL = process.env.MONGO_URL ?? '';

const VIEW_WINDOW_MS = 6 * 60 * 60 * 1000;
const VIEW_CACHE_LIMIT = 5000;

/** Loaded at boot; keeps the API useful when MongoDB is unreachable. */
let fallbackProfile = {};

/** ip -> timestamp of the last counted visit. Bounded to keep memory flat. */
const countedViews = new Map();

function shouldCountView(ip) {
  const now = Date.now();
  const last = countedViews.get(ip);
  if (last && now - last < VIEW_WINDOW_MS) return false;

  if (countedViews.size >= VIEW_CACHE_LIMIT) {
    for (const [key, stamp] of countedViews) {
      if (now - stamp >= VIEW_WINDOW_MS) countedViews.delete(key);
    }
    if (countedViews.size >= VIEW_CACHE_LIMIT) countedViews.clear();
  }

  countedViews.set(ip, now);
  return true;
}

const app = express();

// Behind Caddy: required so rate limiting and logs see the real client IP.
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', db: isConnected() ? 'up' : 'down' });
});

app.get('/api/profile', apiLimiter, async (req, res, next) => {
  try {
    const document = (await readProfile()) ?? fallbackProfile;
    let views = null;

    if (shouldCountView(req.ip)) {
      views = await bumpCounter('visits');
    }

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ ...document, views: views ?? (await readCounter('visits')) });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Static SPA: hashed assets are immutable, HTML is always revalidated.
app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Never leak stack traces or driver details to the client.
app.use((error, _req, res, _next) => {
  console.error('[api]', error?.message ?? error);
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal_error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[http] listening on :${PORT}`);
});

async function bootstrap() {
  fallbackProfile = await loadProfileFile();
  const ok = await connect(MONGO_URL);
  if (ok) {
    await seedProfile(fallbackProfile);
  }
}

bootstrap().catch((error) => {
  console.error('[boot]', error.message);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[http] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnect().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
