/**
 * @file Aspect visuel des briques (arêtes arrondies, tenons sur le dessus),
 * de leur halo de survol, et de la plaque de base.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Finesse des cylindres des tenons (nombre de facettes). */
const FACETTES_TENON = 20;

/**
 * Géométries déjà construites, partagées entre briques de même taille.
 * @type {Map<string, THREE.BufferGeometry>}
 */
const cacheGeometries = new Map();

/**
 * Construit (ou réutilise) la géométrie d'un pavé à tenons : corps arrondi
 * centré sur l'origine, tenons sur la face du dessus.
 *
 * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
 * @param {number} largeurTenons - Nombre de tenons en largeur (axe x).
 * @param {number} profondeurTenons - Nombre de tenons en profondeur (axe z).
 * @param {number} hauteur - Hauteur du corps, sans les tenons.
 * @returns {THREE.BufferGeometry}
 */
export function obtenirGeometrieAvecTenons(grille, largeurTenons, profondeurTenons, hauteur) {
  const cle = `${largeurTenons}x${profondeurTenons}x${hauteur}`;
  const geometrieConnue = cacheGeometries.get(cle);
  if (geometrieConnue) {
    return geometrieConnue;
  }

  const largeur = largeurTenons * grille.pas - grille.jeu;
  const profondeur = profondeurTenons * grille.pas - grille.jeu;
  const morceaux = [new RoundedBoxGeometry(largeur, hauteur, profondeur, 2, grille.rayonArrondi)];

  for (let colonne = 0; colonne < largeurTenons; colonne++) {
    for (let rangee = 0; rangee < profondeurTenons; rangee++) {
      const tenon = new THREE.CylinderGeometry(
        grille.rayonTenon,
        grille.rayonTenon,
        grille.hauteurTenon,
        FACETTES_TENON,
      );
      tenon.translate(
        (colonne + 0.5) * grille.pas - (largeurTenons * grille.pas) / 2,
        hauteur / 2 + grille.hauteurTenon / 2,
        (rangee + 0.5) * grille.pas - (profondeurTenons * grille.pas) / 2,
      );
      // `RoundedBoxGeometry` n'est pas indexée : la fusion exige le même format.
      morceaux.push(tenon.toNonIndexed());
      tenon.dispose();
    }
  }

  // Une seule géométrie = un seul appel de dessin par brique (meilleures performances).
  const geometrie = mergeGeometries(morceaux);
  morceaux.forEach((morceau) => morceau.dispose());
  cacheGeometries.set(cle, geometrie);
  return geometrie;
}

/**
 * Une brique saisissable : un pavé à tenons coloré, avec un halo doux au survol.
 */
export class Brique {
  /**
   * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
   * @param {typeof import('../config.js').CONFIG.brique} reglages - Aspect et halo.
   * @param {import('../modeles/chargeurModele.js').DescriptionBrique} description - Taille et couleur.
   */
  constructor(grille, reglages, description) {
    this.reglages = reglages;
    this.description = description;

    this.materiau = new THREE.MeshStandardMaterial({
      color: description.couleur,
      roughness: reglages.rugosite,
      metalness: 0,
      // Le halo est une lumière émise de la même couleur que la brique.
      emissive: description.couleur,
      emissiveIntensity: 0,
    });

    const geometrie = obtenirGeometrieAvecTenons(
      grille,
      description.largeur,
      description.profondeur,
      grille.hauteurCouche,
    );

    /** Objet Three.js à ajouter à la scène et à déplacer. */
    this.objet3D = new THREE.Mesh(geometrie, this.materiau);
    this.objet3D.castShadow = true;
    this.objet3D.receiveShadow = true;
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

/**
 * Crée la plaque de base à tenons sur laquelle on construit le modèle.
 * Son origine est au centre ; le dessus du corps (sans tenons) est à y = 0.
 *
 * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
 * @param {typeof import('../config.js').CONFIG.plaqueDeBase} reglages - Couleur, épaisseur, marge.
 * @param {number} largeurTenons - Largeur du modèle, en tenons (marge non comprise).
 * @param {number} profondeurTenons - Profondeur du modèle, en tenons (marge non comprise).
 * @returns {THREE.Mesh}
 */
export function creerPlaqueDeBase(grille, reglages, largeurTenons, profondeurTenons) {
  const geometrie = obtenirGeometrieAvecTenons(
    grille,
    largeurTenons + 2 * reglages.marge,
    profondeurTenons + 2 * reglages.marge,
    reglages.epaisseur,
  );
  const plaque = new THREE.Mesh(
    geometrie,
    new THREE.MeshStandardMaterial({ color: reglages.couleur, roughness: 0.45 }),
  );
  // Abaissée pour que le dessus du corps soit à y = 0 (les briques s'y posent).
  plaque.position.y = -reglages.epaisseur / 2;
  plaque.receiveShadow = true;
  plaque.castShadow = true;
  plaque.name = 'plaque-de-base';
  return plaque;
}
