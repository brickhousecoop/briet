#!/usr/bin/env bash
# Back up the production (and optionally development) Sanity dataset to backups/sanity/.
#
# Usage:
#   scripts/backup-sanity.sh             # production only
#   scripts/backup-sanity.sh --all       # production + development
#   scripts/backup-sanity.sh development # specific dataset
#
# WARNING: a full prod export is ~28 GB and takes ~13 min. Make sure you have disk space.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT=$(pwd)

# nvm/node
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use >/dev/null 2>&1 || true

# Sanity token
if [ -z "${SANITY_TOKEN:-}" ] && [ -f .vercel/.env.development.local ]; then
  set -a; . .vercel/.env.development.local; set +a
fi
export SANITY_AUTH_TOKEN="${SANITY_AUTH_TOKEN:-$SANITY_TOKEN}"
if [ -z "$SANITY_AUTH_TOKEN" ]; then
  echo "ERROR: no SANITY_TOKEN found (checked env and .vercel/.env.development.local)" >&2
  exit 1
fi

DATASETS=("$@")
if [ ${#DATASETS[@]} -eq 0 ]; then
  DATASETS=(production)
elif [ "${DATASETS[0]}" = "--all" ]; then
  DATASETS=(production development)
fi

mkdir -p backups/sanity
cd apps/tagger

ts=$(date +%Y%m%d-%H%M%S)
for ds in "${DATASETS[@]}"; do
  out="$REPO_ROOT/backups/sanity/$ds-$ts.tar.gz"
  echo "== Exporting $ds -> $out"
  npx sanity dataset export "$ds" "$out" --overwrite --asset-concurrency 16
  ls -lh "$out"
done

echo "== Done. Backups in backups/sanity/ (note: not tracked in git)"
