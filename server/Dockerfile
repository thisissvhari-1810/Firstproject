# syntax=docker/dockerfile:1.6

# ---------- Stage 1: deps ----------
# Install ALL dependencies (incl. dev). We intentionally keep dev deps in the
# final image because the runtime needs:
#   - `prisma` CLI         -> `yarn prisma:deploy` runs on every container start
#   - `ts-node` + `typescript` -> `yarn prisma db seed` (executes prisma/seed.ts)
# Switching to bullseye-slim so bcrypt builds and Prisma's OpenSSL works.
FROM node:16-bullseye-slim AS deps

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssl \
        ca-certificates \
        python3 \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
COPY prisma ./prisma/

RUN yarn install --frozen-lockfile \
    && yarn cache clean

# ---------- Stage 2: build ----------
FROM node:16-bullseye-slim AS build

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

RUN yarn build

# ---------- Stage 3: runtime ----------
FROM node:16-bullseye-slim AS runtime

WORKDIR /app

ENV PORT=4000

# OpenSSL is required by Prisma's query engine at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Bring everything needed to: run migrations, run the seed (ts-node), and serve.
COPY --from=build /app/package.json /app/yarn.lock /app/tsconfig.json ./
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

USER node

EXPOSE 4000

# `yarn prod` = `yarn prisma:deploy && node dist/index.js`
# so migrations are applied on every start.
CMD ["yarn", "prod"]
