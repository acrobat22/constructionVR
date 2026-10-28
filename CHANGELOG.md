# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Non publié]

### Ajouté
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

---

<!-- Exemple d'entrée versionnée :
## [1.2.0] — 2026-06-23

### Ajouté
- Nouvelle fonctionnalité X

### Corrigé
- Bug Y résolu
-->
