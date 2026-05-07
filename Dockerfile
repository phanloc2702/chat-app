FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY nx.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx", "nx", "serve", "api", "--host", "0.0.0.0"]