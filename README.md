# MMORTS - Modern Geopolitics Simulation Game

A full-stack multiplayer strategy game where players build nations, engage in diplomacy, wage wars, and dominate global markets.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run build
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
cp .env.local.example .env.local
npm start
```

## 📋 Database Setup

Create a PostgreSQL database and run the schema:

```bash
psql -h localhost -U mmorts_user -d mmorts_db -f schema.sql
```

## 🎮 Game Mechanics

### 🏛️ Countries & Regions
- Create your nation using 50 stars
- Manage multiple regions with unique resources
- Build infrastructure (farms, factories, oil rigs)

### 📊 Economy
- Trade resources on global market
- Dynamic pricing based on supply/demand
- Manage budget and resources

### ⚔️ Military
- Launch drone strikes on enemy regions
- Ground invasions with troops
- Air defense systems (PVO)
- Battle logs and history

### 😊 Citizen Happiness
- Affected by taxes, food, military losses
- High morale = better production
- Low morale = potential rebellion
- Automatic recalculation every 5 minutes

### 🤝 Diplomacy
- Global chat for all players
- Create and join alliances
- Coordinate with other nations

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Game
- `GET /api/game/world` - Get all countries
- `GET /api/game/my-country` - Get your country
- `POST /api/game/country/create` - Create country
- `GET /api/game/region/:id` - Get region details

### Market
- `GET /api/market/prices` - Get all prices
- `GET /api/market/orders` - Get active orders
- `POST /api/market/order` - Create buy/sell order
- `POST /api/market/buy` - Execute transaction

### Military
- `POST /api/military/drone` - Launch drone strike
- `POST /api/military/attack` - Launch ground invasion
- `GET /api/military/battles` - Get battle history
- `POST /api/military/pvo/upgrade` - Upgrade air defense

### Chat & Diplomacy
- `GET /api/chat/global` - Get global chat
- `POST /api/chat/message` - Send message
- `POST /api/chat/alliance/create` - Create alliance
- `POST /api/chat/alliance/join` - Join alliance
- `GET /api/chat/alliances` - List alliances

## 🎨 Tech Stack

### Backend
- Node.js + Express.js + TypeScript
- PostgreSQL (database)
- Redis (job queue)
- Socket.io (real-time)
- Bull (background jobs)

### Frontend
- React 18 + TypeScript
- Redux Toolkit (state management)
- Tailwind CSS (styling)
- Pixi.js (interactive map)
- Socket.io Client (real-time updates)
- Axios (HTTP client)

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
JWT_EXPIRY=24h
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
```

## 🎯 Game Flow

1. **Register & Login** - Create your account
2. **Create Country** - Spend 50 stars to found a nation
3. **Build & Produce** - Construct buildings and generate resources
4. **Trade** - Participate in global market
5. **Military** - Defend or attack other regions
6. **Diplomacy** - Form alliances and chat with players
7. **Manage Happiness** - Keep citizens content
8. **Expand** - Conquer new territories

## 🔄 Game Tick System

- **5-minute tick**: Production calculation, happiness update
- **10-second broadcast**: Market prices, happiness status
- **Real-time events**: WebSocket for battles, chat, trades

## 📜 License

MIT

## 🤝 Contributing

Contributions welcome! Please create a pull request.

## 📧 Support

Contact: fortoona13@gmail.com
