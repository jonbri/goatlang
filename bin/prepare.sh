#!/bin/bash

# curl \
#   -X POST \
#   -H "Accept: application/vnd.github.v3+json" \
#   https://api.github.com/repos/jonbri/goatlang/actions/workflows/prepare/dispatches \
#   -d '{"ref":"main"}'
#
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer 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" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/jonbri/goatlang/actions/workflows/prepare.yml/dispatches \
  -d '{"ref":"main"}'

