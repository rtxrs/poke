# Poké Dashboard & Analytics

A comprehensive, high-performance web application designed to visualize and analyze Pokémon GO data. This project processes player data (exported from PGSharp), calculates advanced metrics like Pokémon rarity and PvP rankings, and provides a polished dashboard for trainers.

## 🚀 Features

### For Trainers
- **Trainer Summary:** View your XP progress, Stardust, PokéCoins, and lifetime statistics.
- **Pokémon Highlights:** Automatic identification of your strongest and rarest catches.
- **Advanced Pokedex:** Track completion across different forms (Normal, Shiny, Event, etc.) with both "Normal" and "Completionist" modes.
- **Inventory Management:** Visual summary of your item bag, categorized by type.
- **Cleanup Tool:** Identify duplicate Pokémon across forms and costumes to optimize storage.
- **Trash String Generator:** Create complex search strings to quickly identify Pokémon that don't meet your "Keep" criteria.
- **Raid Team Builder:** Automatically suggests the best counters from your collection for current Raid Bosses or Max Battles.

### Global Analytics
- **Live Rankings:** See how you stack up against other trainers in terms of distance walked, catches, and collection rarity.
- **Showcase:** A global leaderboard of the strongest (by CP) and rarest (by IV/Shiny/Event probability) Pokémon across the community.

### Technical Power
- **PvP Rank Engine:** Pre-calculated rankings for Great, Ultra, and Master leagues using a high-speed binary lookup system.
- **Auto-Updating Data:** Background services automatically sync with the latest Pokédex, Move sets, and Raid Boss rotations.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript (ESM)
- **Frontend:** Vue.js 3, Vite, TypeScript
- **Data Engine:** Multi-threaded worker scripts for heavy calculations (PvP Ranks)
- **Testing:** Vitest
- **Package Manager:** pnpm
- **Process Management:** PM2

---

## 📂 Project Structure

```text
├── data/                   # JSON and Binary data storage
│   ├── public/             # Publicly accessible data (pokedex, moves)
│   ├── private/            # User sessions and protected rankings
│   └── user/               # User-specific custom maps and generated files
├── dist/                   # Compiled production build (Backend + Frontend)
├── pgsharp_player_data/     # Raw JSON uploads from PGSharp
├── public/                 # Frontend source (HTML, Styles, TypeScript)
├── routes/                 # Express API and Auth routes
├── scripts/                # Utility scripts (PvP gen, scraping, etc.)
├── services/               # Core business logic (PlayerData, Pokedex, etc.)
├── tests/                  # Vitest unit and integration tests
├── server.ts               # Express application entry point
└── vite.config.ts          # Vite frontend configuration
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- pnpm (`npm install -g pnpm`)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Prepare Data
The application will automatically download the necessary Pokédex and Move files on the first run, but you can manually trigger a PvP rank generation:
```bash
pnpm pvp-gen
```

### 3. Development
Run the Vite development server (includes HMR and backend proxy):
```bash
pnpm dev
```

### 4. Build for Production
```bash
pnpm build
```

### 5. Production Start
Using PM2:
```bash
pm2 start ecosystem.config.cjs
```

---

## 🧪 Testing

Validate the core services and data logic using Vitest:
```bash
pnpm test
```
The test suite validates:
- Pokédex integrity and loading.
- Player data parsing.
- Ranking calculation logic.
- Shiny rate and rarity scoring.

---

## 🔒 Security Note
This application includes a session-based authentication system. Ensure you update the `SESSION_SECRET` in `config.ts` (or use environment variables) before deploying to a public environment.

## 📄 License
This project is intended for personal use and data analysis. All Pokémon assets and data are property of Niantic, The Pokémon Company, and Nintendo.
