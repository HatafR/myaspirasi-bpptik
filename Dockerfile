# 1. PERBAIKAN: Install OpenSSL di stage base agar diwarisi oleh stage runner
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl libc6-dev && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
# 2. PERBAIKAN: build-essential tetap di sini karena hanya butuh saat install native modules, tidak butuh di production
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
COPY prisma ./prisma/
# Explicitly install the GNU/Linux binary for lightningcss (Next.js/Tailwind 4 requirement)
RUN npm install lightningcss-linux-x64-gnu
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build-time environment variables for Next.js frontend
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY

ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -m nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache and entire app directory
RUN mkdir .next
RUN chown -R nextjs:nodejs /app

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

USER nextjs
RUN npm install prisma

RUN mkdir -p /app/node_modules/dotenv && \
    echo "module.exports = {};" > /app/node_modules/dotenv/config.js && \
    echo '{"name":"dotenv","main":"config.js"}' > /app/node_modules/dotenv/package.json

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 3. PERBAIKAN: Tambahkan --accept-data-loss pada db push
# Mencegah container hang/stuck jika Prisma meminta konfirmasi (y/N) saat ada perubahan skema
# (Hanya ubah baris paling bawah ini di Dockerfile Anda)
# Hapus CMD yang lama, ganti dengan ini:
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]