!#/bin/bash

curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/jonbri/goatlang/actions/workflows/prepare/dispatches \
  -d '{"ref":"main"}'
