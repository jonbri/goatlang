#!/bin/bash

GOTAGGER="./bin/gotagger"

GOATLANG_VERSION=`$GOTAGGER`

node ./bin/changelog.js

git add CHANGELOG.md
git commit --allow-empty -m "release: $GOATLANG_VERSION"

$GOTAGGER -release -push

