FROM node:18
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

CMD ["npm","run","dev"]
