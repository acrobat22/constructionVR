# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Non publié]

### Ajouté
- 2026-10-29 — Sons doux (Web Audio, sans fichier) : « toc » à la saisie et à
  l'appui d'un bouton, « clic » à l'accrochage, mélodie montante à la fin.
  Fréquences ≤ 1 000 Hz, volume modéré, case « Sons doux » sur l'accueil.
  6 nouveaux tests avec un faux contexte audio.
- Bouton « Écouter » à côté de la case « Sons doux » : joue la mélodie de
  réussite pour régler le volume avant de mettre le casque.
- 2026-10-29 — Étape 5 : le voilier (`modeles/voilier.json`, 14 briques : coque,
  mât, voile, fanion), chargé au démarrage. Ligne d'aide permanente sur la carte
  de progression et message de félicitations à la fin.
- Validation « constructible » des modèles : une brique doit reposer sur une
  brique posée avant elle, sans chevauchement (5 nouveaux tests).
- 2026-10-29 — Mode « Essayer sans casque » : la souris remplace la main
  (cliquer-glisser-relâcher, clic sur les boutons 3D), barre d'aide, `Échap`
  pour revenir à l'accueil. Désactivé automatiquement à l'entrée en VR.
- 2026-10-29 — Rendu réaliste inspiré d'un puzzle 3D : pièce photographiée
  autour du joueur (`GroundedSkybox` + éclairage HDR « Lebombo », Poly Haven
  CC0), lampe chaude suspendue avec ombres douces, plateau en chêne texturé
  (couleur, relief, rugosité), rendu « appareil photo » (`NeutralToneMapping`),
  ombres de contact sous les objets posés.
- Carte de progression (nom du modèle, « Brique 2 sur 3 », pastilles), sans chrono.
- Bouton « œil » : miniature du modèle terminé, affichée ou cachée.
- Chute douce : une brique lâchée descend se poser ; hors de la table, elle
  revient dans la réserve.
- Qualité adaptative : ombres réduites puis coupées si l'affichage ralentit.
- 12 nouveaux tests (supports, qualité adaptative).
- `serveur.py` : serveur local sans cache navigateur (modifications visibles au
  simple rechargement, y compris sur le Quest).
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
- 2026-10-29 — Le décor « ciel + brouillard » est remplacé par une pièce réelle ;
  le bouton « Annuler » devient un bouton 3D générique (`interface/bouton3D.js`).
- Une brique lâchée hors de sa place ne flotte plus : elle descend se poser.

### Supprimé
- `src/interface/boutonAnnuler.js`, remplacé par `bouton3D.js` + `icones.js`.

---

<!-- Exemple d'entrée versionnée :
## [1.2.0] — 2026-06-23

### Ajouté
- Nouvelle fonctionnalité X

### Corrigé
- Bug Y résolu
-->
