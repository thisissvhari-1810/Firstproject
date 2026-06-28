# syntax=docker/dockerfile:1.6

# ---------- Stage 1: deps ----------
# Install all dependencies (incl. dev) and generate the Prisma client.
# Uses bullseye-slim so bcrypt + Prisma's OpenSSL requirements work out of the box.
FROM node:16-bullseye-slim AS deps

WORKDIR /app

# Native build toolchain for bcrypt and OpenSSL for Prisma engines.
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

# Prune dev dependencies for the runtime image.
RUN yarn install --frozen-lockfile --production --ignore-scripts --prefer-offline \
    && yarn cache clean

# ---------- Stage 3: runtime ----------
FROM node:16-bullseye-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

USER node

EXPOSE 4000

CMD ["yarn", "prod"]
