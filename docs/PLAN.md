# Koszty Budowy — Plan Projektu

## 1. Podsumowanie

Aplikacja webowa (PWA) do śledzenia kosztów budowy domu. Współdzielona między Grzesiem i Julią, dostępna z iPhone 16 Pro i iPhone 15 Pro. Bez logowania — zabezpieczona przez Cloudflare Tunnel + Cloudflare Access.

## 2. Analiza istniejących danych (arkusz "koszty")

Aktualny Excel zawiera 17 wpisów o strukturze:
| Kolumna | Opis | Przykład |
|---------|------|---------|
| Lp | Numer porządkowy | 1, 2, 3... |
| Nazwa | Nazwa wydatku | Notariusz, Przyłącze, dach |
| Data | Data wydatku (różne formaty) | 2025-02-25, "lipiec", "maj-czerwiec" |
| Koszt | Kwota w PLN | 5700, 3626.31 |
| Uwagi | Notatki tekstowe | "podliczone wszystkie do tej pory" |

**Suma dotychczasowa:** 95 527,05 zł

**Brakujące w oryginale (do dodania w apce):** kategoria wydatku, cel.

## 3. Stack technologiczny

### Backend
- **Runtime:** Node.js 22 LTS
- **Framework:** Fastify 5 (spójność z innymi apkami QC)
- **ORM:** Prisma 6 + PostgreSQL 16
- **Walidacja:** Zod
- **API:** REST JSON

### Frontend
- **Framework:** React 18 + Vite 6
- **Styling:** Tailwind CSS 3 + dark mode (class strategy)
- **UI Components:** Headless UI (dostępność)
- **Wykresy:** Recharts (lekki, React-native)
- **PWA:** vite-plugin-pwa (Workbox)
- **State:** Zustand (lekki, prosty)
- **Date picker:** react-day-picker
- **HTTP:** ky (lekki fetch wrapper)

### Infrastruktura
- **Konteneryzacja:** Docker Compose (app + postgres)
- **CI/CD:** GitHub Actions → budowanie obrazu Docker → GHCR
- **Reverse proxy:** Traefik (istniejący na Mac Mini M4, konfiguracja dynamic file — poza tym repo)
- **Zabezpieczenie:** Cloudflare Tunnel + Cloudflare Access (email OTP dla Grzesia i Julii)
- **Repozytorium:** github.com/holi87/koszty-budowy

## 4. Model danych (Prisma)

```prisma
model Category {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  icon      String?   // emoji ikona kategorii
  color     String?   // kolor hex dla wykresów
  expenses  Expense[]
  createdAt DateTime  @default(now())
}

model Expense {
  id         Int       @id @default(autoincrement())
  name       String
  amount     Decimal   @db.Decimal(12, 2)
  date       DateTime  @db.Date
  notes      String?
  goal       String?   // cel wydatku
  category   Category  @relation(fields: [categoryId], references: [id])
  categoryId Int
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

## 5. Endpointy API

### Expenses
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/expenses` | Lista wydatków (sortowanie, filtrowanie, paginacja) |
| GET | `/api/expenses/:id` | Pojedynczy wydatek |
| POST | `/api/expenses` | Dodaj wydatek |
| PUT | `/api/expenses/:id` | Edytuj wydatek |
| DELETE | `/api/expenses/:id` | Usuń wydatek |
| GET | `/api/expenses/stats` | Statystyki (suma, per kategoria, per miesiąc) |

### Categories
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/categories` | Lista kategorii |
| POST | `/api/categories` | Dodaj kategorię |
| PUT | `/api/categories/:id` | Edytuj kategorię |
| DELETE | `/api/categories/:id` | Usuń kategorię (tylko jeśli brak wydatków) |

### Import/Export
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/import/xlsx` | Import z pliku Excel |
| GET | `/api/export/xlsx` | Eksport do Excel |

## 6. Ekrany aplikacji

### 6.1 Ekran główny (Dashboard)
- **Duży widget sumy:** łączna kwota wydatków, wyraźna czcionka
- **Wykres liniowy:** koszty kumulowane w czasie
- **Wykres słupkowy:** koszty per miesiąc
- **Wykres kołowy:** podział na kategorie
- **Ostatnie 5 wydatków:** szybki podgląd
- **FAB (Floating Action Button):** "+" dodaj wydatek — zawsze widoczny

### 6.2 Lista wydatków
- Sortowanie po dacie/kwocie/kategorii
- Filtrowanie po kategorii i zakresie dat
- Wyszukiwanie tekstowe (nazwa, uwagi)
- Swipe-to-delete na mobile
- Tap na wiersz → edycja

### 6.3 Formularz dodawania/edycji wydatku
- **Nazwa:** text input, wymagane
- **Kwota:** number input z walidacją, suffix "zł", wymagane
- **Data:** date picker (react-day-picker), domyślnie dziś
- **Kategoria:** select z listy, wymagane
- **Cel:** text input, opcjonalne
- **Uwagi:** textarea, opcjonalne
- Przycisk "Zapisz" z walidacją po stronie klienta

### 6.4 Panel administracyjny (Kategorie)
- Lista kategorii z ikoną i kolorem
- Dodawanie nowej kategorii (nazwa, ikona emoji, kolor)
- Edycja/usuwanie kategorii
- Badge z liczbą wydatków w kategorii

### 6.5 Ustawienia
- Przełącznik dark/light mode
- Import danych z Excel
- Eksport danych do Excel

## 7. PWA — wymagania iPhone

- **manifest.json:** standalone display, polskie locale, ikony 192/512px
- **Service Worker:** cache-first dla statycznych zasobów, network-first dla API
- **apple-touch-icon:** dedykowane ikony iOS
- **apple-mobile-web-app-capable:** yes
- **apple-mobile-web-app-status-bar-style:** black-translucent (dark) / default (light)
- **viewport:** viewport-fit=cover dla obsługi notcha
- **Safe area insets:** env(safe-area-inset-*) w CSS

## 8. Dark mode

- Tailwind `class` strategy — przełącznik w UI
- Preferencja zapisywana w localStorage
- Domyślnie: system preference (`prefers-color-scheme`)
- Paleta kolorów:
  - Light: białe tło, slate-800 tekst, blue-600 akcent
  - Dark: slate-900 tło, slate-100 tekst, blue-400 akcent

## 9. Struktura katalogów

```
koszty-budowy/
├── CLAUDE.md                    # Główny kontekst dla Claude Code
├── README.md
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── build-and-push.yml
├── docs/
│   ├── API.md                   # Dokumentacja API
│   ├── DATA-MODEL.md            # Model danych
│   └── DEPLOYMENT.md            # Instrukcja wdrożenia
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── index.ts             # Entry point Fastify
│   │   ├── config.ts            # Env config
│   │   ├── routes/
│   │   │   ├── expenses.ts
│   │   │   ├── categories.ts
│   │   │   └── import-export.ts
│   │   ├── schemas/             # Zod schemas
│   │   │   ├── expense.ts
│   │   │   └── category.ts
│   │   └── services/
│   │       ├── expense.service.ts
│   │       ├── category.service.ts
│   │       └── stats.service.ts
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── public/
│   │   ├── icons/               # PWA ikony
│   │   └── manifest.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                 # Klient API (ky)
│       │   └── client.ts
│       ├── store/               # Zustand stores
│       │   ├── expenses.ts
│       │   └── ui.ts
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx
│       │   │   ├── BottomNav.tsx
│       │   │   └── Header.tsx
│       │   ├── expenses/
│       │   │   ├── ExpenseForm.tsx
│       │   │   ├── ExpenseList.tsx
│       │   │   └── ExpenseCard.tsx
│       │   ├── dashboard/
│       │   │   ├── TotalWidget.tsx
│       │   │   ├── MonthlyChart.tsx
│       │   │   ├── CategoryChart.tsx
│       │   │   └── RecentExpenses.tsx
│       │   ├── categories/
│       │   │   ├── CategoryForm.tsx
│       │   │   └── CategoryList.tsx
│       │   └── ui/
│       │       ├── ThemeToggle.tsx
│       │       ├── DatePicker.tsx
│       │       └── CurrencyInput.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── ExpensesPage.tsx
│       │   ├── AddExpensePage.tsx
│       │   ├── AdminPage.tsx
│       │   └── SettingsPage.tsx
│       ├── hooks/
│       │   ├── useExpenses.ts
│       │   └── useCategories.ts
│       └── styles/
│           └── globals.css
```

## 10. Docker

### docker-compose.yml
- **postgres:** PostgreSQL 16 Alpine, named volume
- **backend:** Node.js 22, zależy od postgres, healthcheck
- **frontend:** Nginx Alpine, serwuje build Vite

### GitHub Actions workflow
- Trigger: push na `main`
- Build multi-stage obrazy (backend + frontend)
- Push do ghcr.io/holi87/koszty-budowy-backend i /frontend
- Tagowanie: `latest` + SHA commit

## 11. Pierwsze uruchomienie — pusta baza

Aplikacja startuje z **pustą bazą danych**. Brak seeda — użytkownicy dodają wszystko ręcznie przez telefon (kategorie przez panel admina, wydatki przez formularz).

Sugerowane kategorie do ręcznego dodania:
1. 🏛️ Formalności, 2. 🔌 Przyłącza, 3. 🏗️ Budowa, 4. 🚿 Instalacje, 5. 🪟 Stolarka, 6. 🚽 Wynajem, 7. 📐 Projektowanie, 8. 💡 Inne

**Ważne:** Dashboard i lista muszą mieć ładne empty states (zachęta do dodania pierwszego wydatku/kategorii).

## 12. Reverse proxy i dostęp

Traefik konfigurowany osobno (dynamic file), poza tym repo. Domena: `koszty.holak.app`.

Cloudflare Access: polityka email OTP, dozwolone adresy Grzesia i Julii.

Kontenery nie zawierają Traefik labels — routing definiowany w pliku dynamicznym Traefika.

## 13. Priorytety implementacji

### Faza 1 — MVP (Core)
1. Backend: Prisma schema + migracje
2. Backend: CRUD expenses + categories
3. Frontend: Dashboard z sumą
4. Frontend: Formularz dodawania wydatku
5. Frontend: Lista wydatków
6. PWA: manifest + service worker
7. Docker Compose + GitHub Actions

### Faza 2 — Polish
8. Wykresy (monthly, category)
9. Panel admina (kategorie)
10. Dark mode
11. Filtrowanie/sortowanie listy
12. Import/export Excel

### Faza 3 — Nice to have
13. Swipe-to-delete
14. Offline support (queue mutations)
15. Push notifications (wydatek dodany przez drugą osobę)
