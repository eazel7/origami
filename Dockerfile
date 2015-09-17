FROM ubuntu:15.04
RUN apt-get update -y
RUN apt-get -y install mongodb nodejs nodejs-legacy npm git

ADD . /src
WORKDIR /src
RUN npm install

RUN mkdir /data

ENTRYPOINT mongod --logpath=/root/mongod.log --dbpath=/data --fork && node .
