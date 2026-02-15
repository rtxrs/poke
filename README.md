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
- **PvP Rank Engine:** Pre-calculated rankings for Great, Ultra, and Master leagues using a high-speed multi-threaded binary lookup system.
- **Auto-Updating Data:** Background services automatically sync with the latest Pokédex, Move sets, and Raid Boss rotations.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript (ESM)
- **Frontend:** Vue.js 3, Vite, TypeScript, Tailwind CSS v4, DaisyUI
- **Data Engine:** Multi-threaded worker scripts for heavy calculations (PvP Ranks)
- **Testing:** Vitest
- **Package Manager:** pnpm
- **Process Management:** PM2

---

## 📂 Project Structure

```text
├── data/                   # JSON and Binary data storage (persistent)
├── dist/                   # Compiled production build
│   ├── client/             # Bundled Frontend (Vite)
│   └── ...                 # Compiled Backend (TSC)
├── pgsharp_player_data/     # Raw JSON uploads from PGSharp
├── public/                 # Frontend source (HTML, Styles, TypeScript)
├── routes/                 # Express API and Auth routes
├── scripts/                # Utility scripts (PvP gen, scraping, etc.)
├── services/               # Core business logic (PlayerData, Pokedex, etc.)
├── tests/                  # Vitest unit and integration tests
├── server.ts               # Express application entry point
├── vite.config.ts          # Vite frontend configuration
├── tailwind.config.ts      # Tailwind configuration (v4 via CSS)
└── ecosystem.config.cjs    # PM2 configuration
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v20+)
- pnpm (`npm install -g pnpm`)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Create a `.env` file in the root directory (you can use `.env.example` as a template):
```bash
cp .env.example .env
```
Update the values in `.env` with your GitHub credentials (for deployment) and a secure session secret.

### 3. Prepare Data
The application will automatically download the necessary Pokédex and Move files on the first run, but you can manually trigger a PvP rank generation:
```bash
pnpm pvp-gen
```

### 4. Development
Run the development server (includes HMR and backend proxy):
```bash
pnpm dev
```

### 5. Deployment Workflow
This project uses a **Build Locally, Pull Remotely** workflow to save server resources.

**Locally:**
```bash
pnpm run deploy-push
```
*This command builds the assets, commits the changes, and pushes to GitHub using your .env credentials.*

**On Server:**
```bash
pnpm run deploy-pull
```
*This command pulls the code, installs production dependencies, and restarts PM2.*

---

## 🧪 Testing

Validate the core services and data logic using Vitest:
```bash
pnpm test
```

---

## 🔒 Security & Privacy
- **Content Security Policy:** Optimized to allow trusted Pokémon data sources and CDNs.
- **Session Security:** Uses encrypted file-based sessions for trainer data protection.
- **Environment Variables:** All sensitive keys are managed via `.env`.

## 📄 License
This project is intended for personal use and data analysis. All Pokémon assets and data are property of Niantic, The Pokémon Company, and Nintendo.
