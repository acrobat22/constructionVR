# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Non publié]

### Ajouté
- 2026-10-28 — Étape 3 (accrochage, maquette fantôme, annulation) :
  mode guidé une brique à la fois, emplacement fantôme translucide avec
  contour net, accrochage à 5 cm avec glissement doux, bouton 3D « Annuler »
  toujours visible, modèle d'essai `modeles/essai.json` et chargeur JSON validé.
  18 nouveaux tests `node --test` (historique, accrochage, chargeur).
- Rendu soigné : lumière du ciel + soleil avec ombres douces, brouillard léger,
  briques à tenons et arêtes arrondies, plaque de base, table à pieds,
  reflets doux (`RoomEnvironment`).
- Mains réalistes (modèles `@webxr-input-profiles/assets`, copiés localement).
- 2026-10-28 — Étape 2 (saisie par pincement) : détecteur de pincement maison
  à deux seuils réglables (2,5 cm / 4 cm) avec 11 tests `node --test`,
  brique d'essai avec halo doux au survol, saisie / déplacement / relâchement.
- 2026-10-28 — Étape 1 (socle) : page d'accueil accessible avec bouton
  « Entrer en réalité virtuelle », scène 3D (sol, table à hauteur assise),
  session WebXR en référentiel `local-floor`, affichage des mains en sphères.
  La disponibilité de la VR est revérifiée à chaque événement `devicechange`.
- Three.js 0.186.1 copié localement dans `vendor/three/`, chargé par *import map*.
- Réglages centralisés dans `src/config.js`.
- `README.md`, `LICENSE` (MIT), `.gitignore`.

### Modifié
- 2026-10-28 — Décor clair (au lieu d'un fond sombre) ; le texte reste posé
  sur des panneaux sombres opaques (contraste ≥ 7:1).
- La brique d'essai unique de l'étape 2 est remplacée par le modèle d'essai.

---

<!-- Exemple d'entrée versionnée :
## [1.2.0] — 2026-06-23

### Ajouté
- Nouvelle fonctionnalité X

### Corrigé
- Bug Y résolu
-->
