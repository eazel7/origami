FROM ubuntu:15.04
RUN apt-get update -y
RUN apt-get -y install mongodb nodejs nodejs-legacy npm git

ADD . /src
WORKDIR /src
RUN npm install

RUN mkdir /data

RUN git clone https://github.com/eazel7/origami-packs.git /packs
WORKDIR /packs
RUN for f in *.pack; do node /src/upload-pack.js < $f; done

ENTRYPOINT mongod --logpath=/root/mongod.log --dbpath=/data --fork && ./run.sh

