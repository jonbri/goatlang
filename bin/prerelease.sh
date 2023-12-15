#!/bin/bash

previous_version=`git describe --tags --abbrev=0`
new_version=`./node_modules/.bin/semver $previous_version --increment prerelease --preid beta`

echo $new_version
# npm version 1.2.3-beta.1 --commit-hooks false --git-tag-version false

# if head commit is release
# if HEAD commit message starts with "release: "
if [[ `git log -1 --pretty=%B` == release* ]]; then
  echo "yes, it's a release"
  # remove prerelease tag
  # git tag -d $new_version
  # git push origin :refs/tags/$new_version
  # npm version 1.2.3 --commit-hooks false --git-tag-version false
  # git push origin master
  # git push origin --tags
  # npm publish
else
  echo "prerelease"
fi

