#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$ROOT/app"
UI="$APP/bboard-ui"
CONTRACT="$APP/contract"

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}→${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }

# ── flags ────────────────────────────────────────────────────────────────────
SKIP_DOCKER=false
SKIP_COMPILE=false

for arg in "$@"; do
  case "$arg" in
    --skip-docker)  SKIP_DOCKER=true ;;
    --skip-compile) SKIP_COMPILE=true ;;
    --help|-h)
      echo "Usage: ./dev.sh [--skip-docker] [--skip-compile]"
      echo "  --skip-docker   Don't start the Midnight devnet (use if already running)"
      echo "  --skip-compile  Don't recompile the Compact contract"
      exit 0
      ;;
  esac
done

# ── prereqs ──────────────────────────────────────────────────────────────────
command -v docker  >/dev/null 2>&1 || { echo "docker not found"; exit 1; }
command -v yarn    >/dev/null 2>&1 || { echo "yarn not found — run: npm i -g yarn"; exit 1; }
command -v compact >/dev/null 2>&1 || warn "compact CLI not found — skipping contract compilation"

# ── devnet ───────────────────────────────────────────────────────────────────
if [ "$SKIP_DOCKER" = false ]; then
  info "Starting Midnight devnet (node + indexer + proof-server)…"
  cd "$ROOT"
  docker compose up -d --wait
  info "Devnet healthy"
else
  warn "Skipping devnet start (--skip-docker)"
fi

# ── contract ─────────────────────────────────────────────────────────────────
if [ "$SKIP_COMPILE" = false ] && command -v compact >/dev/null 2>&1; then
  info "Compiling Compact contract…"
  cd "$CONTRACT"
  yarn compact
  info "Contract compiled → src/managed/donor-proof/"
else
  warn "Skipping contract compilation"
fi

# ── dependencies ─────────────────────────────────────────────────────────────
info "Installing dependencies…"
cd "$APP"
yarn install --frozen-lockfile 2>/dev/null || yarn install

# ── dev server ───────────────────────────────────────────────────────────────
info "Starting UI dev server at http://localhost:5173"
echo ""
echo "  Midnight devnet:  http://localhost:9945  (node)"
echo "  Indexer:          http://localhost:8089"
echo "  Proof server:     http://localhost:6301"
echo ""
echo "  Press Ctrl-C to stop the UI. Run 'docker compose down' to stop the devnet."
echo ""
cd "$UI"
yarn dev
