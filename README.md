# VYRO GPU v2.0

Piattaforma cloud computing per il noleggio di potenza GPU. Interfaccia web con tema cyberpunk, sistema di team referral, gestione dispositivi e pannello admin.

## ✨ Novità v2.0

- **Test Suite Completa** - Vitest + Testing Library con coverage >70%
- **State Management Atomico** - Zustand stores modulari
- **PWA** - Installabile su mobile/desktop con offline support
- **i18n** - Supporto 5 lingue (IT, EN, DE, FR, ES)
- **Achievements System** - Gamification con XP e livelli
- **Tier System** - 5 tier con benefici esclusivi
- **Staking** - Pool di staking con APY variabile
- **Promo Codes** - Sistema codici promozionali
- **2FA** - Autenticazione two-factor
- **Sentry** - Error tracking in produzione

## Tech Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 7 + PWA Plugin |
| Styling | Tailwind CSS 4 |
| Animazioni | Framer Motion |
| State | Zustand + React Query |
| Backend | Supabase (Auth, DB, RLS, Storage) |
| Testing | Vitest + Testing Library |
| CI/CD | GitHub Actions |
| Monitoring | Sentry |

## Setup

```bash
# 1. Clona il repo
git clone https://github.com/yamal90/VYRO.git
cd VYRO

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue credenziali

# 4. Avvia in development
npm run dev

# 5. Esegui i test
npm run test

# 6. Build per produzione
npm run build
```

## Scripts Disponibili

| Script | Descrizione |
|--------|-------------|
| `npm run dev` | Avvia dev server |
| `npm run build` | Build produzione |
| `npm run test` | Esegui test |
| `npm run test:coverage` | Test con coverage |
| `npm run lint` | Linting ESLint |
| `npm run typecheck` | Controllo tipi TypeScript |
| `npm run format` | Formattazione Prettier |

## Struttura Progetto

```
src/
├── __tests__/           # Test suite
│   ├── unit/            # Test unitari
│   ├── integration/     # Test integrazione
│   └── e2e/             # Test end-to-end
├── components/
│   ├── achievements/    # Sistema achievements
│   ├── charts/          # Grafici performance
│   ├── tiers/           # Tier system
│   └── ui/              # Componenti base
├── hooks/               # Custom hooks
├── i18n/                # Internazionalizzazione
│   └── locales/         # Traduzioni (5 lingue)
├── lib/                 # Configurazioni lib
├── pages/               # Pagine applicazione
├── services/            # Servizi API
├── stores/              # Zustand stores
│   ├── authStore.ts     # Autenticazione
│   ├── devicesStore.ts  # Dispositivi GPU
│   ├── transactionsStore.ts # Transazioni
│   ├── themeStore.ts    # Tema e preferenze
│   └── achievementsStore.ts # Achievements
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## Database Schema

Lo schema include:

- **profiles** - Profili utente con tier e referral
- **portfolio_entries** - Dispositivi GPU posseduti
- **team_members** - Membri del team (referral)
- **deposits** - Depositi USDT
- **withdrawals** - Prelievi
- **activity_logs** - Log attività
- **user_achievements** - Achievement sbloccati
- **loyalty_points** - Punti fedeltà
- **staking_pools** - Pool di staking
- **user_stakes** - Stakes utenti
- **promo_codes** - Codici promozionali
- **user_2fa** - 2FA settings

## Deploy

Il deploy avviene automaticamente su GitHub Actions:

1. **Lint & TypeCheck** - Controllo qualità codice
2. **Test** - Esecuzione test suite
3. **Build** - Build ottimizzato
4. **Deploy** - GitHub Pages
5. **Lighthouse** - Audit performance

### Prerequisiti CI

Aggiungi i seguenti secrets nel repository GitHub:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_APP_DOMAIN`
- `VITE_SENTRY_DSN` (opzionale)
- `SNYK_TOKEN` (opzionale)
- `SLACK_WEBHOOK_URL` (opzionale)

## Testing

```bash
# Esegui tutti i test
npm run test

# Test con UI interattiva
npm run test:ui

# Coverage report
npm run test:coverage
```

Coverage target: **70%+** per lines, functions, branches.

## PWA Features

- **Offline Support** - Cache intelligente per asset e API
- **Installabile** - Aggiungi alla home screen
- **Push Notifications** - Notifiche real-time
- **Background Sync** - Sync automatico

## Contribuire

1. Fork il repository
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Progetto privato.

---

Built with ❤️ by VYRO Team
