/**
 * @file Durée indicative d'une construction, d'après son nombre de pièces.
 *
 * Affichée sur les cartes du menu en mots (« Court », « Moyen », « Long »)
 * doublés de points (●○○), jamais par la couleur seule. On parle de durée et
 * non de difficulté, pour ne décourager personne.
 *
 * Logique pure (sans DOM) : testable avec `node --test`.
 */

/**
 * @typedef {object} PalierDuree
 * @property {string} libelle - Mot affiché (« Court »).
 * @property {number} points - Nombre de points pleins, de 1 à 3.
 * @property {number} maximumPieces - Nombre de pièces maximal de ce palier.
 */

/** Paliers, du plus court au plus long. @type {readonly PalierDuree[]} */
export const PALIERS_DUREE = Object.freeze([
  Object.freeze({ libelle: 'Court', points: 1, maximumPieces: 6 }),
  Object.freeze({ libelle: 'Moyen', points: 2, maximumPieces: 9 }),
  Object.freeze({ libelle: 'Long', points: 3, maximumPieces: Infinity }),
]);

/**
 * Palier de durée d'un modèle.
 *
 * @param {number} nombrePieces - Nombre de pièces du modèle.
 * @returns {PalierDuree}
 */
export function calculerPalierDuree(nombrePieces) {
  return PALIERS_DUREE.find((palier) => nombrePieces <= palier.maximumPieces);
}

/**
 * Points du palier, pleins puis vides (« ●●○ »).
 *
 * @param {PalierDuree} palier - Palier à représenter.
 * @returns {string}
 */
export function dessinerPoints(palier) {
  return '●'.repeat(palier.points) + '○'.repeat(PALIERS_DUREE.length - palier.points);
}
