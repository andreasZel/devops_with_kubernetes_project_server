FROM node:20-alpine

WORKDIR /usr/app

COPY server.js . 
COPY public ./public 

RUN npm i

CMD node server.js