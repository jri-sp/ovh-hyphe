#!/bin/bash
sudo usermod -G docker debian
sudo apt-get install -y curl
sudo curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
git clone https://github.com/medialab/hyphe.git /opt/hyphe
chown -R debian:debian /opt/hyphe
cd /opt/hyphe
cp .env.example .env
sed -i 's/RESTART_POLICY=no/RESTART_POLICY=unless-stopped/g' .env
cp config-backend.env.example config-backend.env
cp config-frontend.env.example config-frontend.env
/usr/local/bin/docker-compose pull
/usr/local/bin/docker-compose up -d
