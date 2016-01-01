FROM ubuntu:15.10
RUN apt-get update -y
RUN apt-get -y install mongodb nodejs nodejs-legacy npm git

ADD . /src
WORKDIR /src
RUN npm install

RUN mkdir /data
RUN git clone https://github.com/eazel7/origami-packs.git /packs

ENTRYPOINT mongod --logpath=/root/mongod.log --dbpath=/data --fork && node .
