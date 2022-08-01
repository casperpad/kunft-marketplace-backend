# Pull Docker Hub base image
FROM nikolaik/python-nodejs:latest

RUN [ "npm", "install", "-g", "pnpm" ]

# Set working directory
WORKDIR /usr/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN [ "pnpm", "i" ]

COPY . .

RUN [ "pnpm", "build" ]

EXPOSE 8000

CMD [ "pnpm", "start" ]