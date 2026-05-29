# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist

RUN mkdir -p /app/logs \
  && chown -R node:node /app/logs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "import('http').then(({get})=>get('http://localhost:5000/health',(res)=>{if(res.statusCode===200)process.exit(0);process.exit(1);}).on('error',()=>process.exit(1)))"

USER node
CMD ["node", "dist/index.js"]
