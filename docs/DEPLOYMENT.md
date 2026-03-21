# Deployment — Koszty Budowy

## Środowisko

- **Serwer:** Mac Mini M4 (10.10.10.8)
- **OS:** macOS
- **Konteneryzacja:** Docker Desktop / OrbStack
- **Reverse proxy:** Traefik (istniejący, konfiguracja dynamic file — poza tym repo)
- **Tunel:** Cloudflare Tunnel (istniejący)
- **Auth:** Cloudflare Access (email OTP)

## Zmienne środowiskowe

### Backend (.env)
```env
DATABASE_URL=postgresql://koszty:secretpassword@postgres:5432/koszty_budowy
PORT=3001
NODE_ENV=production
```

### Frontend (build-time)
```env
VITE_API_URL=/api
```

## docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: koszty_budowy
      POSTGRES_USER: koszty
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secretpassword}
    volumes:
      - koszty_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U koszty -d koszty_budowy"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/holi87/koszty-budowy-backend:latest
    # build: ./backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://koszty:${DB_PASSWORD:-secretpassword}@postgres:5432/koszty_budowy
      PORT: "3001"
      NODE_ENV: production
    ports:
      - "3001:3001"

  frontend:
    image: ghcr.io/holi87/koszty-budowy-frontend:latest
    # build: ./frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "3080:80"

volumes:
  koszty_pgdata:
```

**Uwaga:** Brak Traefik labels — routing konfigurowany osobno w pliku dynamicznym Traefika (poza tym repo). Porty `3001` i `3080` wystawione na potrzeby Traefik dynamic config.

## Dockerfiles

### backend/Dockerfile
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

### frontend/Dockerfile
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### frontend/nginx.conf
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## GitHub Actions

Plik: `.github/workflows/build-and-push.yml`

Trigger: push na branch `main`

Kroki:
1. Checkout kodu
2. Login do GHCR (GITHUB_TOKEN)
3. Build + push backend image (`ghcr.io/holi87/koszty-budowy-backend:latest` + `:sha-XXXXXX`)
4. Build + push frontend image (`ghcr.io/holi87/koszty-budowy-frontend:latest` + `:sha-XXXXXX`)

## Pierwsze uruchomienie

```bash
# 1. Sklonuj repo
git clone https://github.com/holi87/koszty-budowy.git
cd koszty-budowy

# 2. Ustaw hasło DB
echo "DB_PASSWORD=twoje_haslo" > .env

# 3. Uruchom
docker compose up -d

# 4. Gotowe — dodaj kategorie i wydatki przez interfejs
curl http://localhost:3001/api/categories
```

## Cloudflare Access

1. W Cloudflare Zero Trust → Access → Applications
2. Dodaj aplikację: `koszty.holak.app`
3. Policy: Allow, email = grzesiek@..., julia@...
4. Identity provider: One-time PIN (email OTP)

## Backup

PostgreSQL volume `koszty_pgdata` backupowany przez istniejący system Restic na UNAS Pro.

Dodatkowy dump:
```bash
docker compose exec postgres pg_dump -U koszty koszty_budowy > backup_$(date +%Y%m%d).sql
```
