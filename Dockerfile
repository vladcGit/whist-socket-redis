FROM node:20-alpine3.18

WORKDIR /app

COPY . .

RUN npm ci \
    && npx tsc \
    && rm -rf node_modules \
    && npm install --omit=dev

RUN cd client \
    && npm ci --omit=dev \
    && npm install typescript \
    && npm run build \
    && cd .. \
    && rm -rf client


ENV NODE_ENV=production

CMD ["npm", "run", "startProd"]

EXPOSE 3000