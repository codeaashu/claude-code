#!/usr/bin/env bash
set -euo pipefail

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun not found — installing..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
else
  echo "Bun found: $(bun --version || true)"
fi

echo "Installing dependencies..."
bun install

echo "Running build..."
if [ -n "${VERCEL_BUILD_COMMAND:-}" ]; then
  eval "$VERCEL_BUILD_COMMAND"
else
  bun run build
fi
