# MonTour Web — File d'attente virtuelle en temps réel

Interface React de MonTour : pages client (mobile), poste agent, administration et écran de salle.

**Backend (API)** : https://github.com/diongrace/montour-api
**Démo en ligne** : bientôt — compte agent : `agent@montour.ci` / `MonTour2026!`

## Écrans

| Écran | Adresse |
|---|---|
| Choix du service (le QR code mène ici) | `/e/centre-demo` |
| Mon ticket, puis « C'est votre tour » | `/t/{jeton}` |
| Connexion agent / admin | `/connexion` |
| Poste agent | `/agent` |
| Tableau admin | `/admin` |
| Écran de salle (TV) | `/salle/centre-demo` |

## Stack

React 19 · Vite · React Router · WebSocket STOMP (`@stomp/stompjs`)

## Lancer en local

Le backend [montour-api](https://github.com/diongrace/montour-api) doit tourner sur `http://localhost:8080`.

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173.
