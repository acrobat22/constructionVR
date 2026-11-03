/**
 * @file Miniature du modèle terminé, affichée par le bouton « œil » pour
 * savoir ce que l'on construit.
 *
 * Elle réutilise les mêmes briques et la même plaque que la construction,
 * à échelle réduite, posée sur la table. Elle ne bouge que par quarts de tour
 * (bouton « Tourner », voir rotationDouce.js).
 */

import { Group } from 'three';

import { Brique, creerPlaqueDeBase } from './brique.js';

/**
 * Crée la miniature d'un modèle.
 *
 * @param {object} parametres
 * @param {import('../modeles/chargeurModele.js').Modele} parametres.modele - Modèle validé.
 * @param {{ x: number, y: number, z: number }[]} parametres.places - Centres des briques (repère du modèle).
 * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} parametres.emprise - Emprise en cases.
 * @param {typeof import('../config.js').CONFIG} parametres.config - Configuration globale.
 * @param {import('./boisPeint.js').TexturesBois | null} parametres.texturesBois - Grain du bois (ou `null`).
 * @returns {Group} Groupe à poser sur la table (origine = dessous de la plaque).
 */
export function creerMiniature({ modele, places, emprise, config, texturesBois }) {
  const miniature = new Group();
  miniature.name = 'miniature';
  miniature.scale.setScalar(config.miniature.echelle);
  miniature.rotation.y = config.miniature.rotation;
  miniature.visible = config.miniature.visibleAuDemarrage;

  // Contenu décalé pour que le dessous de la plaque soit à y = 0.
  const contenu = new Group();
  contenu.position.y = config.plaqueDeBase.epaisseur;
  miniature.add(contenu);

  contenu.add(creerPlaqueDeBase(
    config.grille,
    config.plaqueDeBase,
    emprise.maxX - emprise.minX,
    emprise.maxZ - emprise.minZ,
    config.ombreContact,
    texturesBois,
    config.boisPeint,
  ));
  modele.briques.forEach((description, indice) => {
    const brique = new Brique(config.grille, config.brique, description, config.ombreContact, texturesBois, config.boisPeint);
    brique.objet3D.position.set(places[indice].x, places[indice].y, places[indice].z);
    contenu.add(brique.objet3D);
  });

  return miniature;
}
