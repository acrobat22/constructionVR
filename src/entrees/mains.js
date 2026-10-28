/**
 * @file Suivi et affichage des mains du joueur (WebXR Hand Input).
 *
 * Étape 1 : les mains sont seulement affichées. La détection du pincement
 * sera ajoutée à l'étape 2 dans un module séparé (`detecteurPincement.js`).
 *
 * Documentation : https://www.w3.org/TR/webxr-hand-input-1/
 */

import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

/** Nombre de mains suivies par WebXR (gauche et droite). */
const NOMBRE_DE_MAINS = 2;

/**
 * Ajoute les deux mains suivies à la scène et garde la trace de celles qui
 * sont détectées par le casque.
 */
export class Mains {
  /**
   * @param {import('three').WebGLRenderer} renderer - Moteur de rendu (avec `xr.enabled`).
   * @param {import('three').Scene} scene - Scène où afficher les mains.
   * @param {typeof import('../config.js').CONFIG.mains} reglages - Réglages d'affichage.
   */
  constructor(renderer, scene, reglages) {
    /**
     * Objets Three.js représentant chaque main ; leurs articulations sont
     * accessibles via `main.joints['index-finger-tip']`, etc.
     * @type {import('three').XRHandSpace[]}
     */
    this.mains = [];

    /**
     * Mains actuellement détectées, indexées par côté (« left » / « right »).
     * @type {Map<XRHandedness, import('three').XRHandSpace>}
     */
    this.mainsDetectees = new Map();

    const fabriqueDeModeles = new XRHandModelFactory();

    for (let indice = 0; indice < NOMBRE_DE_MAINS; indice++) {
      const main = renderer.xr.getHand(indice);
      main.add(fabriqueDeModeles.createHandModel(main, reglages.profilAffichage));

      main.addEventListener('connected', (evenement) => {
        // Une manette déclenche aussi « connected » : on ne garde que les mains.
        if (evenement.data.hand) {
          this.mainsDetectees.set(evenement.data.handedness, main);
        }
      });
      main.addEventListener('disconnected', (evenement) => {
        this.mainsDetectees.delete(evenement.data.handedness);
      });

      scene.add(main);
      this.mains.push(main);
    }
  }
}
