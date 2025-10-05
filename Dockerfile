FROM node:20-alpine

WORKDIR /usr/app

COPY server.js . 
COPY package.json . 
COPY package-lock.json . 
COPY public ./public 

RUN npm install

CMD node server.js