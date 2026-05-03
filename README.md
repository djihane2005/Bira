# BIRABRICK Project

Sustainable construction materials for Algeria.

## Architecture

- **Frontend** : Dossier `docs/` (HTML/JS statique).
- **Backend** : Dossier `src/` (Node.js/Express).

## Installation Locale

### 1. Backend (Express)

Ouvrez un terminal à la racine du projet :

```bash
npm install
npm start
```

Le serveur backend démarrera sur [http://127.0.0.1:3000](http://127.0.0.1:3000).
Vous pouvez vérifier s'il est actif sur [http://127.0.0.1:3000/health](http://127.0.0.1:3000/health).

### 2. Configuration Email (Gmail)

Pour envoyer des emails localement :
1. Générez un **Mot de passe d'application** Gmail (Sécurité > Validation en deux étapes > Mots de passe des applications).
2. Créez/modifiez le fichier `.env` à la racine :
```env
PORT=3000
NODE_ENV=development
COOKIE_SECRET=votre_secret_ici
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application
EMAIL_TO=email_reception@gmail.com
FRONTEND_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```
3. Redémarrez le serveur après modification.

### 3. Frontend (Live Server)

Ouvrez le dossier dans VS Code et lancez **Live Server** sur le fichier `docs/index.html`.
L'URL devrait être quelque chose comme [http://127.0.0.1:5500/docs/index.html](http://127.0.0.1:5500/docs/index.html).

Accédez à la section Contact pour tester l'envoi.

## Déploiement

Pour les instructions de déploiement sur Render, consultez [DEPLOYMENT.md](./DEPLOYMENT.md).

## Sécurité

Le projet utilise :
- **CSRF Protection** : Via cookies signés et headers personnalisés.
- **CORS** : Configuré pour autoriser Netlify et GitHub Pages en production, et localhost en développement.
- **Rate Limiting** : Limite le nombre de messages envoyés.
- **Helmet** : Sécurisation des headers HTTP.
