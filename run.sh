#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 URL" >&2
  exit 1
fi

docker build -t web-crawler-exercise/app .

mkdir -p ./output

docker run --rm \
  -e URL=$1 \
  -v ${PWD}/output:/app/output \
  web-crawler-exercise/app
