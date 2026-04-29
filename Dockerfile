FROM node:20-bookworm-slim AS base
WORKDIR /ritmohub
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /ritmohub/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /ritmohub
ENV NODE_ENV=production
ENV PORT=5155
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Runtime writable dirs for mounted persistent volumes.
RUN mkdir -p ./logs ./.next/cache && chown -R nextjs:nodejs ./logs ./.next

COPY --from=builder --chown=nextjs:nodejs /ritmohub/public ./public
COPY --from=builder --chown=nextjs:nodejs /ritmohub/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /ritmohub/.next/static ./.next/static

USER nextjs

EXPOSE 5155

CMD ["node", "server.js"]
