# 🚀 Fantasy.AI MVP

> **The future of fantasy sports is here.** AI-powered fantasy sports platform with advanced analytics, real-time insights, and cutting-edge features.

---

## 🏁 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Docker** (for database)
- **Git**

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd fantasy-ai-mvp
npm install
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.local.template .env.local

# Edit .env.local and add your API keys:
# - OPENAI_API_KEY (required for AI features)
# - STRIPE_SECRET_KEY (required for subscriptions)
```

### 3. Easy Setup (Recommended)

```bash
# Run automated setup script
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

**OR Manual Setup:**

```bash
# Start database
docker-compose up -d postgres

# Setup database schema
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

🎉 **Open [http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🚀 Features

### Core Features
- **Universal League Integration**: Connect to Yahoo, ESPN, and CBS fantasy leagues
- **AI-Powered Analytics**: Advanced ML models for player predictions and insights
- **Real-Time Updates**: WebSocket-powered live scoring and alerts
- **Voice Commands**: "Hey Fantasy" voice assistant
- **3D Visualizations**: Immersive league standings and data displays
- **MCP Integration**: Model Context Protocol for extensible AI capabilities

### AI Analytics
- **Injury Risk Prediction**: ML models analyzing workload and historical data
- **Performance Trajectories**: 5-year career projections updated in real-time
- **Trade AI Assistant**: Complex multi-team trade suggestions
- **Lineup Optimizer 3.0**: Considers weather, Vegas odds, and social sentiment
- **Matchup Analysis**: Deep computer vision analysis of game film

### Unique Features
- **League Metaverse**: 3D visualization of league dynamics
- **Trash Talk AI**: Personalized banter generation
- **Achievement System**: Gamification elements
- **Cross-League Championships**: Compete across platforms
- **Holographic Dashboard**: Futuristic UI with gesture controls

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: tRPC, Prisma, PostgreSQL
- **AI/ML**: Python microservices, TensorFlow/PyTorch
- **Real-time**: WebSockets, Redis
- **MCP**: Model Context Protocol for AI integration
- **3D Graphics**: Three.js, React Three Fiber
- **Auth**: NextAuth.js

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fantasy-ai-mvp.git
cd fantasy-ai-mvp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Set up the database:
```bash
npm run db:push
npm run db:generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 MCP Servers

The platform includes MCP servers for enhanced functionality:

### Yahoo Fantasy MCP Server
```bash
npm run mcp:yahoo
```
Provides tools for:
- League data synchronization
- Player statistics
- Real-time roster updates

### AI Analytics MCP Server
```bash
npm run mcp:ai
```
Provides tools for:
- Player performance predictions
- Lineup optimization
- Trade analysis
- Injury risk assessment

## 💰 Business Model

### Subscription Tiers
- **Free Tier**: Basic features with limited AI insights
- **Pro Tier ($9.99/month)**: Full AI analytics, unlimited leagues
- **Elite Tier ($19.99/month)**: Advanced features, priority support, beta access

## 🚀 Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to Vercel:
```bash
vercel
```

## 📱 Mobile App

Coming soon - React Native mobile app with AR features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Claude Code
- Powered by Anthropic's Model Context Protocol
- Fantasy data providers: Yahoo, ESPN, CBS Sports

---

**Fantasy.AI** - The Future of Fantasy Sports, Today
