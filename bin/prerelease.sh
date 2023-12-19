#!/bin/bash

PREVIOUS_VERSION=`git describe --tags --abbrev=0`
echo "PREVIOUS_VERSION: ${PREVIOUS_VERSION}"

GOTAGGER_RESULT=`./bin/gotagger`
echo "GOTAGGER_RESULT: $GOTAGGER_RESULT"
./node_modules/.bin/semver $GOTAGGER_RESULT --increment prerelease --preid beta
