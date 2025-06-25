FROM node:20-alpine

WORKDIR /usr/app

COPY server.js . 

RUN npm i express

CMD node server.js