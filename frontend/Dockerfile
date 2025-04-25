FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

# 残りのソースコードをコピー（package.json側に変更がなかった場合、上２行のコマンドを飛ばして、このコマンドを実行する）
COPY . .

CMD ["npm", "run", "dev"]