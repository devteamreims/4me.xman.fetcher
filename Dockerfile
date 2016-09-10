FROM node:6

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install --production --silent

COPY . /usr/src/app/

ENV PORT 3201
EXPOSE ${PORT}

CMD ["npm", "start"]
