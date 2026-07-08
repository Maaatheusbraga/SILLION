#!/usr/bin/env bash
# Atualiza o SILLION na VPS baixando o tarball do GitHub (sem git pull).
# Preserva data/, .env.production e .env.local.
#
# Uso:
#   cd /opt/sillion && bash deploy/update-from-github.sh
#
# Repositório privado — crie /opt/sillion/.env.deploy com:
#   cp deploy/github-token.example .env.deploy

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BRANCH="${BRANCH:-main}"
REPO="${REPO:-Maaatheusbraga/SILLION}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [[ -f "$APP_DIR/.env.deploy" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$APP_DIR/.env.deploy"
  set +a
fi

echo "→ Baixando $REPO ($BRANCH)..."
ARCHIVE_URL="https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz"
CURL_OPTS=(-fsSL)
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  CURL_OPTS+=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

if ! curl "${CURL_OPTS[@]}" "$ARCHIVE_URL" -o "$TMP_DIR/source.tar.gz"; then
  echo "Erro ao baixar o código."
  echo "Se o repositório for privado, crie $APP_DIR/.env.deploy com GITHUB_TOKEN=..."
  exit 1
fi

tar -xzf "$TMP_DIR/source.tar.gz" -C "$TMP_DIR"
SRC="$TMP_DIR/SILLION-$BRANCH"

if [[ ! -d "$SRC" ]]; then
  echo "Pacote extraído em formato inesperado."
  exit 1
fi

echo "→ Atualizando código em $APP_DIR (preservando data/ e .env)..."
RSYNC_OPTS=(
  -a
  --exclude node_modules
  --exclude .next
  --exclude data
  --exclude .env.local
  --exclude .env.production
  --exclude .env.deploy
  --exclude .git
)

if command -v rsync >/dev/null 2>&1; then
  rsync "${RSYNC_OPTS[@]}" "$SRC/" "$APP_DIR/"
else
  echo "rsync não encontrado; copiando com cp..."
  shopt -s dotglob
  for item in "$SRC"/*; do
    name="$(basename "$item")"
    case "$name" in
      node_modules|.next|data|.env.local|.env.production|.env.deploy|.git) continue ;;
    esac
    cp -a "$item" "$APP_DIR/"
  done
  shopt -u dotglob
fi

cd "$APP_DIR"

echo "→ Instalando dependências..."
npm install

echo "→ Build de produção..."
npm run build

echo "→ Reiniciando PM2..."
npm run deploy:restart-ip

echo "✓ Deploy concluído — $APP_DIR atualizado a partir do GitHub."
