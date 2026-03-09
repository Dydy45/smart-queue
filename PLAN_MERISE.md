# PLAN MERISE — Projet SmartQueue

## Système de Gestion Intelligente des Files d'Attente

---

# A. CONTEXTE DU PROJET

## 1. Présentation de l'entreprise

De nombreuses entreprises et institutions de services (centres de santé, administrations publiques, banques, agences de télécommunications, etc.) accueillent quotidiennement un grand nombre de clients ou d'usagers. Ces structures disposent généralement de plusieurs guichets ou postes de travail, chacun dédié à un type de service spécifique.

Dans le cadre de ce projet, nous étudions le cas d'une **entreprise de prestation de services** qui reçoit des clients au quotidien. Cette entreprise offre plusieurs types de services à travers différents postes de travail. Les clients se présentent physiquement dans les locaux de l'entreprise et doivent attendre leur tour pour être servis.

Actuellement, la gestion des files d'attente dans cette entreprise repose sur un **système manuel** : les clients prennent un numéro sur un carnet à souche ou se placent simplement dans une file physique. Un agent de sécurité ou un réceptionniste oriente les clients vers le bon guichet. Les employés appellent les clients de manière verbale ou à l'aide d'un afficheur basique.

Ce système, bien que fonctionnel, présente de nombreuses insuffisances en termes d'équité, de transparence, de traçabilité et d'efficacité, ce qui justifie la mise en place d'une solution informatique adaptée.

---

## 2. Circuit d'information (Diagramme de flux)

Le circuit d'information du système actuel de gestion des files d'attente fait intervenir les acteurs suivants :

### Acteurs du système

| N° | Acteur | Rôle |
|----|--------|------|
| 1 | **Client** | Se présente à l'entreprise, demande un service, attend son tour |
| 2 | **Réceptionniste / Vigile** | Accueille le client, lui attribue un numéro, l'oriente vers le bon guichet |
| 3 | **Employé (Agent de guichet)** | Traite la demande du client au poste de travail |
| 4 | **Responsable / Propriétaire** | Supervise l'activité, consulte les rapports, gère le personnel |

### Description du flux d'information

```
┌──────────┐    (1) Arrivée     ┌──────────────┐   (2) Attribution   ┌──────────┐
│          │ ──────────────────>│              │ ─────────────────── │          │
│  CLIENT  │    du client       │ RÉCEPTIONNISTE│   d'un numéro      │  FILE    │
│          │ <──────────────── │              │   et orientation     │ D'ATTENTE│
└──────────┘  (6) Fin de       └──────────────┘                     └────┬─────┘
               service                                                    │
                                                                    (3) Appel
                                                                    du numéro
                                                                         │
┌──────────┐   (5) Rapport     ┌──────────────┐   (4) Traitement   ┌────▼─────┐
│          │ <────────────────│              │ <───────────────── │          │
│RESPONSABLE│   d'activité     │   EMPLOYÉ    │   de la demande    │  CLIENT  │
│          │ ──────────────── │              │ ──────────────────>│ (servi)  │
└──────────┘  Directives       └──────────────┘                    └──────────┘
```

### Flux détaillé

1. **Le client** arrive dans l'entreprise et se dirige vers la réception.
2. **Le réceptionniste** identifie le service demandé, attribue un numéro au client (carnet à souche ou ticket papier) et l'oriente vers la salle d'attente correspondante.
3. **L'employé** au poste de travail appelle le numéro suivant (verbalement ou par afficheur).
4. **Le client** se présente au guichet, expose sa demande. L'employé traite la demande.
5. **L'employé** enregistre manuellement l'opération dans un registre. En fin de journée, un rapport est transmis au responsable.
6. **Le client** quitte l'entreprise après avoir été servi.

---

## 3. Documents utilisés

### a) Répertoire des documents

| N° | Document | Type | Émetteur | Récepteur | Rôle / Importance | Nombre |
|----|----------|------|----------|-----------|-------------------|--------|
| 1 | Ticket de file d'attente | Interne | Réceptionniste | Client | Attribuer un numéro d'ordre au client pour garantir le passage par ordre d'arrivée | ~100/jour |
| 2 | Registre des clients | Interne | Employé | Responsable | Enregistrer les informations des clients servis (nom, service, heure) | 1/poste |
| 3 | Fiche de service | Interne | Responsable | Employé | Décrire les services offerts et les postes assignés | 1/service |
| 4 | Rapport journalier | Interne | Employé | Responsable | Résumer l'activité du jour (nombre de clients servis, durée moyenne, incidents) | 1/jour |
| 5 | Planning du personnel | Interne | Responsable | Employé | Définir les horaires et les affectations des employés aux postes | 1/semaine |
| 6 | Fiche de réclamation | Interne | Client | Responsable | Permettre au client de signaler un problème ou une insatisfaction | Variable |

### b) Description des documents

#### Document 1 : Ticket de file d'attente

| Code | Désignation | Type | Taille |
|------|-------------|------|--------|
| NUM_TICK | Numéro du ticket | Numérique | 4 |
| DATE_TICK | Date d'émission | Date | 10 |
| HEURE_TICK | Heure d'émission | Heure | 5 |
| NOM_SERV | Nom du service demandé | Alphabétique | 50 |
| NUM_POSTE | Numéro du poste assigné | Numérique | 2 |

#### Document 2 : Registre des clients

| Code | Désignation | Type | Taille |
|------|-------------|------|--------|
| NUM_REG | Numéro d'enregistrement | Numérique | 6 |
| DATE_REG | Date de l'enregistrement | Date | 10 |
| NOM_CLI | Nom du client | Alphabétique | 50 |
| SERV_DEM | Service demandé | Alphabétique | 50 |
| HEURE_ARR | Heure d'arrivée | Heure | 5 |
| HEURE_SERV | Heure de prise en charge | Heure | 5 |
| HEURE_FIN | Heure de fin de service | Heure | 5 |
| STATUT | Statut (Servi / Non servi) | Alphabétique | 10 |
| OBS | Observations | Alphabétique | 200 |

#### Document 3 : Fiche de service

| Code | Désignation | Type | Taille |
|------|-------------|------|--------|
| CODE_SERV | Code du service | Alphanumérique | 10 |
| NOM_SERV | Nom du service | Alphabétique | 50 |
| DESC_SERV | Description du service | Alphabétique | 200 |
| NB_POSTES | Nombre de postes assignés | Numérique | 2 |
| RESP_SERV | Responsable du service | Alphabétique | 50 |

#### Document 4 : Rapport journalier

| Code | Désignation | Type | Taille |
|------|-------------|------|--------|
| NUM_RAP | Numéro du rapport | Numérique | 6 |
| DATE_RAP | Date du rapport | Date | 10 |
| NOM_EMP | Nom de l'employé | Alphabétique | 50 |
| POSTE_EMP | Poste de travail | Alphabétique | 30 |
| NB_SERVIS | Nombre de clients servis | Numérique | 4 |
| NB_NON_SERVIS | Nombre de clients non servis | Numérique | 4 |
| DUREE_MOY | Durée moyenne de traitement | Numérique | 5 |
| OBS_RAP | Observations | Alphabétique | 200 |

#### Document 5 : Planning du personnel

| Code | Désignation | Type | Taille |
|------|-------------|------|--------|
| CODE_PLAN | Code du planning | Alphanumérique | 10 |
| SEMAINE | Semaine concernée | Numérique | 2 |
| NOM_EMP | Nom de l'employé | Alphabétique | 50 |
| POSTE_AFF | Poste affecté | Alphabétique | 30 |
| JOUR | Jour de la semaine | Alphabétique | 10 |
| HEURE_DEB | Heure de début | Heure | 5 |
| HEURE_FIN_P | Heure de fin | Heure | 5 |

#### Document 6 : Fiche de réclamation

| Code | Désignation | Type | Taille |
|------|-------------|------|--------|
| NUM_RECL | Numéro de réclamation | Numérique | 6 |
| DATE_RECL | Date de la réclamation | Date | 10 |
| NOM_CLI_R | Nom du client | Alphabétique | 50 |
| OBJET_RECL | Objet de la réclamation | Alphabétique | 100 |
| DESC_RECL | Description détaillée | Alphabétique | 500 |
| STATUT_RECL | Statut (En cours / Traitée) | Alphabétique | 10 |

---

## 4. Moyens existants

### a) Moyens matériels

| N° | Désignation | Quantité | État |
|----|-------------|----------|------|
| 1 | Bureau de réception | 1 | Fonctionnel |
| 2 | Carnets à souche (tickets) | 10/mois | Consommable |
| 3 | Registres papier | 2/an par poste | Consommable |
| 4 | Chaises de salle d'attente | 20-50 | Variable |
| 5 | Afficheur numérique basique | 0-1 | Souvent absent |
| 6 | Stylos, tampons | Variable | Consommable |

### b) Moyens humains

| N° | Fonction | Nombre | Rôle dans la gestion de la file |
|----|----------|--------|---------------------------------|
| 1 | Responsable / Directeur | 1 | Supervision générale, prise de décision |
| 2 | Réceptionniste | 1-2 | Accueil, distribution des tickets, orientation |
| 3 | Agents de guichet (employés) | 3-10 | Traitement des demandes des clients |
| 4 | Agent de sécurité (vigile) | 1-2 | Maintien de l'ordre dans la file |

### c) Moyens financiers

| N° | Poste de dépense | Coût estimé (annuel) | Observation |
|----|------------------|---------------------|-------------|
| 1 | Carnets à souche / tickets papier | 50-100 USD | Coût récurrent |
| 2 | Registres et fournitures | 30-60 USD | Coût récurrent |
| 3 | Salaire réceptionniste dédié | 1 200-2 400 USD | Charge salariale |
| 4 | Salaire vigile | 1 200-2 400 USD | Charge salariale |
| 5 | Maintenance afficheur (si existant) | 50-100 USD | Variable |

---

## 5. Critique de l'existant

### Points forts

| N° | Point fort | Description |
|----|------------|-------------|
| 1 | Simplicité | Le système est simple à comprendre et ne nécessite aucune formation technique |
| 2 | Coût initial faible | Pas besoin d'investissement technologique pour démarrer |
| 3 | Fonctionnement hors ligne | Le système ne dépend pas d'une connexion internet ou d'électricité |
| 4 | Accessibilité | Tout le monde peut prendre un ticket, même sans compétence numérique |

### Points faibles

| N° | Point faible | Description |
|----|-------------|-------------|
| 1 | Manque de transparence | Le client ne connaît pas sa position exacte dans la file ni le temps d'attente estimé |
| 2 | Risque de fraude et de favoritisme | Des personnes peuvent passer devant les autres (corruption du vigile, passe-droits) |
| 3 | Absence de traçabilité | Aucun historique fiable des clients servis, des durées de traitement, ou des performances |
| 4 | Gestion inefficace du temps | Les clients ne savent pas quand revenir et perdent du temps en attente sur place |
| 5 | Difficulté de supervision | Le responsable n'a pas de visibilité en temps réel sur l'état des files |
| 6 | Perte de tickets | Les tickets papier peuvent être perdus, endommagés ou falsifiés |
| 7 | Pas de statistiques | Impossible de produire des rapports automatiques sur les performances |
| 8 | Rendez-vous manqués | Les clients qui s'absentent brièvement peuvent perdre leur place |
| 9 | Charge humaine excessive | Le réceptionniste et le vigile sont mobilisés à plein temps pour une tâche répétitive |

---

## 6. Propositions de solutions

### Solution 1 : Solution manuelle améliorée

**Description :** Améliorer le système existant en introduisant des tickets pré-imprimés numérotés, un tableau d'affichage mis à jour manuellement, et un registre standardisé pour le suivi des clients.

| Avantages | Inconvénients |
|-----------|---------------|
| Coût faible | Ne résout pas le problème de transparence en temps réel |
| Facile à mettre en place | Toujours sujet aux fraudes et au favoritisme |
| Pas besoin de formation technique | Pas de traçabilité automatique |
| | Charge humaine toujours élevée |

### Solution 2 : Solution informatique — SmartQueue

**Description :** Mettre en place une application web de gestion intelligente des files d'attente. Le système permet au propriétaire de configurer ses services et postes de travail, aux employés de traiter les tickets numériquement, et aux clients de prendre un ticket en ligne et de suivre leur position en temps réel.

| Avantages | Inconvénients |
|-----------|---------------|
| Transparence totale (position + temps d'attente en temps réel) | Nécessite une connexion internet |
| Élimination des fraudes (file numérique équitable FIFO) | Coût initial de développement et déploiement |
| Traçabilité complète (historique, statistiques, rapports) | Formation nécessaire pour le personnel |
| Réduction de la charge humaine (plus besoin de vigile pour la file) | Certains clients peuvent ne pas être à l'aise avec le numérique |
| Supervision en temps réel pour le responsable | |
| Accessibilité depuis n'importe quel appareil (smartphone, tablette, PC) | |
| Gestion multi-services et multi-postes | |

### Choix de la meilleure solution

**La solution informatique (SmartQueue) est retenue** car elle répond de manière complète et durable à l'ensemble des problèmes identifiés dans le système actuel. Bien qu'elle nécessite un investissement initial, les bénéfices à moyen et long terme en termes d'efficacité, de transparence, d'équité et de satisfaction client justifient largement ce choix. La solution manuelle améliorée, bien que moins coûteuse, ne résout que partiellement les problèmes et maintient les mêmes faiblesses structurelles du système existant.

---

# B. PROBLÉMATIQUE

## Description des problèmes observés

L'observation du système actuel de gestion des files d'attente dans les entreprises de services révèle plusieurs dysfonctionnements majeurs :

1. **L'opacité de la file d'attente** : Les clients qui se présentent dans l'entreprise n'ont aucune visibilité sur l'état de la file. Ils ne connaissent ni leur position exacte, ni le nombre de personnes devant eux, ni le temps d'attente estimé. Cette incertitude génère de la frustration et pousse certains clients à abandonner.

2. **Le favoritisme et la corruption** : En l'absence d'un système numérique impartial, certaines personnes contournent la file en usant de relations personnelles ou en corrompant le personnel de sécurité. Ce phénomène crée un sentiment d'injustice parmi les clients honnêtes et ternit l'image de l'entreprise.

3. **L'absence de traçabilité et de suivi** : Le système manuel ne permet pas de conserver un historique fiable des activités. Le responsable ne dispose d'aucun outil pour mesurer les performances de ses employés, évaluer les temps de traitement, ou identifier les goulots d'étranglement. La prise de décision se fait donc sans données objectives.

## Questions de recherche

### Question fondamentale (QF)

> **Comment concevoir et mettre en place un système d'information capable d'assurer une gestion transparente, équitable et traçable des files d'attente dans une entreprise de services ?**

### Questions spécifiques

> **QS1 :** Comment garantir la transparence et l'équité dans le processus de gestion des files d'attente afin d'éliminer le favoritisme et la corruption ?

> **QS2 :** Comment offrir au responsable de l'entreprise un outil de suivi en temps réel et de production de statistiques fiables sur l'activité de ses postes de travail ?

---

# C. HYPOTHÈSES

En réponse aux questions formulées dans la problématique, nous émettons les hypothèses suivantes :

> **HF (Hypothèse fondamentale) :** La conception et la mise en place d'une application web de gestion des files d'attente basée sur la méthode Merise permettrait d'assurer une gestion transparente, équitable et traçable des files d'attente dans une entreprise de services.

> **HS1 (Hypothèse spécifique 1) :** L'implémentation d'un système de tickets numériques fonctionnant selon le principe FIFO (First In, First Out), accessible en ligne via une page publique, permettrait de garantir la transparence et l'équité en éliminant toute possibilité de favoritisme ou de corruption dans la file d'attente.

> **HS2 (Hypothèse spécifique 2) :** L'intégration d'un tableau de bord numérique en temps réel, couplé à un système d'enregistrement automatique des opérations, permettrait au responsable de superviser l'activité de ses postes de travail et de produire des statistiques fiables pour la prise de décision.

---

# D. OBJECTIFS DU PROJET

Les objectifs du projet découlent directement des hypothèses formulées :

> **Objectif général (OG) :** Concevoir et réaliser une application web de gestion intelligente des files d'attente (SmartQueue) permettant d'assurer une gestion transparente, équitable et traçable des files d'attente dans une entreprise de services.

> **Objectif spécifique 1 (OS1) :** Développer un module de gestion de tickets numériques basé sur le principe FIFO, intégrant une page publique accessible aux clients pour la prise de tickets et le suivi en temps réel de leur position dans la file.

> **Objectif spécifique 2 (OS2) :** Mettre en place un tableau de bord pour le responsable avec un suivi en temps réel de l'activité des postes, un historique des opérations et la production automatique de statistiques de performance.

---

# E. PÉRIMÈTRE DU PROJET

## Délimitation dans le temps

| Élément | Détail |
|---------|--------|
| **Période des données étudiées** | 2024 — 2026 (3 ans) |
| **Année académique** | Troisième Licence |
| **Durée de réalisation du projet** | 6 mois (Octobre 2025 — Mars 2026) |

## Délimitation dans l'espace

| Élément | Détail |
|---------|--------|
| **Type d'institution** | Entreprise de prestation de services |
| **Service étudié** | Service d'accueil et de gestion des files d'attente |
| **Type de gestion analysée** | Gestion des files d'attente et traitement des demandes clients |
| **Couverture géographique** | Applicable à toute entreprise de services recevant des clients physiquement |

---

# F. MÉTHODES UTILISÉES

## Méthode 1 : MERISE

| Élément | Détail |
|---------|--------|
| **Nom** | MERISE (Méthode d'Étude et de Réalisation Informatique pour les Systèmes d'Entreprise) |
| **Utilité** | Analyse, conception et réalisation du système d'information |
| **Niveaux d'abstraction** | Conceptuel → Logique → Physique |
| **Modèles produits** | MCD (Modèle Conceptuel de Données), MLD (Modèle Logique de Données), MPD (Modèle Physique de Données), MCT (Modèle Conceptuel de Traitements), MOT (Modèle Organisationnel de Traitements) |
| **Justification** | Méthode rigoureuse et structurée, adaptée à la conception de systèmes d'information de gestion, largement enseignée dans le cadre universitaire |

## Méthode 2 : GANTT

| Élément | Détail |
|---------|--------|
| **Nom** | Diagramme de GANTT |
| **Utilité** | Planification du projet et organisation des tâches |
| **Principe** | Représentation graphique des tâches du projet sur un axe temporel, montrant leur durée, leur enchaînement et leurs dépendances |
| **Outil utilisé** | Microsoft Project / Excel / GanttProject |
| **Justification** | Permet de visualiser clairement l'avancement du projet, d'identifier les tâches critiques et de respecter les délais |

### Planning prévisionnel (Diagramme de Gantt simplifié)

| N° | Tâche | Durée | Période |
|----|-------|-------|---------|
| 1 | Étude de l'existant et collecte des données | 3 semaines | Oct 2025 |
| 2 | Analyse et critique du système existant | 2 semaines | Nov 2025 |
| 3 | Conception du MCD, MLD, MPD | 3 semaines | Nov — Déc 2025 |
| 4 | Conception des traitements (MCT, MOT) | 2 semaines | Déc 2025 |
| 5 | Développement de l'application (codage) | 6 semaines | Jan — Fév 2026 |
| 6 | Tests et validation | 2 semaines | Fév 2026 |
| 7 | Rédaction du mémoire | 4 semaines | Fév — Mar 2026 |
| 8 | Présentation et soutenance | 1 semaine | Mar 2026 |

---

# G. TECHNIQUES DE COLLECTE DE DONNÉES

## Technique utilisée : Observation

| Élément | Détail |
|---------|--------|
| **Technique** | Observation directe |
| **Type** | Observation non participante |
| **Description** | Observer le fonctionnement quotidien du système de gestion des files d'attente dans l'entreprise étudiée, sans intervenir dans le processus |
| **Objectif** | Comprendre le circuit d'information existant, identifier les acteurs, les documents utilisés, les flux de données, et repérer les dysfonctionnements |
| **Durée** | 2 à 3 semaines |
| **Éléments observés** | Processus d'accueil des clients, attribution des tickets, gestion de la file, traitement des demandes, comportements des acteurs, temps d'attente, incidents |

### Grille d'observation

| N° | Élément observé | Indicateur | Résultat attendu |
|----|-----------------|------------|-------------------|
| 1 | Processus d'attribution des tickets | Mode d'attribution (manuel/automatique) | Identifier le mode actuel |
| 2 | Temps d'attente moyen | Durée entre l'arrivée et la prise en charge | Quantifier le temps perdu |
| 3 | Cas de favoritisme | Nombre de personnes passant hors de leur tour | Mesurer l'ampleur du problème |
| 4 | Satisfaction des clients | Réactions observées (impatience, réclamations) | Évaluer le niveau de frustration |
| 5 | Traçabilité des opérations | Existence d'un registre, complétude des données | Évaluer la fiabilité du suivi |
| 6 | Charge de travail du personnel | Nombre de clients traités par employé par jour | Mesurer la productivité |
| 7 | Communication interne | Mode d'appel des clients (verbal, afficheur) | Identifier les lacunes |

---

# TABLEAU RÉCAPITULATIF : QUESTIONS — HYPOTHÈSES — OBJECTIFS

| | Question | Hypothèse | Objectif |
|---|----------|-----------|----------|
| **Fondamental** | Comment concevoir et mettre en place un SI capable d'assurer une gestion transparente, équitable et traçable des files d'attente ? | La conception d'une application web (SmartQueue) basée sur Merise permettrait d'assurer cette gestion | Concevoir et réaliser l'application web SmartQueue |
| **Spécifique 1** | Comment garantir la transparence et l'équité pour éliminer le favoritisme ? | Un système de tickets numériques FIFO avec page publique garantirait transparence et équité | Développer un module de tickets numériques FIFO avec suivi en temps réel |
| **Spécifique 2** | Comment offrir un outil de suivi en temps réel et de statistiques au responsable ? | Un tableau de bord numérique avec enregistrement automatique permettrait ce suivi | Mettre en place un tableau de bord avec suivi temps réel et statistiques |

---

*Document rédigé dans le cadre du projet tutoré de Troisième Licence — Système de Gestion Intelligente des Files d'Attente (SmartQueue)*
