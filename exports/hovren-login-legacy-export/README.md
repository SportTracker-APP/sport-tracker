# HOVREN Login Legacy Export

Export autonome de l'ancienne page de connexion HOVREN, prepare pour reutilisation dans un autre projet Next.js.

Cet export est une copie. Il ne remplace, ne deplace et ne supprime aucun fichier de l'application HOVREN actuelle.

## Structure

```text
hovren-login-legacy-export/
├── app/(auth)/login/page.tsx
├── components/
│   ├── auth/LoginForm.tsx
│   ├── theme/auth-theme-toggle.tsx
│   └── ui/
│       ├── button.tsx
│       └── input.tsx
├── features/landing/components/x-social-link.tsx
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── schemas/auth.schema.ts
│   └── utils.ts
├── store/auth-store.ts
├── styles/globals.css
└── public/
    ├── apple-touch-icon.png
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── images/
    │   ├── brand/hovren-x-twitter-banner.png
    │   └── sidebar/sidebar-pine-forest.svg
    └── landing/alpine-forest-card.png
```

## Contenu inclus

- Page Next.js App Router de connexion.
- Formulaire de connexion et mode "mot de passe oublie" dans la meme card.
- Validation Zod.
- Integration React Hook Form.
- Client API Axios avec refresh token.
- Service auth utilise par la page.
- Store Zustand utilise apres connexion.
- Composants UI locaux necessaires au formulaire.
- Toggle de theme auth.
- Lien social X utilise dans le footer de la page.
- Styles globaux necessaires au rendu auth.
- Assets locaux utiles au rendu visuel ou a la marque.

## Dependances necessaires

Le projet cible doit installer ou fournir les dependances suivantes :

```bash
npm install next react react-dom axios zustand zod react-hook-form @hookform/resolvers lucide-react class-variance-authority radix-ui clsx tailwind-merge
```

Tailwind CSS doit egalement etre configure dans le projet cible. Les styles fournis dans `styles/globals.css` viennent de HOVREN et contiennent plus que la page auth : ils peuvent etre conserves tels quels pour un rendu proche, puis nettoyes si besoin.

## Variables d'environnement attendues

Aucun secret n'est inclus dans cet export.

Le client API lit uniquement :

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

Si cette variable est absente, le client utilise `http://localhost:4000`.

## Endpoints attendus cote backend

La page fonctionne avec une API compatible avec ces routes :

```text
POST /auth/login
POST /auth/forgot-password
POST /auth/refresh
POST /auth/logout
```

Format attendu pour `POST /auth/login` :

```ts
{
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    email: string;
    role?: "USER" | "ADMIN";
    avatarUrl?: string | null;
  };
}
```

Format attendu pour `POST /auth/forgot-password` :

```ts
{
  message: string;
}
```

## Reutilisation dans un autre projet

1. Copier les dossiers `app`, `components`, `features`, `lib`, `store`, `styles` et `public` dans le projet cible.
2. Verifier que l'alias TypeScript `@/*` pointe bien vers la racine applicative. Sinon, adapter les imports.
3. Importer `styles/globals.css` dans le layout racine du projet cible.
4. Definir `NEXT_PUBLIC_API_URL`.
5. Adapter les routes publiques si besoin :
   - `/register`
   - `/conditions`
   - `/confidentialite`
   - `/refuge`
6. Adapter les contrats API si le backend cible ne suit pas exactement les formats ci-dessus.

## Elements specifiques a HOVREN a adapter

- Nom de marque, wording et slogan.
- Redirection apres connexion vers `/refuge`.
- URL sociale `https://x.com/hovrenapp`.
- Clefs localStorage du theme : `sport-theme-nature` et `hovren-theme-preference`.
- Classes CSS liees au theme nature HOVREN.
- Couleurs, images et assets de marque.
- Shape utilisateur et logique refresh token si le backend cible differe.

## Exclusions volontaires

L'archive n'inclut pas :

- fichiers `.env` reels ;
- secrets ou cles API ;
- `node_modules` ;
- `.next` ;
- caches ;
- fichiers de build ;
- backend ;
- base de donnees ;
- migrations ;
- autres pages applicatives non necessaires a la page de connexion.
