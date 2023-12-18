#!/bin/bash

yarn
yarn build

new_version=`./bin/gotagger`
echo "new_version: ${new_version}";

npm version $new_version --commit-hooks false --git-tag-version false
echo "after"
cat package.json

yarn changelog
git add CHANGELOG.md

npm version 0.0.1 --commit-hooks false --git-tag-version false
echo "back to 0.0.1"
cat package.json

# git commit --allow-empty -m "release: $new_version"
