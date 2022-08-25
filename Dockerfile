# Pull Docker Hub base image
FROM nikolaik/python-nodejs:latest

# Set working directory
WORKDIR /usr/app

COPY package.json ./
COPY yarn.lock ./

RUN [ "yarn" ]

COPY . .

RUN [ "yarn", "build" ]

EXPOSE 8000

CMD [ "yarn", "start" ]