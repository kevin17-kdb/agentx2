FROM node:22-alpine

WORKDIR /app
COPY client/package*.json ./client/
RUN npm --prefix client install

COPY client ./client

# Vite dev server proxying /api to the compose "server" service.
ENV VITE_API_PROXY_TARGET=http://server:5000
EXPOSE 5173
CMD ["npm", "--prefix", "client", "run", "dev"]
