# CONTEXTE.md — Jeu de construction en briques pour Meta Quest 3 (WebXR)

> Document de reprise de projet, issu d'une discussion préalable. À donner à l'assistant au début de chaque session dans VS Code.

## 1. Objectif du projet

Un jeu de construction en briques en réalité virtuelle, destiné à des **personnes âgées**, qui tourne dans le navigateur du **Meta Quest 3** (WebXR). Le joueur reconstruit des objets simples (voilier, maison/église, vélo…) en plaçant des briques sur une maquette guidée.

- **Projet à partager** : accessible par un simple lien, sans installation. Le QR code a été écarté (2026-10-29) : le Quest 3 ne sait pas lire un QR code pour ouvrir un site ; on enregistre plutôt le lien en favori dans le navigateur du casque.
- **Hébergement initial** : GitHub Pages (HTTPS, obligatoire pour WebXR).

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Technologie | WebXR + Three.js, **sans compilation** (fichiers simples, modules ES, pas de Vite/npm requis) |
| Posture | **Assis uniquement** |
| Entrée | **Suivi des mains**, un seul geste : le **pincement** (pouce + index) pour attraper, déplacer, relâcher |
| Déplacement | **Téléportation** par **pastilles au sol** (activation par pincement ou regard prolongé quelques secondes) |
| Construction | **Mode guidé, une brique à la fois** : maquette « fantôme » translucide à contour net, accrochage magnétique ; une brique lâchée loin de sa place reste là où elle est |
| Mains | Modèles **réalistes** (`@webxr-input-profiles/assets`, copiés localement, MIT) |
| Modèles | Décrits dans des **fichiers JSON** (liste de briques : position, taille, couleur) pour ajouter un modèle sans toucher au code |
| Langue | **Français uniquement** |
| Aide | **Texte en gros** dans la scène, **pas de voix off** |
| Sons | **Sons doux** courts (saisie, accrochage, réussite), créés par le navigateur, graves à médiums, jamais de son d'erreur ; désactivables (validé le 2026-10-29) |
| Hébergement | GitHub Pages |

## 3. Principes d'accessibilité et de confort (public âgé)

- **Fatigue** : zone de construction à hauteur de table, utilisable assis, sans bras levés longtemps.
- **Tolérance** : zone de saisie généreuse, accrochage magnétique, bouton **« Annuler »** toujours visible.
- **Pas de pression** : aucun chrono, aucun score négatif, aucun échec possible. Messages positifs.
- **Texte** : très gros, à environ 1 m du joueur, police sans empattement épaisse.
- **Contraste** : ratio visé **d'au moins 7:1** (texte blanc ou jaune pâle sur panneau sombre opaque). Le décor 3D, lui, est une **pièce réelle et lumineuse** (photo panoramique Poly Haven, validée le 2026-10-29), avec une lampe chaude au-dessus d'une table en chêne clair, sur le modèle d'un puzzle 3D fourni en inspiration.
- **Couleurs** : briques vives, mais l'information ne repose **jamais sur la couleur seule** (la maquette fantôme a aussi un contour net).
- **Animations** : pas de clignotement, pas d'effets agressifs. Mouvements lents et courts (halo doux au survol, brique qui glisse vers son emplacement).
- **Confort VR** : téléportation uniquement, pas de mouvement libre.

## 4. Approche retenue

**Pragmatique + architecturale** :
- Pragmatique : mode guidé d'abord (réussite garantie, rapide à produire).
- Architecturale : moteur séparé des modèles (JSON), pour ajouter des constructions facilement et permettre à d'autres personnes de contribuer.
- Évolution possible plus tard : mode de construction libre sur grille, réutilisant le même moteur.

## 5. Plan par étapes (avec vérification)

1. **Socle** : scène Three.js, entrée en mode VR, affichage des mains → *vérif : session WebXR qui démarre dans un navigateur de test avec émulateur.*
2. **Saisie par pincement** : attraper et lâcher une brique → *vérif : seuil de pincement testé (simulé).*
3. **Accrochage + maquette fantôme + annulation** → *vérif : chaque brique s'accroche à la bonne place.*
4. **Téléportation par pastilles** → *vérif : déplacement sans décalage de la zone de jeu.*
5. **Premier modèle (voilier, environ 12 à 15 briques)** avec texte d'aide et message de réussite.
6. **README + déploiement** sur GitHub Pages.

Ensuite : maison/église, vélo, puis autres modèles simples.

## 6. Points encore à confirmer

- **Licence** : MIT, validée (titulaire : « P »).
- **Ordre des modèles** : voilier, puis maison/église, puis vélo (validé).
- Étapes 1 et 2 terminées ; étape 3 en test (voir README).

## 7. Limites connues

- Pas de test possible sur un vrai casque côté assistant : vérification via un émulateur WebXR dans un navigateur sur PC. Le joueur testeur doit ensuite remonter ses retours en casque (confort, taille des briques, précision des mains).
- Le suivi des mains doit être activé dans les réglages du Quest.
- Test depuis VS Code sur le Quest : nécessite `localhost` ou HTTPS (méthodes possibles : câble + `adb reverse`, ou émulateur navigateur sur PC). **À vérifier dans la documentation officielle de Meta à l'étape 1.**
- Les API (WebXR Device API, Hand Input, Three.js) doivent être vérifiées dans leur documentation officielle avant usage. En cas de doute, le dire plutôt qu'improviser.

## 8. Préférences de collaboration (à respecter)

- **Ne rien implémenter sans accord explicite** : proposer d'abord, attendre la validation, puis exécuter.
- Répondre et commenter le code **en français de France**.
- Code : **commentaires et docstrings** (JSDoc), **noms de variables lisibles** (pas d'abréviations cryptiques).
- Changements **minimaux et ciblés** : ne pas refactorer ni « améliorer » le code non concerné. Simplicité d'abord, pas de fonctionnalité non demandée.
- Web : attributs ARIA et `label` pour tout élément HTML (page d'accueil, bouton d'entrée en VR), contrastes suffisants.
- Pour chaque problème, proposer l'approche **optimale**, **pragmatique** ou **architecturale**, indiquer le choix recommandé et pourquoi.
- Créer `README.md` s'il est absent, et le mettre à jour après toute modification significative.
- Débogage : en cas de problème difficile à tracer, mettre en place un fichier de log à la racine (`debug.log` ou `erreurs.log`) avec horodatage, contexte, message d'erreur et stack trace ; l'ajouter à `.gitignore` ; le supprimer une fois le problème résolu, sauf demande contraire.
- Ne pas supposer d'outil (npm, bundler, framework) sans confirmation.

## 9. Structure de projet envisagée (à valider avant création)

```
/
├── index.html          # Page d'entrée : bouton « Entrer en réalité virtuelle »
├── README.md
├── CONTEXTE.md
├── LICENSE             # à confirmer (MIT proposée)
├── src/
│   ├── main.js         # Initialisation scène, rendu, session WebXR
│   ├── hands.js        # Suivi des mains et détection du pincement
│   ├── bricks.js       # Briques, saisie, accrochage magnétique
│   ├── teleport.js     # Pastilles de téléportation
│   ├── ui.js           # Texte d'aide en gros, bouton Annuler
│   └── modeles.js      # Chargement des modèles JSON
└── modeles/
    └── voilier.json    # Premier modèle
```

> Three.js serait chargé via une *import map* (CDN ou copie locale), sans étape de compilation. Le choix exact (CDN ou fichier local, version) sera à confirmer après vérification de la documentation officielle.

## 10. Prochaine action

Faire valider le **rendu réaliste** et les ajouts (carte de progression, bouton « œil », chute douce) dans l'émulateur et en casque, décider des **sons doux** (en attente), puis proposer le plan de l'**étape 4** (téléportation par pastilles).
