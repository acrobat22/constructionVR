/**
 * @file Réglages centralisés du jeu.
 *
 * Toutes les valeurs ajustables (tailles, hauteurs, couleurs, options de
 * session) sont regroupées ici : on adapte le jeu après les retours en casque
 * sans toucher à la logique des modules.
 *
 * Unités : mètres pour les distances, couleurs au format hexadécimal Three.js.
 */

/**
 * Configuration globale, figée pour éviter toute modification accidentelle.
 * @type {Readonly<{
 *   scene: { couleurFond: number, couleurSol: number, tailleSol: number },
 *   camera: { hauteurYeuxAssis: number, champDeVision: number },
 *   table: { hauteur: number, largeur: number, profondeur: number, epaisseur: number, distanceJoueur: number, couleur: number },
 *   session: { mode: string, typeReferentiel: string, fonctionnalitesRequises: string[], fonctionnalitesOptionnelles: string[] },
 *   mains: { profilAffichage: string, pincement: { seuilFermeture: number, seuilOuverture: number } },
 *   saisie: { rayonSaisie: number },
 *   brique: { largeur: number, hauteur: number, profondeur: number, intensiteHalo: number },
 *   briqueDeTest: { couleur: number, decalageVersJoueur: number }
 * }>}
 */
export const CONFIG = Object.freeze({
  scene: Object.freeze({
    /** Fond sombre pour garantir un fort contraste avec le texte clair. */
    couleurFond: 0x1a1d24,
    couleurSol: 0x2b2f38,
    /** Côté du sol carré, en mètres. */
    tailleSol: 20,
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
    couleur: 0x8a6a4a,
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
    /** « spheres » : aucun fichier 3D à télécharger depuis un serveur externe. */
    profilAffichage: 'spheres',
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

  brique: Object.freeze({
    /** Dimensions d'une brique de base, assez grosse pour être saisie facilement. */
    largeur: 0.08,
    hauteur: 0.05,
    profondeur: 0.08,
    /** Intensité du halo doux affiché au survol (lumière émise, sans clignotement). */
    intensiteHalo: 0.35,
  }),

  /** Brique d'essai de l'étape 2, posée sur la table. */
  briqueDeTest: Object.freeze({
    couleur: 0xd93a2b,
    /** Décalage depuis le centre de la table, vers le joueur. */
    decalageVersJoueur: 0.15,
  }),
});
