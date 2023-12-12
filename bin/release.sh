#!/bin/bash

GOTAGGER_EXE_PATH="$HOME/march/gotagger/build/linux/gotagger"
VERSION=`$GOTAGGER_EXE_PATH`
git commit --allow-empty -m "release: $VERSION"
$GOTAGGER_EXE_PATH -release -push

