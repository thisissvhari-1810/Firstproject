# syntax=docker/dockerfile:1.6

# ---------- Stage 1: deps ----------
# Install all dependencies (incl. dev) needed for building Next.js.
# bullseye-slim is used so `sharp` picks up its prebuilt libvips binary.
FROM node:16-bullseye-slim AS deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile \
    && yarn cache clean

# ---------- Stage 2: build ----------
FROM node:16-bullseye-slim AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# API_URL is read at build time via next.config.js (process.env.API_URL is
# inlined into the client bundle). Pass it with `--build-arg API_URL=...`.
ARG API_URL
ENV API_URL=${API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Prune dev dependencies down to what `next start` actually needs at runtime.
RUN yarn install --frozen-lockfile --production --ignore-scripts --prefer-offline \
    && yarn cache clean

# ---------- Stage 3: runtime ----------
FROM node:16-bullseye-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=build /app/package.json /app/yarn.lock /app/next.config.js ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

USER node

EXPOSE 3000

CMD ["yarn", "start"]
