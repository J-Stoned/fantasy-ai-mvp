#!/bin/bash

echo "🚀 Setting up AWS EC2 instance for Fantasy.AI"
echo "=========================================="

# Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Clone repository
git clone https://github.com/yourusername/fantasy-ai-mvp.git
cd fantasy-ai-mvp

# Create .env file
cat > .env << EOF
DATABASE_URL="${DATABASE_URL}"
OPENAI_API_KEY="${OPENAI_API_KEY}"
OPENWEATHER_API_KEY="${OPENWEATHER_API_KEY}"
ODDS_API_KEY="${ODDS_API_KEY}"
NEWS_API_KEY="${NEWS_API_KEY}"
BALLDONTLIE_API_KEY="${BALLDONTLIE_API_KEY}"
EOF

# Start services
cd deployment/docker
docker-compose up -d

echo "✅ EC2 setup complete!"
echo "Services are running in the background"