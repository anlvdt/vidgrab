FROM node:22-alpine AS base
RUN apk add --no-cache python3 py3-pip ffmpeg curl \
    && pip3 install --break-system-packages yt-dlp yt-dlp-ejs

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

# yt-dlp needs write access for pip self-update
RUN chown -R nextjs:nodejs /usr/lib/python3* 2>/dev/null || true \
    && chown nextjs:nodejs /usr/local/bin/yt-dlp 2>/dev/null || true

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["./start.sh"]
