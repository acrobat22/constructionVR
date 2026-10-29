/**
 * @file Où se pose une brique lâchée hors de sa place (« chute douce ») ?
 *
 * Logique pure (sans Three.js), testable avec `node --test`. Les emprises
 * sont des rectangles horizontaux en coordonnées de la scène.
 */

/** Issues possibles d'un lâcher. */
export const RESULTAT_REPOS = Object.freeze({
  /** La brique descend se poser à la hauteur indiquée. */
  POSER: 'poser',
  /** La brique est hors de la table : elle retourne à la réserve (jamais par terre). */
  RESERVE: 'reserve',
});

/**
 * @typedef {object} Emprise
 * @property {number} minX
 * @property {number} maxX
 * @property {number} minZ
 * @property {number} maxZ
 */

/**
 * @typedef {Emprise & { dessus: number }} Support
 * Surface sur laquelle on peut poser une brique (table, plaque, brique posée).
 */

/**
 * Tolérance de recouvrement : deux rectangles qui se touchent juste par
 * un bord ne se chevauchent pas.
 */
const TOLERANCE = 1e-6;

/**
 * Indique si deux emprises se chevauchent réellement.
 *
 * @param {Emprise} a - Première emprise.
 * @param {Emprise} b - Seconde emprise.
 * @returns {boolean}
 */
function seChevauchent(a, b) {
  return a.minX < b.maxX - TOLERANCE && a.maxX > b.minX + TOLERANCE
    && a.minZ < b.maxZ - TOLERANCE && a.maxZ > b.minZ + TOLERANCE;
}

/**
 * Calcule où se pose une brique lâchée.
 *
 * @param {Emprise} empriseBrique - Emprise de la brique au moment du lâcher.
 * @param {Support[]} supports - Surfaces disponibles.
 * @param {Emprise} zoneTable - Zone de la table : si le centre de la brique en sort, retour à la réserve.
 * @returns {{ resultat: 'poser' | 'reserve', hauteur: number | null }}
 *   `hauteur` : dessus du support le plus haut sous la brique (si `poser`).
 */
export function calculerRepos(empriseBrique, supports, zoneTable) {
  const centreX = (empriseBrique.minX + empriseBrique.maxX) / 2;
  const centreZ = (empriseBrique.minZ + empriseBrique.maxZ) / 2;
  const centreSurLaTable = centreX >= zoneTable.minX && centreX <= zoneTable.maxX
    && centreZ >= zoneTable.minZ && centreZ <= zoneTable.maxZ;
  if (!centreSurLaTable) {
    return { resultat: RESULTAT_REPOS.RESERVE, hauteur: null };
  }

  // Le support le plus haut l'emporte : la brique ne traverse jamais rien.
  const hauteur = supports
    .filter((support) => seChevauchent(empriseBrique, support))
    .reduce((plusHaut, support) => Math.max(plusHaut, support.dessus), -Infinity);

  return Number.isFinite(hauteur)
    ? { resultat: RESULTAT_REPOS.POSER, hauteur }
    : { resultat: RESULTAT_REPOS.RESERVE, hauteur: null };
}
