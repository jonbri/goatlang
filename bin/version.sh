#!/bin/bash

GOTAGGER="./bin/gotagger"
GOATLANG_VERSION=`$GOTAGGER`

go version
$GOTAGGER --version
echo "goatlang: $GOATLANG_VERSION"

