#!/bin/bash

new_version=`./bin/gotagger`
echo "new_version: ${new_version}";

# npm version $new_version --commit-hooks false --git-tag-version false

node ./bin/changelog.js

# npm version 0.0.0 --commit-hooks false --git-tag-version false
