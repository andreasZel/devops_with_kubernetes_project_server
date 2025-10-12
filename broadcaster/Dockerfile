FROM node:20-alpine

WORKDIR /usr/app

COPY broadcaster.js . 
COPY package.json . 
COPY package-lock.json . 

RUN npm i

CMD node broadcaster.js