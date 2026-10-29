/**
 * @file Lampe chaude suspendue au-dessus de la table.
 *
 * Elle éclaire le plan de travail et projette des ombres douces (comme la
 * lampe du puzzle qui a inspiré l'ambiance). Sa qualité d'ombre peut être
 * réduite si l'affichage ralentit (voir `qualiteAdaptative.js`).
 */

import * as THREE from 'three';

/**
 * Lampe suspendue : source de lumière + objet visible (fil, abat-jour, ampoule).
 */
export class Lampe {
  /**
   * @param {typeof import('../config.js').CONFIG.lampe} reglages - Réglages de la lampe.
   * @param {{ x: number, y: number, z: number }} cible - Point visé (centre du plateau).
   */
  constructor(reglages, cible) {
    this.reglages = reglages;

    /** Groupe à ajouter à la scène. */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'lampe';
    this.objet3D.position.set(cible.x, reglages.hauteur, cible.z);

    this.lumiere = new THREE.SpotLight(reglages.couleur, reglages.intensite, 0, reglages.angle, reglages.penombre, 2);
    this.lumiere.castShadow = true;
    this.lumiere.shadow.mapSize.set(reglages.resolutionOmbre, reglages.resolutionOmbre);
    this.lumiere.shadow.radius = reglages.flouOmbre;
    // Évite les stries d'auto-ombrage sur les faces des briques.
    this.lumiere.shadow.bias = -0.0003;
    this.lumiere.shadow.normalBias = 0.01;
    this.lumiere.shadow.camera.near = 0.2;
    this.lumiere.shadow.camera.far = 3;
    // L'ampoule est juste sous l'abat-jour.
    this.lumiere.position.set(0, -0.02, 0);
    this.objet3D.add(this.lumiere);
    // La cible est exprimée dans le repère de la scène : on la place en relatif.
    this.lumiere.target.position.set(0, cible.y - reglages.hauteur, 0);
    this.objet3D.add(this.lumiere.target);

    this.#creerAspect();
  }

  /**
   * Change la résolution de l'ombre (la carte sera recréée à la prochaine image).
   *
   * @param {number} resolution - Côté de la carte d'ombre, en pixels.
   */
  definirResolutionOmbre(resolution) {
    this.lumiere.shadow.mapSize.set(resolution, resolution);
    this.lumiere.shadow.map?.dispose();
    this.lumiere.shadow.map = null;
  }

  /** Coupe les ombres projetées (les ombres de contact restent). */
  desactiverOmbres() {
    this.lumiere.castShadow = false;
  }

  /** Construit l'objet visible : fil, abat-jour conique et ampoule lumineuse. */
  #creerAspect() {
    const fil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }),
    );
    fil.position.y = 0.6 + 0.08;
    this.objet3D.add(fil);

    // Abat-jour : profil tourné autour de l'axe vertical.
    const profil = [
      new THREE.Vector2(0.03, 0.08),
      new THREE.Vector2(0.05, 0.06),
      new THREE.Vector2(0.16, -0.04),
      new THREE.Vector2(0.17, -0.05),
    ];
    const abatJour = new THREE.Mesh(
      new THREE.LatheGeometry(profil, 48),
      new THREE.MeshStandardMaterial({
        color: this.reglages.couleurAbatJour,
        roughness: 0.4,
        metalness: 0.2,
        side: THREE.DoubleSide,
      }),
    );
    this.objet3D.add(abatJour);

    // Ampoule : non éclairée, elle « brille » de sa propre couleur chaude.
    const ampoule = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff1d6 }),
    );
    ampoule.position.y = -0.01;
    this.objet3D.add(ampoule);
  }
}
