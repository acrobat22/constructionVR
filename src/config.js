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
  /**
   * Pièce réelle autour du joueur : photo panoramique (Poly Haven, CC0)
   * projetée au sol, et version HDR de la même pièce pour l'éclairage.
   */
  ambiance: Object.freeze({
    photoFond: './ressources/environnements/lebombo_4k.jpg',
    eclairageHdr: './ressources/environnements/lebombo_1k.hdr',
    /** Hauteur de l'appareil photo lors de la prise de vue (calage du sol). */
    hauteurPrise: 1.6,
    /** Rayon approximatif de la pièce. */
    rayonPiece: 9,
    /** Rotation de la pièce autour du joueur, en radians (place la fenêtre). */
    rotation: 2.2,
    /** Intensité des reflets et de la lumière ambiante venant de la photo. */
    intensiteEnvironnement: 0.6,
    /** Couleur de secours si la photo ne se charge pas. */
    couleurSecours: 0xd8d2c8,
    /** Opacité des ombres projetées sur le sol de la photo. */
    opaciteOmbreSol: 0.35,
  }),

  /** Lampe chaude suspendue au-dessus de la table : principale source d'ombres. */
  lampe: Object.freeze({
    couleur: 0xffe6c8,
    intensite: 9,
    /** Hauteur de l'ampoule au-dessus du sol. */
    hauteur: 1.8,
    /**
     * Décalage par rapport au centre du plateau (vers la gauche et le fond) :
     * les ombres tombent alors visiblement vers le joueur, sans gêner la vue.
     */
    decalage: Object.freeze({ x: -0.25, z: -0.2 }),
    /** Ouverture du cône de lumière (radians) et douceur de son bord (0 à 1). */
    angle: 0.75,
    penombre: 0.9,
    /** Résolutions d'ombre : normale, puis réduite si l'affichage ralentit. */
    resolutionOmbre: 1024,
    resolutionOmbreReduite: 512,
    flouOmbre: 3,
    couleurAbatJour: 0x2f4a3c,
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
    /** Chêne clair (Poly Haven, CC0) : couleur, relief, rugosité. */
    textureCouleur: './ressources/textures/chene/oak_veneer_01_diff_1k.jpg',
    textureRelief: './ressources/textures/chene/oak_veneer_01_nor_gl_1k.jpg',
    textureRugosite: './ressources/textures/chene/oak_veneer_01_rough_1k.jpg',
    /** Taille réelle couverte par une répétition de la texture. */
    tailleMotif: 0.8,
    couleurSecours: 0xc19a6b,
    couleurPieds: 0x8a6a48,
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

  /** Mode « Essayer sans casque » : la souris remplace la main. */
  souris: Object.freeze({
    /** Surélévation du point pendant une prise : la brique survole la surface visée. */
    hauteurLevee: 0.05,
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

  /** Ombre douce au pied des objets posés (imite l'occultation ambiante). */
  ombreContact: Object.freeze({
    /** Débord de l'ombre autour de l'objet (1 = taille exacte). */
    debord: 1.35,
    opacite: 0.7,
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

  /** Brique lâchée hors de sa place : elle descend doucement se poser. */
  chute: Object.freeze({
    dureeMinimale: 250,
    /** Durée supplémentaire par mètre de hauteur. */
    dureeParMetre: 1200,
  }),

  /** Emplacements sur la table, relatifs au centre du plateau (x à droite, z vers le joueur). */
  disposition: Object.freeze({
    modele: Object.freeze({ x: 0, z: -0.05 }),
    reserve: Object.freeze({ x: 0.12, z: 0.2 }),
    boutonAnnuler: Object.freeze({ x: -0.38, z: 0.18 }),
    boutonModele: Object.freeze({ x: 0.4, z: 0.18 }),
    miniature: Object.freeze({ x: 0.4, z: -0.2 }),
  }),

  /** Boutons 3D posés sur la table (« Annuler », « Voir le modèle »). */
  bouton: Object.freeze({
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

  /** Modèle terminé en miniature, affiché par le bouton « œil ». */
  miniature: Object.freeze({
    echelle: 0.5,
    /** Rotation fixe (vue de trois quarts), en radians. */
    rotation: -0.6,
    visibleAuDemarrage: false,
  }),

  /** Carte de progression (nom du modèle, avancement), sans chrono. */
  carte: Object.freeze({
    largeur: 0.62,
    hauteur: 0.28,
    /** Position : derrière la table, face au joueur, à environ 1 m. */
    position: Object.freeze({ x: 0, y: 1.12, z: -1.05 }),
  }),

  /** Qualité adaptative : surveillance de la fluidité. */
  qualite: Object.freeze({
    imagesAIgnorer: 120,
    imagesParMesure: 90,
    /** Écart moyen entre images au-delà duquel on baisse la qualité (≈ 55 images/s). */
    seuilMoyenMs: 18,
    ecartMaximalMs: 120,
  }),

  /** Modèle chargé au démarrage. */
  modele: Object.freeze({
    url: './modeles/voilier.json',
  }),
});
