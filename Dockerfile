FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --global pnpm@11.25.0 && pnpm install --prod --frozen-lockfile --ignore-scripts
COPY app ./app
COPY public ./public
COPY scripts ./scripts
COPY tests ./tests
COPY migrations ./migrations
COPY data/source-release.json ./data/source-release.json
RUN node scripts/build-production.mjs

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production DEMO_MODE=false CONTENT_MODE=source HOST=0.0.0.0 PORT=10000 PG_SSL=verify
WORKDIR /app
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/app ./app
COPY --chown=node:node --from=build /app/scripts ./scripts
COPY --chown=node:node --from=build /app/migrations ./migrations
COPY --chown=node:node --from=build /app/data/source-release.json ./data/source-release.json
COPY --chown=node:node --from=build /app/dist-production ./public
COPY --chown=node:node ["KOSAKATA PEKERJAAN", "./KOSAKATA PEKERJAAN/"]
COPY --chown=node:node ["MATERI HSK LENGKAP", "./MATERI HSK LENGKAP/"]
COPY --chown=node:node ["SOAL HSK LENGKAP", "./SOAL HSK LENGKAP/"]
USER node
EXPOSE 10000
CMD ["node", "app/server.mjs"]
