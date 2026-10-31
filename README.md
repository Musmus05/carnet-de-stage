# Herbarium

Suivez vos candidatures de stage, le CV envoyé à chacune, et apprenez de chaque réponse.
*Track your internship applications, the CV you sent to each, and learn from every answer.*

- **Candidatures** : entreprise, poste, type de stage (étranger, recherche, startup, grand groupe…), canal, dates, statut, contact, notes et retours reçus.
- **CV versionnés** : chaque version en PDF, liée aux candidatures où elle est partie.
- **Vue d'ensemble** : pipeline, relances à faire, taux de réponse et délai médian, réponses par type de stage, par CV et par canal, avec une phrase « à retenir ».
- **Bilingue** français / anglais, comptes individuels, données privées (Row Level Security).

Chaque candidature a sa planche d'herbier dessinée avec [p5.brush](https://github.com/acamposuribe/p5.brush) : la plante pousse avec la candidature (bourgeon, fleur à l'entretien, fruit pour une offre). Voir [DESIGN.md](DESIGN.md).

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage) · p5.brush · déployable sur Vercel.

## Démarrer en local

Prérequis : Node 22+, Docker Desktop.

```bash
npm install
npx supabase start          # Postgres, Auth, Storage en local (Docker)
cp .env.example .env.local  # puis collez l'URL et la clé « Publishable » affichées
npm run dev
```

Ouvrez http://localhost:3000. La base locale est remplie avec un compte de démonstration fictif :
`demo@herbarium.test` / `demo-herbarium-2026` (local uniquement, voir `supabase/seed.sql`).

Les e-mails locaux (liens magiques) arrivent dans Mailpit : http://127.0.0.1:54324.

Commandes utiles :

| Commande | Effet |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sans émission |
| `npm run build` | build de production |
| `npx supabase db reset` | recrée la base, applique migrations et seed |
| `npm run db:types` | régénère `src/lib/supabase/types.ts` |

## Mettre en production

1. Créez un projet sur [supabase.com](https://supabase.com) et appliquez les migrations : `npx supabase link` puis `npx supabase db push`.
2. Dans Supabase > Authentication > URL Configuration, ajoutez votre domaine et `https://<domaine>/auth/callback`.
3. Importez le dépôt sur Vercel avec les variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et `NEXT_PUBLIC_SITE_URL`.

## Organisation du dépôt

```
src/app              routes (landing, login, /app/…)
src/components       composants partagés (planche, étiquette, UI)
src/lib              domaine, statistiques, dates, i18n, clients Supabase
supabase/migrations  schéma SQL + RLS + stockage
PRODUCT.md           ce que fait le produit et pour qui
DESIGN.md            système visuel
```

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) : branches `main` / `dev` / `feat/*`, Conventional Commits, PR vers `dev`.

## Licence

[MIT](LICENSE)
