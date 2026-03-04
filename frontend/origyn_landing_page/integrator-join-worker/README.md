# Worker Cloudflare – Formulaire Integrator

Pas d’Express : un **Worker** reçoit le POST du formulaire et envoie l’email via l’API **Resend**.

## Prérequis

- Compte [Resend](https://resend.com) (offre gratuite)
- Clé API Resend (Dashboard → API Keys)

## Déploiement

Depuis le dossier du worker : `frontend/origyn_landing_page/integrator-join-worker`

1. `cd frontend/origyn_landing_page/integrator-join-worker`
2. Installer Wrangler : `npm i -g wrangler` ou `npx wrangler`
3. Se connecter : `npx wrangler login`
4. Déclarer le secret Resend : `npx wrangler secret put RESEND_API_KEY` (coller la clé API)
5. Déployer : `npx wrangler deploy`

Tu obtiens une URL du type `https://integrator-join.<ton-compte>.workers.dev`.

## Config

- **TO_EMAIL** : déjà dans `wrangler.toml` (par défaut `admin@origyn.ch`). Pour changer : variable dans `[vars]` ou secret.
- **FROM_EMAIL** : en gratuité Resend, garder `onboarding@resend.dev`. Avec domaine vérifié, tu peux mettre ton adresse dans `[vars]`.

## Frontend

Au build du canister, définir l’URL du Worker :

```
VITE_INTEGRATOR_JOIN_API_URL=https://integrator-join.<ton-compte>.workers.dev
```

Sans cette variable, le formulaire utilise `mailto:` (ouvre le client mail).
