# Plan — Skeleton Screens (remplacement des spinners)

## Objectif
Remplacer les spinners de chargement initial dans les listes de **services**, **postes** et
**staff** par des squelettes animés (rectangles pulsants) qui imitent la forme du vrai contenu.

---

## Analyse de l'existant

### `app/services/page.tsx`
- État `loading: boolean` sert à la fois pour le **chargement initial** et pour le
  **bouton Ajouter** (mutation).
- Zone à remplacer : `loading ? <spinner> : ...` dans la colonne de droite (liste des services).
- Structure réelle : un `<table>` avec 4 colonnes (#, Nom, Temps, Actions).

### `app/poste_list/page.tsx`
- **Pas d'état de loading** pour le chargement initial (`fetchPosts` / `fetchServices`
  ne positionnent aucun flag). Le passage de vide → données est abrupt.
- `loading` n'existe que pendant la mutation (création de poste).
- Zone à corriger : introduire un `isInitialLoad` et afficher un skeleton sur la grille
  de cartes (3 colonnes sur md).
- Structure réelle : cartes `bg-base-200 p-5 rounded-lg` avec un titre + 2 boutons.

### `app/staff/page.tsx`
- `loading` sert à la fois au chargement initial (via `fetchStaff → setLoading(true)`)
  et aux mutations.
- La condition `loading && staffList.length === 0` protège déjà partiellement
  l'affichage, mais n'affiche qu'un spinner.
- Zone à remplacer : `loading && staffList.length === 0 ? <spinner> : ...`.
- Structure réelle : un `<table>` avec 5 colonnes (#, Nom, Email, Rôle, Actions).

---

## Décisions de conception

### Séparation des états
Pour éviter que les skeletons re-flashent à chaque mutation (ajout/suppression) :

| Page | Avant | Après |
|---|---|---|
| services | `loading` (tout) | `isInitialLoad` (skeleton) + `loading` (bouton) |
| poste_list | aucun flag initial | `isInitialLoad` (skeleton) + `loading` (bouton, déjà présent) |
| staff | `loading` (tout) | `isInitialLoad` (skeleton) + `loading` (bouton/mutations) |

Règle : `isInitialLoad` passe à `false` après le **premier** fetch réussi (ou en erreur).
Il ne repasse jamais à `true` ensuite.

### Composants réutilisables
Création de **2 composants** dans `app/components/` :

#### `SkeletonTable.tsx`
Rend `n` lignes squelettes pour un tableau, avec `cols` colonnes.
Chaque cellule est un `div` avec la classe DaisyUI `skeleton` (hauteur et largeur variables
pour mimer le vrai contenu).

```
Props : { rows?: number; cols: number[] }
// cols = tableau de largeurs relatives par colonne, ex. [8, 40, 24, 16]
// représente approximativement les % de largeur de chaque cellule skeleton
```

#### `SkeletonCards.tsx`
Rend `n` cartes squelettes dans une grille (même layout que la liste des postes).

```
Props : { count?: number }
```

### Style
- Utilisation de la classe **`skeleton`** de DaisyUI (compatible avec tous les thèmes,
  gère automatiquement le dark mode).
- Hauteurs imitant le vrai contenu :
  - Lignes de tableau : h-4 pour le texte, h-6 pour les badges/boutons.
  - Cartes postes : h-5 pour le titre, deux rectangles h-8 pour les boutons.
- Nombre de lignes/cartes affiché : **4** (valeur par défaut — correspond à un nombre
  raisonnable de résultats typiques).

---

## Fichiers créés / modifiés

### Nouveaux fichiers
| Fichier | Rôle |
|---|---|
| `app/components/SkeletonTable.tsx` | Lignes squelettes réutilisables pour tables |
| `app/components/SkeletonCards.tsx` | Cartes squelettes réutilisables pour grilles |

### Fichiers modifiés
| Fichier | Changement |
|---|---|
| `app/services/page.tsx` | Ajout `isInitialLoad`, remplacement spinner liste → `<SkeletonTable>` |
| `app/poste_list/page.tsx` | Ajout `isInitialLoad`, remplacement transition abrupte → `<SkeletonCards>` |
| `app/staff/page.tsx` | Ajout `isInitialLoad`, remplacement spinner liste → `<SkeletonTable>` |

---

## Détail des skeletons par page

### services — `SkeletonTable` (4 lignes, 4 colonnes)
```
| ░░ | ░░░░░░░░░░░░░░░ | ░░░░░░░ | ░░░ |
| ░░ | ░░░░░░░░░░░░░░░ | ░░░░░░░ | ░░░ |
| ░░ | ░░░░░░░░░░░░░░░ | ░░░░░░░ | ░░░ |
| ░░ | ░░░░░░░░░░░░░░░ | ░░░░░░░ | ░░░ |
```
Colonnes : `[6, 48, 20, 10]` (width en %)

### staff — `SkeletonTable` (4 lignes, 5 colonnes)
```
| ░░ | ░░░░░░░░░░ | ░░░░░░░░░░░░░░░░░ | ░░░░░░ | ░░░ |
| ░░ | ░░░░░░░░░░ | ░░░░░░░░░░░░░░░░░ | ░░░░░░ | ░░░ |
| ░░ | ░░░░░░░░░░ | ░░░░░░░░░░░░░░░░░ | ░░░░░░ | ░░░ |
| ░░ | ░░░░░░░░░░ | ░░░░░░░░░░░░░░░░░ | ░░░░░░ | ░░░ |
```
Colonnes : `[6, 20, 32, 16, 14]` (width en %)

### postes — `SkeletonCards` (3 cartes)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ░░░░░░░░░░░  │ │ ░░░░░░░░░░░  │ │ ░░░░░░░░░░░  │
│              │ │              │ │              │
│ ░░░░░  ░░░  │ │ ░░░░░  ░░░  │ │ ░░░░░  ░░░  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Ce qui ne change PAS
- Le spinner **dans le bouton** de soumission de formulaire reste inchangé (feedback de mutation).
- La logique `EmptyState` reste inchangée (s'affiche après le chargement si vide).
- Aucun changement dans la logique des appels API ni dans les types.

---

## Résultat attendu
Au premier chargement de chaque page, l'utilisateur voit immédiatement la forme du contenu
(squelettes animés) plutôt qu'un spinner isolé ou une page vide. Dès que les données
arrivent, les squelettes sont remplacés par le vrai contenu sans flash.
