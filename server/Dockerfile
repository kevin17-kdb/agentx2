FROM node:22-alpine

WORKDIR /app
COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev

COPY server ./server

EXPOSE 5000
WORKDIR /app/server
CMD ["node", "server.js"]
