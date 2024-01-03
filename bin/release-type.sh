#!/bin/bash

REF=$1
if [ -z "$REF" ]; then
  REF="HEAD"
fi

if [[ `git log $REF -1 --pretty=%B` == release* ]]; then
  echo "release"
elif [[ `git rev-parse --abbrev-ref $REF` =~ ^[0-9]+[.][0-9]+[.][0-9]+$ ]]; then
  echo "maintenance"
else
  echo "prerelease"
fi
