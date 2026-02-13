FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN npm install -g pnpm@9.1.0 && \
    pnpm install --prod=false

COPY frontend/ .

RUN pnpm build && \
    rm -rf node_modules && \
    pnpm install --prod

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    py3-pip \
    libpq \
    supervisor \
    wget \
    && rm -rf /var/cache/apk/* /tmp/*

COPY server/requirements.txt /app/server/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/server/requirements.txt

COPY server/ /app/server/
RUN mkdir -p /app/server/uploads
RUN mkdir -p /app/server/data && chmod 777 /app/server/data

COPY --from=frontend-builder /app/public ./frontend/public
COPY --from=frontend-builder /app/.next/standalone ./frontend/
COPY --from=frontend-builder /app/.next/static ./frontend/.next/static

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app/frontend

COPY supervisord.conf /etc/supervisord.conf

# Declare the data volume to signal that this directory holds persistent data
VOLUME ["/app/server/data"]

# Default environment variables
# OPENROUTER_API_KEY is REQUIRED - pass via: docker run -e OPENROUTER_API_KEY=sk-or-xxx
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    DATABASE_URL="sqlite:///./data/vacancio.db" \
    SECRET_KEY="change-this-in-production" \
    ENVIRONMENT=production \
    NEXT_PUBLIC_API_URL="http://localhost:8000"

EXPOSE 3000 8000


HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1


CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
