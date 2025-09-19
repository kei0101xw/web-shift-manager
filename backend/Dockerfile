FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npx prisma generate || true

COPY . .

EXPOSE 8080

CMD ["npx", "nodemon", "src/index.js"]
