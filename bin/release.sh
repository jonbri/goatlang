#!/bin/bash

GOTAGGER="./bin/gotagger"

GOATLANG_VERSION=`$GOTAGGER`

git commit --allow-empty -m "release: $GOATLANG_VERSION"

$GOTAGGER -release -push

