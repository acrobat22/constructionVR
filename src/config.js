/**
 * @file Réglages centralisés du jeu.
 *
 * Toutes les valeurs ajustables (tailles, hauteurs, couleurs, options de
 * session) sont regroupées ici : on adapte le jeu après les retours en casque
 * sans toucher à la logique des modules.
 *
 * Unités : mètres pour les distances, millisecondes pour les durées,
 * couleurs au format hexadécimal Three.js.
 */

/**
 * Configuration globale, figée pour éviter toute modification accidentelle.
 * Chaque section est documentée ci-dessous.
 */
export const CONFIG = Object.freeze({
  scene: Object.freeze({
    /**
     * Décor clair et doux. Le texte, lui, est toujours posé sur un panneau
     * sombre opaque pour garder un contraste d'au moins 7:1.
     */
    couleurFond: 0xc9d3dd,
    /** Brouillard léger qui estompe l'horizon (distances de début et de fin). */
    brouillardDebut: 6,
    brouillardFin: 30,
    couleurSol: 0x9ea7b0,
    /** Côté du sol carré, en mètres. */
    tailleSol: 60,
  }),

  eclairage: Object.freeze({
    /** Lumière du ciel : couleur du haut, couleur du bas, intensité. */
    couleurCiel: 0xffffff,
    couleurSolReflet: 0x8d8d8d,
    intensiteCiel: 1.1,
    /** Soleil : projette les ombres. Placé derrière le joueur, à gauche. */
    intensiteSoleil: 1.9,
    positionSoleil: Object.freeze({ x: -1.0, y: 2.6, z: 0.4 }),
    /** Reflets doux sur le plastique (environnement calculé une fois). */
    intensiteEnvironnement: 0.3,
    /** Ombres : résolution, flou des bords, demi-largeur de la zone couverte. */
    resolutionOmbre: 1024,
    flouOmbre: 3,
    etendueOmbre: 1.0,
  }),

  camera: Object.freeze({
    /**
     * Hauteur des yeux d'une personne assise, utilisée uniquement pour
     * l'aperçu hors VR (en VR, c'est le casque qui fournit la position).
     */
    hauteurYeuxAssis: 1.2,
    champDeVision: 70,
  }),

  table: Object.freeze({
    /** Hauteur du plateau : table standard, confortable en position assise. */
    hauteur: 0.72,
    largeur: 1.2,
    profondeur: 0.7,
    epaisseur: 0.04,
    /** Distance entre le joueur et le centre de la table. */
    distanceJoueur: 0.6,
    couleur: 0x9a7350,
    couleurPieds: 0x6e5038,
    rayonPieds: 0.025,
  }),

  session: Object.freeze({
    mode: 'immersive-vr',
    /** Référentiel dont l'origine est au niveau du sol réel. */
    typeReferentiel: 'local-floor',
    fonctionnalitesRequises: Object.freeze(['local-floor']),
    /** Optionnel : la session démarre même si le suivi des mains est désactivé. */
    fonctionnalitesOptionnelles: Object.freeze(['hand-tracking']),
  }),

  mains: Object.freeze({
    /** « mesh » : mains réalistes, modèles copiés localement (licence MIT). */
    profilAffichage: 'mesh',
    cheminModeles: './vendor/webxr-input-profiles/generic-hand/',
    /**
     * Seuils de pincement (distance pouce–index), plus tolérants que ceux de
     * Three.js (1,5 cm / 2,5 cm). L'écart entre les deux absorbe les tremblements.
     */
    pincement: Object.freeze({
      seuilFermeture: 0.025,
      seuilOuverture: 0.04,
    }),
  }),

  saisie: Object.freeze({
    /**
     * Distance maximale entre le point de pincement et la surface d'une brique
     * pour pouvoir la saisir : zone volontairement généreuse.
     */
    rayonSaisie: 0.06,
  }),

  /** Grille de construction : une brique 2 × 2 mesure 8 × 4,8 × 8 cm. */
  grille: Object.freeze({
    /** Écart entre deux tenons. */
    pas: 0.04,
    /** Hauteur d'une couche de briques (sans les tenons). */
    hauteurCouche: 0.048,
    rayonTenon: 0.012,
    hauteurTenon: 0.0085,
    /** Arrondi des arêtes. */
    rayonArrondi: 0.003,
    /** Petit jeu entre briques voisines pour qu'on distingue leurs contours. */
    jeu: 0.001,
  }),

  brique: Object.freeze({
    /** Aspect plastique satiné (0 = miroir, 1 = mat). */
    rugosite: 0.32,
    /** Intensité du halo doux affiché au survol (lumière émise, sans clignotement). */
    intensiteHalo: 0.35,
  }),

  plaqueDeBase: Object.freeze({
    couleur: 0x3c8d4e,
    /** Épaisseur de la plaque (sans les tenons). */
    epaisseur: 0.016,
    /** Tenons de marge autour du modèle. */
    marge: 2,
  }),

  fantome: Object.freeze({
    /** Transparence de l'emplacement visé (0 = invisible, 1 = opaque). */
    opacite: 0.35,
    /** Contour net : l'information ne repose jamais sur la seule couleur. */
    couleurContour: 0xffffff,
    epaisseurContour: 0.0035,
  }),

  accrochage: Object.freeze({
    /** Distance entre la brique lâchée et sa place pour qu'elle s'y accroche. */
    distance: 0.05,
    /** Durée du glissement doux vers la place (ou du retour à la réserve). */
    dureeGlissement: 350,
  }),

  /** Emplacements sur la table, relatifs au centre du plateau (x à droite, z vers le joueur). */
  disposition: Object.freeze({
    modele: Object.freeze({ x: 0, z: -0.05 }),
    reserve: Object.freeze({ x: 0.12, z: 0.2 }),
    boutonAnnuler: Object.freeze({ x: -0.38, z: 0.18 }),
  }),

  boutonAnnuler: Object.freeze({
    largeur: 0.24,
    profondeur: 0.12,
    hauteur: 0.03,
    /** Inclinaison vers le joueur, en radians (environ 20°). */
    inclinaison: 0.35,
    /** Marge autour du bouton dans laquelle un pincement l'active. */
    margeVisee: 0.03,
    /** Enfoncement visuel lors de l'appui, et sa durée. */
    enfoncement: 0.008,
    dureeAppui: 180,
  }),

  /** Modèle chargé au démarrage. */
  modele: Object.freeze({
    url: './modeles/essai.json',
  }),
});
