FROM node:20-alpine

WORKDIR /usr/app

COPY todoApp.js . 

ENV PORT=3004

RUN npm i express

CMD node todoApp.js