#!/bin/bash

GOTAGGER="./bin/gotagger"

GOATLANG_VERSION=`$GOTAGGER`

echo
go version
echo
$GOTAGGER --version
echo
echo "goatlang version: $GOATLANG_VERSION"
echo

