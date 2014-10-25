#! /bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

(cd $DIR/api-mongo && npm link) &&
(cd $DIR/auth-local && npm link) &&
(cd $DIR/auth-ba && npm link) &&
(cd $DIR/random-names && npm link) &&
(cd $DIR/app && npm link) &&
(cd $DIR/manager && npm link origami-api-mongo) &&
(cd $DIR/manager && npm link origami-app) &&
(cd $DIR/manager && npm link origami-auth-local) &&
(cd $DIR/manager && npm link origami-auth-buenosaires) &&
(cd $DIR/manager && npm link origami-random-names) &&
(cd $DIR/api-mongo && npm link origami-random-names)


(cd $DIR/api-mongo && npm install) &&
(cd $DIR/auth-local && npm install) &&
(cd $DIR/auth-ba && npm install) &&
(cd $DIR/random-names && npm install) &&
(cd $DIR/app && npm install) &&
(cd $DIR/manager && npm install) &&
(cd $DIR/api-mongo && npm install)

