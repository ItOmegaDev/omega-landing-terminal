# ---- stage 1: build the React bundle ----
FROM node:22-alpine AS web

WORKDIR /app
# Bundled content copy so the first paint is never empty.
COPY api/data ./api/data
COPY web/package.json web/package-lock.json ./web/
RUN cd web && npm ci --no-audit --no-fund

COPY web/ ./web
RUN cd web && npm run build

# ---- stage 2: runtime image ----
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY api/src ./src
COPY api/data ./data
COPY --from=web /app/web/dist ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
