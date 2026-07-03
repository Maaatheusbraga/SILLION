#!/usr/bin/env bash
# Instala Nginx + SSL para o SILLION na VPS
# Uso: sudo bash deploy/nginx/install.sh sillion.seudominio.com.br

set -euo pipefail

DOMAIN="${1:-}"
APP_DIR="${APP_DIR:-/opt/sillion}"

if [[ -z "$DOMAIN" ]]; then
  echo "Uso: sudo bash deploy/nginx/install.sh SEU_DOMINIO"
  echo "Ex.: sudo bash deploy/nginx/install.sh sillion.bragasolutions.com.br"
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "Pasta do app não encontrada: $APP_DIR"
  exit 1
fi

echo "==> Domínio: $DOMAIN"
echo "==> App: $APP_DIR"

# Nginx
if command -v apt-get &>/dev/null; then
  apt-get update -qq
  apt-get install -y nginx certbot python3-certbot-nginx
elif command -v dnf &>/dev/null; then
  dnf install -y nginx certbot python3-certbot-nginx
elif command -v yum &>/dev/null; then
  yum install -y nginx certbot python3-certbot-nginx
else
  echo "Gerenciador de pacotes não suportado. Instale nginx e certbot manualmente."
  exit 1
fi

CONF_SRC="$APP_DIR/deploy/nginx/sillion.conf"
CONF_BODY="$(sed "s/SEU_DOMINIO/$DOMAIN/g" "$CONF_SRC")"

if [[ -d /etc/nginx/sites-available ]]; then
  echo "$CONF_BODY" > /etc/nginx/sites-available/sillion.conf
  ln -sf /etc/nginx/sites-available/sillion.conf /etc/nginx/sites-enabled/sillion.conf
else
  echo "$CONF_BODY" > /etc/nginx/conf.d/sillion.conf
fi

nginx -t
systemctl enable nginx
systemctl reload nginx

# PM2 só em localhost
if command -v pm2 &>/dev/null; then
  cd "$APP_DIR"
  pm2 delete sillion 2>/dev/null || true
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
  echo "==> PM2 reiniciado (127.0.0.1:3000)"
fi

# Firewall — fecha porta 3000 pública, mantém 80/443
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw deny 3000/tcp || true
  echo "==> UFW: 80/443 abertas, 3000 bloqueada"
elif command -v firewall-cmd &>/dev/null && systemctl is-active firewalld &>/dev/null; then
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --permanent --remove-port=3000/tcp 2>/dev/null || true
  firewall-cmd --reload
  echo "==> firewalld: http/https liberados"
fi

echo ""
echo "==> Crie o DNS antes do SSL:"
echo "    $DOMAIN  A  ->  IP_DA_VPS"
echo ""
read -r -p "DNS já aponta para esta VPS? [s/N] " DNS_OK
if [[ "${DNS_OK,,}" == "s" ]]; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || \
    certbot --nginx -d "$DOMAIN"
  systemctl reload nginx
  echo ""
  echo "Pronto! Acesse: https://$DOMAIN"
else
  echo ""
  echo "Depois de apontar o DNS, rode:"
  echo "  certbot --nginx -d $DOMAIN"
  echo ""
  echo "Por enquanto (só HTTP): http://$DOMAIN"
fi
