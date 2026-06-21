FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

ARG APP_VERSION=manual-local
ARG COMMIT_SHA=working-tree
ARG BUILD_DATE=local
RUN printf '{\n  "version": "%s",\n  "commit": "%s",\n  "builtAt": "%s"\n}\n' \
    "$APP_VERSION" "$COMMIT_SHA" "$BUILD_DATE" > public/deployment.json \
    && npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/deployment-evolution-demo/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health || exit 1
