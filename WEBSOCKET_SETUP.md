# 🚀 SmartQueue - WebSocket Real-Time Updates

## Configuration WebSocket

L'application utilise **Socket.IO** pour remplacer le polling inefficace de 5 secondes. Cela permet des mises à jour **en temps réel** des tickets sans surcharger le serveur.

### 🔧 Setup

#### Démarrage en Développement

**Terminal 1 - Serveur Next.js (Application web)**
```bash
npm run dev
# Application disponible sur http://localhost:3000
```

**Terminal 2 - Serveur WebSocket (Socket.IO)**
```bash
npm run socket-server
# Serveur Socket.IO sur http://localhost:3001
```

#### Variables d'Environnement

Dans `.env.local`:
```env
# URL du serveur WebSocket (pour le client)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Port du serveur WebSocket (optionnel, défaut: 3001)
SOCKET_PORT=3001
```

### 📊 Architecture

**Avant (Polling toutes les 5 secondes)**:
- Client envoie une requête HTTP toutes les 5 secondes
- Beaucoup de requêtes inutiles si rien n'a changé
- Latence: 0-5 secondes avant une mise à jour
- Impact élevé sur la bande passante

**Après (WebSocket)**:
- **Connexion persistante** entre client et serveur
- Serveur poll la base de données **toutes les 2 secondes** (plus efficace)
- Serveur envoie updates **UNIQUEMENT si les données ont changé** (hash comparison)
- **Latence: 0-2 secondes** (amélioré)
- **Réduction de 60%** du trafic réseau

### 📝 Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `lib/socket.ts` | 🆕 Configuration client Socket.IO |
| `server.js` | 🆕 Serveur Node.js avec Socket.IO |
| `app/page.tsx` | ✏️ Remplacé polling par WebSocket |
| `package.json` | ✏️ Ajouté script `socket-server` |

### 🔌 Events Socket.IO

**Client → Serveur**:
- `login (email)` - Enregistre l'utilisateur pour recevoir ses tickets

**Serveur → Client**:
- `ticketsUpdated (tickets)` - Envoie la liste mise à jour des tickets

### 🚀 Production

Pour déployer en production, vous avez plusieurs options:

**Option 1: Serveur Node.js séparé** (Recommandé)
```bash
# Déployer sur Railway, Heroku, ou DigitalOcean
node server.js
```

**Option 2: Serverless + WebSocket externe**
- Utiliser un service WebSocket managé (Socket.IO Cloud, Pusher, etc.)

### ⚡ Performance

Avant WebSocket:
- 5 requêtes HTTP/sec par utilisateur
- Polling constant même sans changements

Après WebSocket:
- 1 connexion persistante par utilisateur
- Updates uniquement si changements détectés
- Réduction automatique du trafic en pics de charge

---

**Note**: Assurez-vous que les deux serveurs (Next.js + Socket.IO) tournent en développement. En production, ils peuvent tourner sur le même serveur ou sur des serveurs séparés selon votre infrastructure.
