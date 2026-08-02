#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "${SCRIPT_DIR}:/zap/wrk/:rw" \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -cmd -autorun /zap/wrk/zap-automation.yaml