# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      font-noto-cjk \
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/downloads

ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV NODE_OPTIONS="--max-old-space-size=256"

EXPOSE 3000
CMD ["node", "dist/main"]
