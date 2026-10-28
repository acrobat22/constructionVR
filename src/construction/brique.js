/**
 * @file Aspect visuel d'une brique et de son halo de survol.
 */

import * as THREE from 'three';

/**
 * Une brique saisissable : un pavé coloré avec un halo doux au survol.
 */
export class Brique {
  /**
   * @param {typeof import('../config.js').CONFIG.brique} reglages - Dimensions et halo.
   * @param {number} couleur - Couleur de la brique (hexadécimal Three.js).
   */
  constructor(reglages, couleur) {
    this.reglages = reglages;

    const geometrie = new THREE.BoxGeometry(reglages.largeur, reglages.hauteur, reglages.profondeur);
    this.materiau = new THREE.MeshStandardMaterial({
      color: couleur,
      // Le halo est une lumière émise de la même couleur que la brique.
      emissive: couleur,
      emissiveIntensity: 0,
    });

    /** Objet Three.js à ajouter à la scène et à déplacer. */
    this.objet3D = new THREE.Mesh(geometrie, this.materiau);
    this.objet3D.name = 'brique';
  }

  /**
   * Allume ou éteint le halo doux (changement immédiat, sans clignotement).
   *
   * @param {boolean} estSurvolee - `true` si une main est assez proche pour la saisir.
   */
  definirSurvol(estSurvolee) {
    this.materiau.emissiveIntensity = estSurvolee ? this.reglages.intensiteHalo : 0;
  }
}
