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

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run api:check
npm run build
```
