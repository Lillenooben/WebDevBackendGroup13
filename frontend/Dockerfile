FROM node:18.14.1

WORKDIR /frontend

COPY ./package*.json ./

RUN npm install

COPY ./code/ ./

CMD npm run start