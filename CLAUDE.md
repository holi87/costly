# CLAUDE.md — Koszty Budowy

## Opis projektu

Aplikacja webowa o nazwie "Costly" (PWA) do śledzenia kosztów budowy domu. Używana przez 2 osoby (Grzesiek i Julia) na iPhone 16 Pro i iPhone 15 Pro. Brak logowania — dostęp zabezpieczony przez Cloudflare Tunnel + Cloudflare Access.

## Stack

- **Backend:** Fastify 5 + TypeScript + Prisma 6 + PostgreSQL 16 + Zod
- **Frontend:** React 18 + Vite 6 + Tailwind CSS 3 + Zustand + Recharts + react-day-picker + Headless UI
- **PWA:** vite-plugin-pwa (Workbox)
- **Konteneryzacja:** Docker Compose (postgres + backend + frontend/nginx)
- **CI/CD:** GitHub Actions → GHCR (ghcr.io/holi87/koszty-budowy-*)
- **Node.js:** 22 LTS

## Kluczowe wymagania

1. **Język UI:** polski
2. **Waluta:** PLN (zł), Decimal(12,2)
3. **Dark mode:** Tailwind class strategy, przełącznik + system preference
4. **Mobile-first:** projektuj dla iPhone, testuj z safe-area-inset
5. **PWA:** standalone display, apple-touch-icon, cache-first statyczne, network-first API
6. **Bez auth:** żadnego systemu logowania, Cloudflare Access załatwia dostęp

## Struktura repozytorium

```
koszty-budowy/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── .github/workflows/build-and-push.yml
├── docs/                    # Dokumentacja szczegółowa
│   ├── API.md
│   ├── DATA-MODEL.md
│   └── DEPLOYMENT.md
├── backend/                 # Fastify API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── routes/          # expenses.ts, categories.ts, import-export.ts
│       ├── schemas/         # Zod: expense.ts, category.ts
│       └── services/        # expense.service.ts, category.service.ts, stats.service.ts
├── frontend/                # React SPA
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── public/
│   │   ├── icons/
│   │   └── manifest.json
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── api/client.ts
│       ├── store/           # Zustand: expenses.ts, ui.ts
│       ├── components/      # layout/, expenses/, dashboard/, categories/, ui/
│       ├── pages/           # Dashboard, ExpensesPage, AddExpensePage, AdminPage, SettingsPage
│       ├── hooks/
│       └── styles/globals.css
```

## Konwencje kodu

### Backend (TypeScript)
- Fastify z @fastify/cors, @fastify/static
- Routy jako Fastify plugins (export default async function)
- Zod schema → Fastify schema przez zod-to-json-schema
- Prisma Client: singleton w src/db.ts
- Decimal handling: Prisma Decimal → string w JSON → parseFloat na froncie
- Error handling: Fastify error handler, zwracaj {error: string, statusCode: number}
- Env vars: DATABASE_URL, PORT (default 3001), NODE_ENV

### Frontend (React + TypeScript)
- Funkcyjne komponenty, named exports
- Zustand stores: jeden per domena (expenses, ui/theme)
- API client: ky z base URL z env VITE_API_URL
- Tailwind: mobile-first, dark: wariant, custom colors w tailwind.config.ts
- Formularze: kontrolowane komponenty, walidacja inline
- Routing: react-router-dom v6, BottomNav na mobile
- Daty: dayjs (lekki, locale pl)
- Formatowanie walut: Intl.NumberFormat('pl-PL', {style:'currency', currency:'PLN'})

### Docker
- Backend: multi-stage (builder + runtime), node:22-alpine
- Frontend: multi-stage (build + nginx:alpine), nginx serwuje SPA z try_files
- docker-compose.yml: postgres:16-alpine + backend + frontend, named volume dla DB

## Polecenia deweloperskie

```bash
# Backend
cd backend && npm install
npx prisma migrate dev
npm run dev                  # Fastify dev server :3001

# Frontend
cd frontend && npm install
npm run dev                  # Vite dev server :5173

# Docker
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

## Endpointy API

### Expenses
- `GET    /api/expenses`          — lista (query: ?category=&from=&to=&sort=date&order=desc&page=1&limit=20)
- `GET    /api/expenses/:id`      — szczegóły
- `POST   /api/expenses`          — dodaj {name, amount, date, categoryId, goal?, notes?}
- `PUT    /api/expenses/:id`      — edytuj
- `DELETE /api/expenses/:id`      — usuń
- `GET    /api/expenses/stats`    — {total, byCategory[], byMonth[]}

### Categories
- `GET    /api/categories`        — lista z _count.expenses
- `POST   /api/categories`        — dodaj {name, icon?, color?}
- `PUT    /api/categories/:id`    — edytuj
- `DELETE /api/categories/:id`    — usuń (403 jeśli ma wydatki)

### Import/Export
- `POST   /api/import/xlsx`       — multipart upload
- `GET    /api/export/xlsx`       — pobierz plik .xlsx

## Model danych (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  icon      String?
  color     String?
  expenses  Expense[]
  createdAt DateTime  @default(now())
}

model Expense {
  id         Int       @id @default(autoincrement())
  name       String
  amount     Decimal   @db.Decimal(12, 2)
  date       DateTime  @db.Date
  notes      String?
  goal       String?
  category   Category  @relation(fields: [categoryId], references: [id])
  categoryId Int
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

## Pierwsze uruchomienie

Aplikacja startuje z **pustą bazą danych**. Użytkownicy dodają wszystkie wydatki i kategorie ręcznie przez interfejs mobilny.

### Sugerowane kategorie startowe (do dodania przez panel admina)
1. 🏛️ Formalności — #6366f1 (indigo)
2. 🔌 Przyłącza — #f59e0b (amber)
3. 🏗️ Budowa — #ef4444 (red)
4. 🚿 Instalacje — #3b82f6 (blue)
5. 🪟 Stolarka — #10b981 (emerald)
6. 🚽 Wynajem — #8b5cf6 (violet)
7. 📐 Projektowanie — #ec4899 (pink)
8. 💡 Inne — #6b7280 (gray)

**Ważne:** Dashboard i lista powinny ładnie wyglądać zarówno z pustą bazą (empty state z zachętą do dodania pierwszego wydatku), jak i z setkami wpisów.

## Wymagania PWA (iPhone)

- `manifest.json`: name "Koszty Budowy", display "standalone", theme_color, background_color, ikony 192+512
- `index.html` meta tagi: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style
- `viewport`: width=device-width, initial-scale=1, viewport-fit=cover
- CSS: padding z env(safe-area-inset-*) w BottomNav i Header
- vite-plugin-pwa: generateSW strategy, runtimeCaching dla /api/*

## Dark mode

- Tailwind: darkMode: 'class'
- Zustand store (ui.ts): theme = 'light' | 'dark' | 'system'
- Na mount: sprawdź localStorage('theme'), fallback na matchMedia('prefers-color-scheme: dark')
- Przełącznik: ikona ☀️/🌙 w header
- Paleta CSS vars:
  - Light: bg-white, text-slate-800, accent-blue-600
  - Dark: bg-slate-900, text-slate-100, accent-blue-400

## Ważne

- Kwoty ZAWSZE jako Decimal, nigdy float
- Walidacja kwoty na froncie: regex `/^\d+([.,]\d{0,2})?$/`, zamiana `,` na `.`
- Daty w UTC, wyświetlanie w timezone Europe/Warsaw
- API zwraca amount jako string (Prisma Decimal), front parsuje
- Kategoria jest wymagana — nie da się dodać wydatku bez kategorii
- Usunięcie kategorii niemożliwe gdy ma przypisane wydatki
