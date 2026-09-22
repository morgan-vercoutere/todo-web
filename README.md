# todo-web

Interface Vue 3 + Vite + TypeScript pour `todo-api`.

## Démarrage

```bash
npm install
copy .env.example .env
npm run api:types
npm run dev
```

L'application écoute sur `http://localhost:5173` et utilise `VITE_API_URL` pour
la base URL de l'API.

Le fichier `openapi.json` est le contrat fourni par `todo-api`. Après une évolution
du contrat, remplacez-le par la nouvelle version puis exécutez `npm run api:types`.

## Filtre d'urgence

Le filtre **Urgence** propose **Toutes** (paramètre `urgent` absent), **Urgentes**
(`urgent=true`, priorité haute) et **Non urgentes** (`urgent=false`, priorité basse
ou moyenne). Il se combine avec les filtres d'état, de priorité et d'échéance :
des critères contradictoires donnent une liste vide. Les filtres sont conservés
dans l'URL ; changer l'urgence ramène à la première page.

Une valeur `urgent` vide, invalide ou répétée (même identique) affiche une erreur
de validation équivalente au rejet HTTP 400 de l'API, sans requête de liste.
L'URL reste inchangée jusqu'à la sélection explicite d'une option du filtre
Urgence ; les autres filtres ne masquent pas cette erreur.

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run api:check
npm run build
```
