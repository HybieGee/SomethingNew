# 🎰 RAFFLE Arcade

A Cloudflare-native game website featuring virtual currency, quick quests, raffles, and creator rewards integration.

## 🚀 Live Deployment

This project is designed for immediate GitHub-to-Cloudflare Pages deployment:

1. **Push to GitHub**: Upload this repo to GitHub
2. **Connect Cloudflare Pages**: Link your GitHub repo to Cloudflare Pages
3. **Auto-Deploy**: Every commit automatically deploys to production

## 🏗️ Architecture

### 100% Cloudflare Stack
- **Frontend**: React (Vite) on Cloudflare Pages
- **API**: Cloudflare Workers with Hono
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Storage**: Cloudflare R2 (for assets)
- **Scheduled Tasks**: Cloudflare Workers Cron
- **Durable Objects**: For raffle fairness

### Monorepo Structure
```
raffle-arcade/
├── apps/
│   ├── web/              # React frontend (Cloudflare Pages)
│   ├── worker-api/       # Main API worker
│   └── worker-jobs/      # Cron jobs worker
├── packages/
│   └── shared/           # Types, schemas, utilities
├── infra/
│   ├── schema.sql        # D1 database schema
│   └── seed.sql          # Initial data
└── .github/workflows/    # Auto-deployment
```

## 🎮 Core Features

### Virtual Economy
- **Tickets**: Off-chain virtual currency
- **Daily Rewards**: Login bonuses with streak multipliers
- **Quest Earnings**: 5-15 minute activities
- **Raffle Prizes**: Enter with tickets, win bigger prizes

### 5-15 Minute Gameplay Loops
1. **Up/Down Call**: Predict price movements (60s)
2. **Tap Challenge**: Speed clicking mini-game (10s)
3. **Trivia**: Crypto/meme knowledge quiz (5 questions)

### Raffle System
- **Hourly**: Small prizes, frequent draws
- **Daily**: Medium prizes, once per day
- **Weekly**: Large prizes, big events
- **Fair Draws**: Deterministic commit-reveal with Durable Objects

### Creator Rewards Integration
- Admin API for processing creator earnings
- Automatic splits: Season pool, raffle funds, global boosts
- Live boost notifications and timer displays

## 🔧 Setup Instructions

### 1. Cloudflare Prerequisites

Before deployment, create these Cloudflare resources:

```bash
# Create D1 database
wrangler d1 create raffle-arcade

# Create KV namespace
wrangler kv:namespace create "CACHE"

# Create R2 bucket
wrangler r2 bucket create raffle-arcade-assets
```

### 2. Update Configuration

Update `wrangler.toml` files with your resource IDs:

**`apps/worker-api/wrangler.toml`**:
```toml
[[d1_databases]]
binding = "DB"
database_name = "raffle-arcade"
database_id = "YOUR_D1_DATABASE_ID"  # ← Replace this

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # ← Replace this
```

**`apps/worker-jobs/wrangler.toml`**: Same database and KV IDs.

### 3. Initialize Database

Run the schema and seed files:

```bash
# Apply schema
wrangler d1 execute raffle-arcade --file=infra/schema.sql

# Add initial data
wrangler d1 execute raffle-arcade --file=infra/seed.sql
```

### 4. Set Secrets

In Cloudflare Dashboard → Workers & Pages → Your Worker → Settings → Variables:

**Required Secrets**:
- `ADMIN_SECRET`: Random string for admin authentication
- `SERVER_SEED`: Random string for raffle fairness

```bash
# Example (use your own random values)
wrangler secret put ADMIN_SECRET
# Enter: your-super-secret-admin-key-here

wrangler secret put SERVER_SEED
# Enter: your-random-seed-for-raffle-fairness
```

### 5. GitHub Deployment Setup

**Add Repository Secrets** (GitHub repo → Settings → Secrets):
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

**Connect Cloudflare Pages**:
1. Cloudflare Dashboard → Pages → Create a project
2. Connect to Git → Select your repo
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/`

## 📁 Pages Configuration

Cloudflare Pages will automatically build the frontend from `/apps/web/`. The build command:

```bash
npm ci && npm run build --workspace=@raffle-arcade/web
```

The Workers (API and jobs) deploy separately via GitHub Actions on every push.

## 🔗 API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login with recovery code
- `POST /auth/logout` - End session

### Profile & Economy
- `GET /me` - User profile and stats
- `POST /me/daily` - Claim daily reward
- `GET /leaderboard` - Top players

### Quests
- `GET /quests` - Available quests with cooldowns
- `POST /quests/complete` - Submit quest completion

### Raffles
- `GET /raffles/next` - Upcoming/active raffles
- `POST /raffles/enter` - Enter raffle with tickets
- `GET /raffles/:id` - Raffle details and winners

### Store
- `GET /storefront` - Available items
- `POST /storefront/purchase` - Buy with tickets

### Admin (Protected)
- `POST /admin/claim` - Process creator rewards
- `POST /admin/boost` - Trigger global boost
- `POST /admin/draw` - Force raffle draw

## 🤖 Automated Tasks

The cron worker runs:

- **Every 5 minutes**: Check for raffle draws
- **Every hour**: Create new hourly raffles, activate upcoming ones
- **Daily**: Reset daily limits, create daily raffles
- **Weekly**: Create weekly raffles, manage seasons

## 🎨 Asset Management

Upload assets to your R2 bucket:

### Required Assets
- **Logos**: `logo-horizontal.png`, `logo-square.png`
- **Backgrounds**: `bg-light.jpg`, `bg-dark.jpg`
- **Badges**: `badge-starter.png`, `badge-streak.png`, etc.
- **Raffle**: `chest-closed.png`, `chest-open.png`
- **Factions**: `bonk.png`, `doge.png`, `shib.png`, `wif.png`

Assets load from: `https://raffle-arcade-assets.your-account.r2.cloudflarestorage.com/`

## 🔒 Security Features

- **Secure Sessions**: HttpOnly cookies with CSRF protection
- **Rate Limiting**: Per-user cooldowns on all actions
- **Admin Protection**: Bearer token authentication
- **Deterministic Fairness**: Commit-reveal raffle draws
- **Input Validation**: Zod schemas on all endpoints

## 🧪 Testing

After deployment, test core flows:

1. **Registration**: Create account, save recovery code
2. **Daily Reward**: Claim and verify streak tracking
3. **Quest Loop**: Complete all 3 quest types
4. **Raffle Entry**: Enter with tickets, wait for draw
5. **Admin Panel**: Process mock creator reward
6. **Store**: Buy items with earned tickets

## 📊 Monitoring

Check these for health:

- **D1 Console**: Query user counts, ticket totals
- **Worker Analytics**: API response times and errors
- **KV Analytics**: Cache hit rates
- **Cron Logs**: Successful raffle draws and task execution

## 🔄 Updates & Maintenance

**Automatic Deployment**: Every push to `main` triggers full deployment.

**Manual Tasks**:
- Monitor D1 storage usage
- Upload new assets to R2
- Update seasonal content
- Adjust game balance parameters

## 🎯 Creator Rewards Flow

1. **Claim Creator Earnings**: You receive SOL/tokens from Pump.fun
2. **Admin API Call**: POST to `/admin/claim` with transaction details
3. **Automatic Split**:
   - 50% → Season prize pool (displayed live)
   - 30% → Next raffle prizes (increased pot)
   - 20% → 4-hour global boost (1.25x tickets)
4. **Live Updates**: Site shows boost timer and bigger prizes

This creates immediate engagement when you have a successful claim!

## 📈 Scaling Notes

- **D1 Limits**: 25M reads, 50K writes per day (free tier)
- **Worker Limits**: 100K requests per day (free tier)
- **KV Limits**: 100K reads, 1K writes per day (free tier)
- **Pages**: Unlimited static hosting

For growth beyond free tiers, upgrade to Cloudflare paid plans.

---

**🚀 Ready to Deploy**: Push this repo to GitHub and connect to Cloudflare Pages!