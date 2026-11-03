# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Non publié]

### Ajouté
- 2026-11-03 — Trois constructions de plus : la citrouille (visage peint,
  nouveau décor « citrouille »), l'arbre dans son pot et le crocodile à la
  gueule ouverte. 24 modèles au menu.
- 2026-11-03 — 16 nouvelles constructions en grosses pièces : maisonnette,
  sapin, gâteau d'anniversaire, chapelle, maison, château fort, bateau, petit
  train, avion, canard, cygne, chien, cheval, bonhomme, clown et marin
  (les personnages ont une tête ronde, comme le lion). Couleurs pastel liées
  à ce que représente la construction (tuile, ardoise, pierre, eau…),
  contrastées sur le tapis et la planchette.
- Huit nouveaux décors peints : porte, fenêtre, rayures, hélice, fruits,
  hublots, visage humain, visage de clown. 1 nouveau test (79 au total).
- 2026-10-29 — Aide à l'emplacement : le cadre fantôme est éteint par défaut ;
  une lampe de bureau sur la table l'allume ou l'éteint (plaque « Aide :
  allumée / éteinte »), et un coup de pouce l'allume en fondu si la pièce n'est
  pas posée au bout de 30 s. Cases de la première pièce colorées sur la
  planchette. Textes d'aide adaptés. 8 nouveaux tests (78 au total).
- 2026-10-29 — Choix du modèle sur la page d'accueil : grandes cartes (vignette
  générée par le jeu, nom, nombre de pièces), boutons radio accessibles, coche
  et bordure épaisse pour la sélection. Catalogue `modeles/catalogue.json`.
- Présentation du modèle à l'arrivée : le modèle terminé est montré sur la
  planchette avec l'explication du jeu ; la construction démarre avec le
  bouton 3D « Commencer ». Rubrique « Comment jouer » sur l'accueil.
- Changer de modèle remet la partie à zéro (au choix, au retour à l'accueil,
  à la fin d'une session VR). 5 nouveaux tests (catalogue).
- 2026-10-29 — Formes arrondies : pente, quart de rond, cylindre (debout ou
  couché), pointe, hauteurs de pièce variables, et décors peints (œil souriant,
  œil rond, profil, visage, taches, écailles) dessinés par le jeu.
- Quatre animaux originaux en grosses pièces : baleine (9), girafe (9), lion (7)
  et dragon (10).
- Validation étendue : pièces posées seulement sur un dessus plat, aucun
  chevauchement en hauteur (10 nouveaux tests, 65 au total).
- 2026-10-29 — Blocs de bois peints : pin (Poly Haven, CC0) aux nervures
  accentuées sous une peinture pastel (luminosité compensée), arêtes adoucies,
  décalage de grain aléatoire par bloc. Planchette de base en bois clair au
  quadrillage gravé. 4 nouveaux tests (contraste du grain).
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
- 2026-10-29 — Le jeu s'appelle désormais « Construction en blocs » (titre,
  accueil, carte « Bloc 3 sur 14 ») ; le code et la clé JSON `briques` sont inchangés.
- 2026-10-29 — Couleurs des modèles passées en pastels ; contour de la maquette
  fantôme foncé (meilleur contraste sur pastel et bois clair) ; aide :
  « Pincez le bloc et posez-le dans le cadre. »

### Supprimé
- 2026-10-29 — Briques à tenons et plaque verte, remplacées par les blocs de
  bois peints (réglages `rayonTenon` et `hauteurTenon` retirés).
- `src/interface/boutonAnnuler.js`, remplacé par `bouton3D.js` + `icones.js`.

---

<!-- Exemple d'entrée versionnée :
## [1.2.0] — 2026-06-23

### Ajouté
- Nouvelle fonctionnalité X

### Corrigé
- 2026-10-29 — Contraste des pièces : elles ressortaient mal (1,03:1 pour la
  girafe jaune sur la planchette claire). Tapis de jeu en feutrine vert sapin
  (texture « Caban », Poly Haven, CC0), planchette en noyer foncé au quadrillage
  clair, contour de l'emplacement repassé en clair. Contraste mesuré : 3,25 à
  9,14 sur le tapis, 4,03 à 11,32 sur la planchette (objectif WCAG : 3:1).
- 2026-10-29 — Mode sans casque : la carte d'explication sortait du haut de
  l'écran et la tête de la girafe était tout en haut. Nouvelle vue (caméra en
  retrait, visée entre planchette et carte, réglable dans `config.js`), et
  chaque planchette est placée avec son bord avant juste derrière la réserve :
  les petites planchettes se rapprochent du joueur (6 cm pour la girafe).
- 2026-10-29 — Mode souris : une pièce placée en hauteur et en surplomb (tête
  du dragon) tombait derrière sa place. Pendant une prise, la pièce glisse
  désormais à la hauteur de son emplacement et se centre sur le curseur.
- Bug Y résolu
-->
