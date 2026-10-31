# Contribuer

## Branches

| Branche | Rôle | Protection |
|---|---|---|
| `main` | production, toujours déployable | PR obligatoire depuis `dev`, CI verte |
| `dev` | intégration de la prochaine version | PR obligatoire, CI verte |
| `feat/…`, `fix/…`, `chore/…`, `docs/…` | une tâche | partent de `dev`, reviennent dans `dev` |

```bash
git switch dev && git pull
git switch -c feat/export-csv
# … commits …
git push -u origin feat/export-csv
gh pr create --base dev
```

Une release = une PR `dev` → `main`, fusionnée en *merge commit* et taguée (`v0.2.0`). Les PR de fonctionnalité vers `dev` sont fusionnées en *squash*.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/fr/) : `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `ci:`.
Exemple : `feat(cvs): afficher le taux de réponse par version`.

## Avant d'ouvrir une PR

```bash
npm run lint && npm run typecheck && npm run build
```

- Toute modification de schéma passe par une nouvelle migration dans `supabase/migrations/` (jamais en modifiant une migration déjà fusionnée), puis `npm run db:types`.
- Tout texte visible passe par `src/lib/i18n/dictionaries.ts`, en français **et** en anglais.
- Les choix visuels suivent [DESIGN.md](DESIGN.md). Le skill [Impeccable](https://impeccable.style) est installé dans `.claude/skills/impeccable` : `/impeccable critique <page>` ou `npx impeccable detect src/` avant de proposer un changement d'interface.
