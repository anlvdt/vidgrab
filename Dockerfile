FROM node:22.16.0-alpine3.21 AS base
# yt-dlp + JS challenge runtime + bgutil PO-token plugin (talks to the
# bgutil-pot sidecar over HTTP to mint Proof-of-Origin tokens for YouTube).
# pytubefix is the secondary YouTube extractor (fallback when yt-dlp fails).
RUN apk add --no-cache python3 py3-pip ffmpeg curl \
    && pip3 install --break-system-packages \
        "yt-dlp[default,curl-cffi]==2026.7.4" \
        bgutil-ytdlp-pot-provider==1.2.2 \
        pytubefix==10.9.0

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
# pytubefix fallback helper — resolved at runtime via process.cwd()/scripts.
COPY --from=builder --chown=nextjs:nodejs /app/scripts/pytubefix_helper.py ./scripts/pytubefix_helper.py
RUN chmod +x ./start.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["./start.sh"]
