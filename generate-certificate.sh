#! /bin/bash

HOST=$1
: ${HOST:=localhost}

openssl req -x509 -nodes -newkey rsa:2048 -keyout $HOST.pem -out $HOST.pem -days 3650 -subj /CN=$HOST

