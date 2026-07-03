#!/usr/bin/env bash
# Instala Nginx para o SILLION na VPS
#
# Com domínio:
#   sudo bash deploy/nginx/install.sh dominio sillion.seudominio.com.br
#
# Só IP (sem SSL):
#   sudo bash deploy/nginx/install.sh ip
#   sudo bash deploy/nginx/install.sh ip 187.77.240.221

set -euo pipefail

MODE="${1:-}"
TARGET="${2:-}"
APP_DIR="${APP_DIR:-/opt/sillion}"

if [[ -z "$MODE" ]] || [[ "$MODE" != "ip" && "$MODE" != "dominio" ]]; then
  echo "Uso:"
  echo "  sudo bash deploy/nginx/install.sh ip [IP_PUBLICO]"
  echo "  sudo bash deploy/nginx/install.sh dominio seu.dominio.com.br"
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "Pasta do app não encontrada: $APP_DIR"
  exit 1
fi

if [[ "$MODE" == "ip" ]]; then
  if [[ -z "$TARGET" ]]; then
    TARGET="$(curl -4 -s --max-time 5 ifconfig.me || hostname -I | awk '{print $1}')"
  fi
  if [[ -z "$TARGET" ]]; then
    echo "Não foi possível detectar o IP. Passe manualmente:"
    echo "  sudo bash deploy/nginx/install.sh ip 187.77.240.221"
    exit 1
  fi
  CONF_SRC="$APP_DIR/deploy/nginx/sillion-ip.conf"
  CONF_BODY="$(sed "s/SEU_IP/$TARGET/g" "$CONF_SRC")"
  PM2_CONFIG="deploy/ecosystem.ip.config.cjs"
  echo "==> Modo IP: http://$TARGET"
else
  if [[ -z "$TARGET" ]]; then
    echo "Informe o domínio:"
    echo "  sudo bash deploy/nginx/install.sh dominio sillion.seudominio.com.br"
    exit 1
  fi
  CONF_SRC="$APP_DIR/deploy/nginx/sillion.conf"
  CONF_BODY="$(sed "s/SEU_DOMINIO/$TARGET/g" "$CONF_SRC")"
  PM2_CONFIG="deploy/ecosystem.config.cjs"
  echo "==> Modo domínio: $TARGET"
fi

echo "==> App: $APP_DIR"

if command -v apt-get &>/dev/null; then
  apt-get update -qq
  apt-get install -y nginx
  if [[ "$MODE" == "dominio" ]]; then
    apt-get install -y certbot python3-certbot-nginx
  fi
elif command -v dnf &>/dev/null; then
  dnf install -y nginx
  if [[ "$MODE" == "dominio" ]]; then
    dnf install -y certbot python3-certbot-nginx
  fi
elif command -v yum &>/dev/null; then
  yum install -y nginx
  if [[ "$MODE" == "dominio" ]]; then
    yum install -y certbot python3-certbot-nginx
  fi
else
  echo "Gerenciador de pacotes não suportado. Instale nginx manualmente."
  exit 1
fi

if [[ -d /etc/nginx/sites-available ]]; then
  echo "$CONF_BODY" > /etc/nginx/sites-available/sillion.conf
  ln -sf /etc/nginx/sites-available/sillion.conf /etc/nginx/sites-enabled/sillion.conf
else
  echo "$CONF_BODY" > /etc/nginx/conf.d/sillion.conf
fi

nginx -t
systemctl enable nginx
systemctl reload nginx

if command -v pm2 &>/dev/null; then
  cd "$APP_DIR"
  pm2 delete sillion 2>/dev/null || true
  pm2 start "$PM2_CONFIG"
  pm2 save
  echo "==> PM2 reiniciado (127.0.0.1:3000)"
fi

if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw deny 3000/tcp || true
  if [[ "$MODE" == "dominio" ]]; then
    ufw allow 443/tcp
  fi
elif command -v firewall-cmd &>/dev/null && systemctl is-active firewalld &>/dev/null; then
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --remove-port=3000/tcp 2>/dev/null || true
  if [[ "$MODE" == "dominio" ]]; then
    firewall-cmd --permanent --add-service=https
  fi
  firewall-cmd --reload
fi

if [[ "$MODE" == "ip" ]]; then
  echo ""
  echo "Pronto! Acesse: http://$TARGET"
  echo ""
  echo "Sem domínio não há HTTPS gratuito. COOKIE_SECURE=false já está no PM2 (modo IP)."
  echo "Quando tiver domínio: sudo bash deploy/nginx/install.sh dominio seu.dominio.com.br"
  exit 0
fi

echo ""
echo "Crie o DNS: $TARGET  A  ->  IP_DA_VPS"
read -r -p "DNS já aponta para esta VPS? [s/N] " DNS_OK
if [[ "${DNS_OK,,}" == "s" ]]; then
  certbot --nginx -d "$TARGET" --non-interactive --agree-tos -m "admin@$TARGET" --redirect || \
    certbot --nginx -d "$TARGET"
  systemctl reload nginx
  echo "Pronto! Acesse: https://$TARGET"
else
  echo "Depois do DNS: certbot --nginx -d $TARGET"
  echo "Por enquanto: http://$TARGET"
fi
