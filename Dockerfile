# Base image with OpenSSL (required by Prisma on Debian slim)
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl libc6-dev && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
COPY prisma.config.cjs ./
RUN npm install lightningcss-linux-x64-gnu
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY

ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Bundle modul yang dibutuhkan `prisma db seed` (di luar Next.js standalone trace)
RUN mkdir -p /app/seed-bundle/node_modules && \
    cd /app && \
    npm ls @prisma/adapter-pg pg bcrypt --all --parseable 2>/dev/null | sort -u | while IFS= read -r pkgdir; do \
      rel="${pkgdir#/app/node_modules/}"; \
      mkdir -p "/app/seed-bundle/node_modules/$(dirname "$rel")"; \
      cp -rL "$pkgdir" "/app/seed-bundle/node_modules/$rel"; \
    done

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 -m nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p private_uploads && chown -R nextjs:nodejs private_uploads

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.cjs ./

# Modul untuk prisma db seed (@prisma/adapter-pg, pg, bcrypt, dll.)
COPY --from=builder /app/seed-bundle/node_modules/. ./node_modules/
RUN chown -R nextjs:nodejs /app/node_modules

# Prisma CLI + WASM — satu instalasi global, terpisah dari node_modules standalone
RUN PRISMA_VERSION="$(node -p "require('@prisma/client/package.json').version")" \
  && npm install -g "prisma@${PRISMA_VERSION}"

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
