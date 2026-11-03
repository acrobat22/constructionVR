/**
 * @file Rotation douce par quarts de tour, pour la miniature du modèle
 * (bouton « Tourner »).
 *
 * Logique pure, sans Three.js : on demande l'angle à chaque image et on
 * l'applique à l'objet. Testable avec `node --test`.
 */

import { adoucir } from './accrochage.js';

/** Un quart de tour, dans le sens des aiguilles d'une montre vu de dessus. */
const QUART_DE_TOUR = -Math.PI / 2;

/**
 * Fait tourner un angle d'un quart de tour à chaque demande, en douceur.
 */
export class RotationDouce {
  /**
   * @param {number} angleDepart - Angle de départ, en radians.
   * @param {number} duree - Durée d'un quart de tour, en millisecondes.
   */
  constructor(angleDepart, duree) {
    this.duree = duree;
    this.reinitialiser(angleDepart);
  }

  /**
   * Revient sans animation à un angle donné (nouvelle partie).
   *
   * @param {number} angleDepart - Angle de départ, en radians.
   */
  reinitialiser(angleDepart) {
    this.angleDepart = angleDepart;
    this.angleVise = angleDepart;
    /** @type {number | null} Instant de début du quart de tour en cours. */
    this.debut = null;
  }

  /**
   * Lance un quart de tour depuis l'angle actuel. Un appui pendant un
   * mouvement en cours est ignoré : un pincement = un quart de tour.
   *
   * @param {number} temps - Instant courant, en millisecondes.
   */
  tourner(temps) {
    if (this.estEnMouvement(temps)) {
      return;
    }
    this.angleDepart = this.angleVise;
    this.angleVise = this.angleDepart + QUART_DE_TOUR;
    this.debut = temps;
  }

  /**
   * @param {number} temps - Instant courant, en millisecondes.
   * @returns {boolean} `true` tant que le quart de tour n'est pas fini.
   */
  estEnMouvement(temps) {
    return this.debut !== null && temps - this.debut < this.duree;
  }

  /**
   * Angle à afficher à cet instant.
   *
   * @param {number} temps - Instant courant, en millisecondes.
   * @returns {number} Angle en radians.
   */
  angle(temps) {
    if (this.debut === null) {
      return this.angleVise;
    }
    const progression = adoucir((temps - this.debut) / this.duree);
    return this.angleDepart + (this.angleVise - this.angleDepart) * progression;
  }
}
