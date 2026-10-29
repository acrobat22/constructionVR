/**
 * @file Atelier : installe un modèle sur la table (planchette, pièces,
 * miniature) et démarre sa présentation. Permet de changer de modèle.
 */

import { Box3 } from 'three';

import { Brique, creerPlaqueDeBase } from './brique.js';
import { creerMiniature } from './miniature.js';
import { chargerModele, calculerEmprise, calculerPositionsEnMetres } from '../modeles/chargeurModele.js';

/**
 * Prépare la table pour un modèle donné.
 */
export class Atelier {
  /**
   * @param {object} dependances
   * @param {import('three').Scene} dependances.scene - Scène (pour la miniature).
   * @param {import('three').Object3D} dependances.conteneurModele - Groupe du modèle sur la table.
   * @param {import('./partie.js').Partie} dependances.partie - Déroulé de la construction.
   * @param {typeof import('../config.js').CONFIG} dependances.config - Configuration globale.
   * @param {import('three').Vector3} dependances.positionMiniature - Où poser la miniature (repère de la scène).
   * @param {import('./supports.js').Support} dependances.supportTable - Plateau de la table, pour la chute douce.
   * @param {import('./boisPeint.js').TexturesBois | null} dependances.texturesBois - Grain du bois (ou `null`).
   * @param {number} dependances.bordAvantPlanchette - Position z (repère de la scène) du bord avant
   *   de la planchette : chaque planchette est placée juste derrière la réserve, selon sa profondeur.
   */
  constructor({ scene, conteneurModele, partie, config, positionMiniature, supportTable, texturesBois, bordAvantPlanchette }) {
    this.scene = scene;
    this.conteneurModele = conteneurModele;
    this.partie = partie;
    this.config = config;
    this.positionMiniature = positionMiniature;
    this.supportTable = supportTable;
    this.texturesBois = texturesBois;
    this.bordAvantPlanchette = bordAvantPlanchette;

    /** @type {import('../modeles/chargeurModele.js').Modele | null} Modèle installé. */
    this.modele = null;
    /** @type {import('three').Group | null} Miniature du modèle terminé (bouton « œil »). */
    this.miniature = null;
    /** @type {import('three').Mesh | null} */
    this.plaque = null;
    /** Numéro de la dernière demande : seule la plus récente est installée. */
    this.derniereDemande = 0;
  }

  /**
   * Installe un modèle et démarre sa présentation. Si une autre demande arrive
   * pendant le chargement, seule la plus récente est installée.
   *
   * @param {string} url - Adresse du fichier du modèle.
   * @returns {Promise<boolean>} `true` si ce modèle a été installé.
   */
  async preparer(url) {
    const demande = ++this.derniereDemande;
    const modele = await chargerModele(url);
    if (demande !== this.derniereDemande) {
      return false;
    }
    this.#installer(modele);
    return true;
  }

  /**
   * Remplace le modèle en cours par celui-ci.
   *
   * @param {import('../modeles/chargeurModele.js').Modele} modele - Modèle validé.
   */
  #installer(modele) {
    const { config } = this;
    // Au revoir l'ancien modèle : pièces, planchette, miniature.
    this.partie.vider();
    this.plaque?.removeFromParent();
    this.miniature?.removeFromParent();

    this.modele = modele;
    const emprise = calculerEmprise(modele);
    const places = calculerPositionsEnMetres(modele, config.grille);

    this.plaque = creerPlaqueDeBase(
      config.grille,
      config.plaqueDeBase,
      emprise.maxX - emprise.minX,
      emprise.maxZ - emprise.minZ,
      config.ombreContact,
      this.texturesBois,
      config.boisPeint,
    );
    // Une planchette peu profonde se rapproche du joueur (bord avant fixe).
    const profondeurPlanchette = (emprise.maxZ - emprise.minZ + 2 * config.plaqueDeBase.marge) * config.grille.pas;
    this.conteneurModele.position.z = this.bordAvantPlanchette - profondeurPlanchette / 2;
    this.conteneurModele.add(this.plaque);
    this.conteneurModele.updateMatrixWorld(true);
    const boitePlaque = new Box3().setFromObject(this.plaque);
    const supportPlaque = {
      minX: boitePlaque.min.x,
      maxX: boitePlaque.max.x,
      minZ: boitePlaque.min.z,
      maxZ: boitePlaque.max.z,
      dessus: this.conteneurModele.position.y,
    };

    this.miniature = creerMiniature({ modele, places, emprise, config, texturesBois: this.texturesBois });
    this.miniature.position.copy(this.positionMiniature);
    this.scene.add(this.miniature);

    const briques = modele.briques.map((description) => new Brique(
      config.grille, config.brique, description, config.ombreContact, this.texturesBois, config.boisPeint,
    ));
    this.partie.demarrer(briques, places, [this.supportTable, supportPlaque], { presentation: true });
  }
}
