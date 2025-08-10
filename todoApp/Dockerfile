FROM node:20-alpine

WORKDIR /usr/app

COPY todoApp.js . 
COPY package.json . 
COPY package-lock.json . 

ENV PORT=3004

RUN npm i

CMD node todoApp.js