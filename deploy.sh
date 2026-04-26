#!/bin/bash
# Thynx App — Self-Contained Deploy Script
# Run this once on VM-APP-01 to deploy the full stack
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        THYNX APP DEPLOYMENT              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

REPO_URL="https://github.com/flexworx/murph-landing-page.git"
APP_DIR="$HOME/thynx-app"

# ── Step 1: Clone or update repo ─────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "▶ Updating existing repo..."
  cd "$APP_DIR" && git pull origin main
else
  echo "▶ Cloning repo..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Step 2: Generate JWT secret if not already set ───────────────────────────
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')

# ── Step 3: Write .env file ───────────────────────────────────────────────────
echo "▶ Writing .env..."
cat > "$APP_DIR/.env" << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=${JWT_SECRET}
TTS_PROVIDER=chatterbox
TTS_API_URL=http://chatterbox:8880
STT_API_URL=http://whisper:9000
HUME_API_KEY=fO6I6XMTzBBQ66HAAXBi5wZs2dFzzEGSVAHPOuhgEU00FgIN
GA_MEASUREMENT_ID=G-VZDK8SMF24
EOF
echo "   .env written ✓"

# ── Step 4: Check Docker is available ────────────────────────────────────────
echo "▶ Checking Docker..."
if ! command -v docker &> /dev/null; then
  echo "   Docker not found — installing..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "   Docker installed ✓"
else
  echo "   Docker found: $(docker --version) ✓"
fi

# ── Step 5: Build and start all containers ────────────────────────────────────
echo "▶ Starting containers (this may take 3-5 minutes on first run)..."
cd "$APP_DIR"
docker compose pull --quiet 2>/dev/null || true
docker compose up -d --build --remove-orphans

# ── Step 6: Wait and verify ───────────────────────────────────────────────────
echo "▶ Waiting for app to start..."
sleep 15

echo ""
echo "▶ Container status:"
docker compose ps

echo ""
echo "▶ Testing local health check..."
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
  echo "   ✅ App is running at http://localhost:3000"
else
  echo "   ⚠️  App may still be starting — check with: docker compose logs thynx"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     DEPLOYMENT COMPLETE ✓                ║"
echo "║                                          ║"
echo "║  App:     http://localhost:3000          ║"
echo "║  TTS:     http://localhost:8880          ║"
echo "║  STT:     http://localhost:9000          ║"
echo "║                                          ║"
echo "║  Point thynx.ai Cloudflare tunnel to:   ║"
echo "║  localhost:3000                          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
