FROM node:14.7-alpine3.12

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD node ./dist/index.js $URL
