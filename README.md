# VYRO GPU

Piattaforma cloud computing per il noleggio di potenza GPU. Interfaccia web con tema cyberpunk, sistema di team referral, gestione dispositivi e pannello admin.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 7
- **Styling:** Tailwind CSS 4 + Framer Motion
- **Backend:** Supabase (Auth, Database, RLS)
- **Deploy:** GitHub Pages via GitHub Actions

## Setup

```bash
# 1. Clona il repo
git clone https://github.com/yamal90/VYRO.git
cd VYRO

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue credenziali Supabase

# 4. Avvia in development
npm run dev
```

## Variabili d'ambiente

| Variabile | Descrizione |
|---|---|
| `VITE_SUPABASE_URL` | URL del progetto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chiave anon pubblica di Supabase |

## Struttura progetto

```
src/
├── components/        # Componenti UI riutilizzabili
│   ├── ui/            # Componenti base (modali, input, ecc.)
│   ├── BottomNav.tsx
│   ├── ErrorBoundary.tsx
│   ├── ParticleBackground.tsx
│   ├── LiveProductionBar.tsx
│   └── LiveProductionInline.tsx
├── hooks/             # Custom React hooks
│   └── useProductionStats.ts
├── lib/               # Configurazione librerie esterne
│   └── supabase.ts
├── pages/             # Pagine dell'applicazione
│   ├── DashboardPage.tsx
│   ├── DevicesPage.tsx
│   ├── TransactionsPage.tsx
│   ├── TeamPage.tsx
│   ├── BenefitsPage.tsx
│   ├── AdminPage.tsx
│   ├── FAQPage.tsx
│   └── LoginPage.tsx
├── store/             # State management
│   ├── AppContext.tsx  # Context provider principale
│   ├── db-types.ts    # Tipi database Supabase
│   ├── mappers.ts     # Funzioni di mapping DB → UI
│   └── data.ts        # Dati statici (catalogo GPU)
├── App.tsx
├── index.css
├── main.tsx
└── types.ts
```

## Database

Lo schema SQL è diviso in due file:
- `supabase/schema.sql`
- `supabase/migrations/001_rpc_and_rls.sql`

Insieme includono:
- Tabelle: profiles, portfolio_entries, team_members, deposits, withdrawals, activity_logs, platform_settings
- Row Level Security (RLS) su tutte le tabelle
- Funzioni per gestione admin, referral, acquisti, claim giornaliero e leaderboard

## Deploy

Il deploy avviene automaticamente su push al branch `main` tramite GitHub Actions.

**Prerequisiti CI:** Aggiungi i seguenti secrets nel repository GitHub:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Licenza

Progetto privato.
