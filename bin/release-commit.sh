#!/bin/bash

yarn
yarn build

new_version=`./bin/gotagger`
echo "new_version: ${new_version}";

npm version $new_version --commit-hooks false --git-tag-version false

yarn changelog

npm version 0.0.0 --commit-hooks false --git-tag-version false

git add CHANGELOG.md
git commit --allow-empty -m "release: $new_version"
