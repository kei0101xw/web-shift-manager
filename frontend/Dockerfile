FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci

# RUN npm install

# 残りのソースコードをコピー（package.json側に変更がなかった場合、上２行のコマンドを飛ばして、このコマンドを実行する）
COPY . .
ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
# CMD ["npm", "run", "dev"]