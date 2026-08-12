FROM --platform=$BUILDPLATFORM node:26.7.0 AS builder
WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci

COPY . /app
RUN npm run build

FROM caddy:2.11.2-alpine
EXPOSE 80

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv
