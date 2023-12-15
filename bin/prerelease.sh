#!/bin/bash

# next_version=`git describe --tags --abbrev=0`
# next_version=`./bin/gotagger`
# echo $next_version
# prerelease_version="${next_version}-main"
# echo $prerelease_version
# ./node_modules/.bin/semver $next_version --increment prerelease --preid beta

previous_version=`git describe --tags --abbrev=0`
./node_modules/.bin/semver $previous_version --increment prerelease --preid beta

