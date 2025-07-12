FROM node:20-alpine

WORKDIR /usr/app

COPY server.js . 
COPY public ./public 

ENV PORT=3000

RUN npm i express

CMD node server.js