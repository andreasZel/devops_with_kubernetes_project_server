FROM node:20-alpine

WORKDIR /usr/app

COPY server.js . 
COPY public ./public 

RUN npm i express

CMD node server.js