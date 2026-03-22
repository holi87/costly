# 🏠 Koszty Budowy

Aplikacja PWA do śledzenia kosztów budowy domu. Zaprojektowana do użytku mobilnego (iPhone) przez 2 osoby.

## Funkcje

- ➕ Szybkie dodawanie wydatków z telefonu
- 📊 Dashboard z wykresami (miesięczne, kategorie, kumulowane)
- 🏷️ Kategorie wydatków z emoji i kolorami
- 🔍 Filtrowanie i wyszukiwanie
- 🌙 Dark mode (automatyczny + ręczny)
- 📱 PWA — instalacja na ekranie głównym iPhone
- 📥 Import/eksport Excel
- 🔒 Bez logowania — zabezpieczone Cloudflare Access

## Stack

| Warstwa | Technologia |
|---------|------------|
| Backend | Fastify 5, TypeScript, Prisma 6, PostgreSQL 16 |
| Frontend | React 18, Vite 6, Tailwind CSS, Zustand, Recharts |
| PWA | vite-plugin-pwa (Workbox) |
| Infra | Docker Compose, GitHub Actions, GHCR |

## Szybki start (development)

```bash
# Wymagania: Node.js 22, Docker (dla PostgreSQL)

# 1. Baza danych
docker run -d --name koszty-pg \
  -e POSTGRES_DB=koszty_budowy \
  -e POSTGRES_USER=koszty \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Backend
cd backend
cp .env.example .env    # Ustaw DATABASE_URL
npm install
npx prisma migrate dev
npm run dev              # http://localhost:3001

# 3. Frontend
cd frontend
npm install
npm run dev              # http://localhost:5173
```

## Deployment (Docker Compose)

```bash
# 1. Sklonuj
git clone https://github.com/holi87/costly.git
cd costly

# 2. Konfiguracja
echo "DB_PASSWORD=twoje_silne_haslo" > .env

# 3. Uruchom
docker compose up -d

# 4. Gotowe! Dodaj kategorie i wydatki przez interfejs.
# Traefik routing konfigurowany osobno (dynamic file).
```

## CI/CD

Push na `main` → GitHub Actions buduje obrazy Docker → push do GHCR:
- `ghcr.io/holi87/koszty-budowy-backend:latest`
- `ghcr.io/holi87/koszty-budowy-frontend:latest`

Na serwerze: `docker compose pull && docker compose up -d`

## Struktura projektu

```
├── CLAUDE.md                 # Kontekst dla Claude Code
├── docker-compose.yml
├── .github/workflows/        # CI/CD
├── docs/                     # Dokumentacja
│   ├── API.md
│   ├── DATA-MODEL.md
│   └── DEPLOYMENT.md
├── backend/                  # Fastify API
│   ├── prisma/               # Schema + migracje
│   └── src/                  # Routes, services, schemas
├── frontend/                 # React SPA
│   ├── public/               # PWA manifest + ikony
│   └── src/                  # Components, pages, stores
```

## Zabezpieczenia

Aplikacja nie posiada własnego systemu logowania. Dostęp kontrolowany przez:
1. **Cloudflare Tunnel** — tunel do Mac Mini M4
2. **Cloudflare Access** — polityka email OTP, dozwolone: 2 adresy email

## Changelog

### v1.2.0 (2026-03-22)
- ✨ Wiele kategorii na wydatek (M:N) — multiselect chipów w formularzu
- ✨ Pole "Wsparcie" — kwota wsparcia finansowego, sumowana osobno na dashboardzie
- ✨ Dashboard: nowy widget "Wsparcie" (fioletowy) z sumą od teściowej
- ♻️ Migracja danych: istniejące przypisania kategorii automatycznie przeniesione do nowej tabeli join
- ✨ Export Excel: kolumny Wsparcie i Status (Zapłacone/Planowane)

### v1.1.1 (2026-03-22)
- 🐛 Fix: API URLs budowane relatywnie do bieżącej strony zamiast do roota — edycja wydatków nie działała na podstronach
- 🐛 Fix: Zod `updateExpenseSchema` — `.partial()` na `.refine()` powodował błędy walidacji przy edycji
- 🐛 Fix: Filtr kategorii akceptuje zarówno string jak i tablicę query params

### v1.1.0 (2026-03-22)
- ✨ Wydatki planowane — toggle "Zapłacone / Planowane" z podziałem sum na dashboardzie
- ✨ Multiselect kategorii w filtrach (chipy z kolorami)
- ✨ Ikona PWA i favicon (domek z "zł")
- ✨ Inline edycja/usuwanie wydatków z listy
- ✨ Selector ilości na stronę (10/25/50)

### v1.0.0 (2026-03-21)
- 🎉 Pierwszy release — pełna aplikacja PWA do śledzenia kosztów budowy

## Licencja

Prywatne repozytorium. Wszelkie prawa zastrzeżone.
