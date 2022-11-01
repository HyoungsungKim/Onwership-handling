FROM ubuntu:latest

RUN mkdir app

RUN chmod -R 777 root app

RUN apt-get update
RUN apt-get install -y curl

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs && npm install -g npm 

RUN apt-get update
