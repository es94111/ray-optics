# syntax=docker/dockerfile:1

# ---- Build stage ----------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Native build deps for optional dependencies (canvas, sharp, jsdoc) used by
# the build scripts, plus CJK/Tamil fonts needed to render gallery thumbnails.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    fonts-noto-core \
    fonts-taml \
    fonts-lohit-taml \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# The build needs the full git history (scripts/buildPages.mjs walks the log
# to generate the contributors list), so .git must be part of the build
# context - see .dockerignore.
COPY . .
RUN npm run build

# ---- Runtime stage ----------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
