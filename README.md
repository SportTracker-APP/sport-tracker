# Sport Tracker

## Tester en local avant de pousser

L'app en production est sur Vercel + Render. Pour tester une modification avant push, lance toujours le front et le backend en local.

### 1. Configuration locale

Crée ces fichiers si besoin :

```bash
cp apps/web/env.local.example apps/web/.env.local
cp backend/env.local.example backend/.env.local
```

Le front local doit pointer vers le backend local :

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Le backend charge `backend/.env.local` avant `backend/.env`. Tu peux donc garder les secrets dans `.env`, et ne surcharger en local que les URLs comme :

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
STRAVA_CALLBACK_URL=http://localhost:4000/strava/callback
```

### 2. Lancer l'app locale

Terminal 1 :

```bash
npm run dev:backend
```

Terminal 2 :

```bash
npm run dev:web
```

Puis ouvre :

```text
http://localhost:3000
```

### 3. Vérifier avant push

```bash
npm run check
```

Cette commande vérifie :

- le build backend Nest
- le typecheck frontend Next

### 4. Migrations BDD

Pour appliquer les migrations sur la base configurée dans `backend/.env` ou `backend/.env.local` :

```bash
npm run db:migrate
```

Conseil : dès que possible, utilise une base Neon de dev pour le local et garde la base production pour Render.
