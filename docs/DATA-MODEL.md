# Data Model — Koszty Budowy

## ERD

```
┌──────────────┐       ┌──────────────────┐
│   Category   │       │     Expense      │
├──────────────┤       ├──────────────────┤
│ id       PK  │───┐   │ id          PK   │
│ name     UQ  │   │   │ name             │
│ icon         │   │   │ amount  Dec(12,2)│
│ color        │   └──▶│ categoryId  FK   │
│ createdAt    │       │ date        Date │
└──────────────┘       │ goal             │
                       │ notes            │
                       │ createdAt        │
                       │ updatedAt        │
                       └──────────────────┘
```

## Prisma Schema

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
  icon      String?   // emoji np. 🏗️
  color     String?   // hex np. #ef4444
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

  @@index([date])
  @@index([categoryId])
}
```

## Uwagi dotyczące typów

### amount (Decimal)
- Prisma zwraca `Prisma.Decimal` → serializuje się jako **string** w JSON
- Frontend parsuje: `parseFloat(expense.amount)`
- Formularz wysyła jako string: `"5700.00"`
- Walidacja backendu: regex `/^\d+(\.\d{1,2})?$/`, wartość > 0
- **Nigdy nie używaj float/double do kwot**

### date (Date)
- PostgreSQL typ `DATE` (bez czasu)
- API przyjmuje i zwraca format `YYYY-MM-DD`
- Frontend wyświetla w formacie polskim: `dd.MM.yyyy` (np. "25.02.2025")
- Strefa czasowa: Europe/Warsaw do wyświetlania

### Indeksy
- `date` — sortowanie chronologiczne, filtrowanie zakresów
- `categoryId` — filtrowanie po kategorii, JOIN-y
