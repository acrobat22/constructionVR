/**
 * @file Miniature du modèle terminé, affichée par le bouton « œil » pour
 * savoir ce que l'on construit.
 *
 * Elle réutilise les mêmes briques et la même plaque que la construction,
 * à échelle réduite, posée sur la table. Elle ne bouge pas (pas d'animation).
 */

import { Group } from 'three';

import { Brique, creerPlaqueDeBase } from './brique.js';

/**
 * Crée la miniature d'un modèle.
 *
 * @param {object} parametres
 * @param {import('../modeles/chargeurModele.js').Modele} parametres.modele - Modèle validé.
 * @param {{ x: number, y: number, z: number }[]} parametres.places - Centres des briques (repère du modèle).
 * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} parametres.emprise - Emprise en tenons.
 * @param {typeof import('../config.js').CONFIG} parametres.config - Configuration globale.
 * @returns {Group} Groupe à poser sur la table (origine = dessous de la plaque).
 */
export function creerMiniature({ modele, places, emprise, config }) {
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
  ));
  modele.briques.forEach((description, indice) => {
    const brique = new Brique(config.grille, config.brique, description, config.ombreContact);
    brique.objet3D.position.set(places[indice].x, places[indice].y, places[indice].z);
    contenu.add(brique.objet3D);
  });

  return miniature;
}
