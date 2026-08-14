# Skyle

Bot Discord + dashboard web, monorepo npm workspaces.

```
apps/bot/         bot Discord (discord.js v14 + TypeScript)
apps/dashboard/   dashboard web (Next.js + NextAuth/Discord OAuth)
packages/db/      schema Prisma + client condiviso da bot e dashboard
```

Fase 1 (attuale): moderazione, automod, anti-raid, utility, dashboard con le
relative pagine di configurazione. Musica e funzioni di community (livelli,
ticket, giveaway, reaction roles) sono nello schema ma non ancora implementate
— compaiono in dashboard come "presto disponibile".

## Setup

### 1. App Discord

1. Crea un'applicazione su [Discord Developer Portal](https://discord.com/developers/applications).
2. Sezione **Bot**: genera/rigenera il token, e attiva i privileged intent
   **Server Members Intent** e **Message Content Intent**.
3. Sezione **OAuth2**: annota Client ID e Client Secret, aggiungi come redirect
   URI `http://localhost:3000/api/auth/callback/discord` (e l'equivalente in
   produzione quando pubblichi la dashboard).

> Non incollare mai token o secret in chat/issue/commit: se un token è stato
> esposto, rigeneralo prima di usarlo.

### 2. Database

Consigliato: [Neon](https://neon.tech) (Postgres serverless, piano gratuito).
Copia sia la connection string **pooled** (`DATABASE_URL`) sia quella
**diretta** (`DIRECT_URL`, usata da Prisma Migrate).

### 3. Variabili d'ambiente

Copia ogni `.env.example` in `.env` nella stessa cartella e compila i valori:

- `packages/db/.env`
- `apps/bot/.env`
- `apps/dashboard/.env`

### 4. Installazione e database

```bash
npm install
npm run db:migrate
```

### 5. Comandi slash

Per svilupparlo su un server di test (istantaneo, invece di aspettare fino a
un'ora per la registrazione globale), imposta `DISCORD_GUILD_ID` in
`apps/bot/.env` con l'ID del server, poi:

```bash
npm run deploy:commands
```

Rimuovi `DISCORD_GUILD_ID` (o lascialo vuoto) e rilancia il comando quando sei
pronto a registrare i comandi globalmente per la produzione.

### 6. Avvio in sviluppo

```bash
npm run dev:bot
npm run dev:dashboard
```

## Hosting consigliato

- **Database**: Neon.
- **Bot**: Railway (o un VPS economico tipo Hetzner se in futuro il carico
  audio della musica cresce) — serve un processo sempre attivo, non gira su
  hosting serverless.
- **Dashboard**: Vercel.
