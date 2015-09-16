FROM ubuntu:15.04
RUN apt-get update -y
RUN apt-get -y install mongodb nodejs nodejs-legacy npm
ADD . /src
WORKDIR /src
RUN ./setup.sh

RUN mkdir /data

ENTRYPOINT mongod --logpath=/root/mongod.log --dbpath=/data --fork && ./run.sh

