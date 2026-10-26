# --- Stage 1: встановлюємо залежності ---
FROM node:22.11.0-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 2: фінальний образ — тільки код і node_modules ---
FROM node:22.11.0-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json db.js server.js migrate.js ./
COPY migrations ./migrations
USER node
EXPOSE 5000
CMD ["node", "server.js"]
