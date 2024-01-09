#!/bin/bash

tags=$(git tag -l "*-beta.*")

for tag in $tags; do
  git tag -d $tag
done

echo "done"

