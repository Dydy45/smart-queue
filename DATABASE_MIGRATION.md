# 🗄️ Migration de Base de Données : SQLite → PostgreSQL

Ce guide explique comment migrer SmartQueue de SQLite vers PostgreSQL pour la production.

---

## 📋 Pourquoi PostgreSQL ?

| Critère | SQLite | PostgreSQL |
|---------|--------|------------|
| **Concurrent Writes** | ❌ Limité | ✅ Excellent |
| **Scalabilité** | ❌ Fichier local | ✅ Serveur dédié |
| **Production Ready** | ❌ Dev uniquement | ✅ Production |
| **Transactions** | ⚠️ Basique | ✅ ACID complet |
| **Backup/Restore** | ⚠️ Manuel | ✅ Automatisé |
| **Multi-serveur** | ❌ Non | ✅ Oui |

---

## 🚀 Guide de Migration

### Étape 1 : Installer PostgreSQL

#### Option A : Installation locale (Développement)

**Windows:**
```bash
# Télécharger depuis https://www.postgresql.org/download/windows/
# Ou via Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Option B : Utiliser un service cloud (Production)

- **Vercel Postgres** (recommandé pour Next.js)
- **Supabase** (gratuit + features bonus)
- **Neon** (serverless PostgreSQL)
- **Railway** (simple et rapide)
- **AWS RDS** (entreprise)

---

### Étape 2 : Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE smartqueue;

# Créer un utilisateur (optionnel)
CREATE USER smartqueue_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE smartqueue TO smartqueue_user;

# Quitter
\q
```

---

### Étape 3 : Configurer les variables d'environnement

Copier `env.example` vers `.env` :

```bash
cp env.example .env
```

Modifier `.env` avec vos credentials PostgreSQL :

```env
# PostgreSQL (Production)
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartqueue?schema=public"

# Ou pour un service cloud (exemple Vercel Postgres):
# DATABASE_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
```

---

### Étape 4 : Générer et appliquer les migrations Prisma

```bash
# Générer le client Prisma avec le nouveau schema PostgreSQL
npx prisma generate

# Créer et appliquer la migration initiale
npx prisma migrate dev --name init

# Vérifier que les tables sont créées
npx prisma studio
```

---

### Étape 5 : Migrer les données existantes (si nécessaire)

Si vous avez des données dans SQLite à migrer :

```bash
# 1. Exporter les données SQLite
npx prisma db pull --schema=./prisma/schema-sqlite.prisma

# 2. Utiliser un outil de migration
# Option A: Prisma Migrate (recommandé)
# Option B: Script personnalisé
# Option C: Export CSV + Import PostgreSQL
```

**Script de migration simple (exemple):**

```typescript
// scripts/migrate-data.ts
import { PrismaClient as SQLiteClient } from '@prisma/client'
import { PrismaClient as PostgresClient } from '@prisma/client'

const sqlite = new SQLiteClient({ datasources: { db: { url: 'file:./dev.db' } } })
const postgres = new PostgresClient()

async function migrate() {
  // Migrer les companies
  const companies = await sqlite.company.findMany()
  await postgres.company.createMany({ data: companies, skipDuplicates: true })
  
  // Migrer les services
  const services = await sqlite.service.findMany()
  await postgres.service.createMany({ data: services, skipDuplicates: true })
  
  // ... etc
  
  console.log('✅ Migration terminée!')
}

migrate()
```

---

### Étape 6 : Redémarrer les serveurs

```bash
# Arrêter les serveurs existants (Ctrl+C)

# Redémarrer avec PostgreSQL
npm run dev          # Next.js
npm run socket-server # WebSocket
```

---

## 🔍 Vérification

### Tester la connexion PostgreSQL

```bash
# Vérifier que Prisma peut se connecter
npx prisma db pull

# Ouvrir Prisma Studio
npx prisma studio
```

### Vérifier les logs

Dans les logs de démarrage, vous devriez voir :
```
✓ Generated Prisma Client to ./app/generated/prisma
[WebSocket] Server running on port 3001
```

---

## 🐛 Troubleshooting

### Erreur : "Can't reach database server"

```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql  # Linux
brew services list                # macOS
```

### Erreur : "Authentication failed"

Vérifier les credentials dans `DATABASE_URL` :
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Erreur : "Database does not exist"

```bash
# Créer la base de données
psql -U postgres -c "CREATE DATABASE smartqueue;"
```

### Performance lente

```sql
-- Créer des index pour optimiser les requêtes
CREATE INDEX idx_ticket_status ON "Ticket"(status);
CREATE INDEX idx_ticket_service ON "Ticket"("serviceId");
CREATE INDEX idx_service_company ON "Service"("companyId");
```

---

## 📊 Comparaison des performances

| Opération | SQLite | PostgreSQL |
|-----------|--------|------------|
| Lecture simple | ~1ms | ~2ms |
| Écriture concurrente | ❌ Bloquant | ✅ Non-bloquant |
| 100 tickets/sec | ⚠️ Ralentit | ✅ Stable |
| Multi-serveur | ❌ Impossible | ✅ Supporté |

---

## 🔐 Sécurité en Production

1. **Ne jamais commiter `.env`** (déjà dans `.gitignore`)
2. **Utiliser des mots de passe forts** (16+ caractères)
3. **Activer SSL/TLS** pour les connexions distantes
4. **Limiter les accès réseau** (firewall, VPC)
5. **Sauvegardes automatiques** (pg_dump, service cloud)

```env
# Exemple avec SSL (production)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

---

## 📚 Ressources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com/docs/guides/database)

---

## ✅ Checklist de Migration

- [ ] PostgreSQL installé et démarré
- [ ] Base de données `smartqueue` créée
- [ ] `.env` configuré avec `DATABASE_URL`
- [ ] `npx prisma generate` exécuté
- [ ] `npx prisma migrate dev` exécuté
- [ ] Données migrées (si applicable)
- [ ] Serveurs redémarrés
- [ ] Tests de connexion réussis
- [ ] Application fonctionne correctement

---

**🎉 Migration terminée ! Votre application est maintenant prête pour la production.**
