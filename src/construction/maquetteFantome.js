/**
 * @file Maquette « fantôme » : montre l'emplacement de la prochaine brique.
 *
 * Deux indices visuels, pour ne jamais reposer sur la seule couleur :
 *   - un volume translucide de la couleur de la brique ;
 *   - un contour net et clair autour de ce volume.
 * Aucun clignotement : l'affichage est fixe.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { obtenirGeometrieAvecTenons } from './brique.js';

/**
 * Construit un contour fait de 12 fines baguettes le long des arêtes d'un pavé.
 * (Les lignes WebGL font toujours 1 pixel de large : trop fines en VR.)
 *
 * @param {number} largeur - Dimension en x.
 * @param {number} hauteur - Dimension en y.
 * @param {number} profondeur - Dimension en z.
 * @param {number} epaisseur - Épaisseur des baguettes.
 * @returns {THREE.BufferGeometry}
 */
function creerGeometrieContour(largeur, hauteur, profondeur, epaisseur) {
  const demi = { x: largeur / 2, y: hauteur / 2, z: profondeur / 2 };
  const baguettes = [];

  for (const signeA of [-1, 1]) {
    for (const signeB of [-1, 1]) {
      // Arêtes parallèles à x, à y, puis à z.
      baguettes.push(new THREE.BoxGeometry(largeur + epaisseur, epaisseur, epaisseur)
        .translate(0, signeA * demi.y, signeB * demi.z));
      baguettes.push(new THREE.BoxGeometry(epaisseur, hauteur + epaisseur, epaisseur)
        .translate(signeA * demi.x, 0, signeB * demi.z));
      baguettes.push(new THREE.BoxGeometry(epaisseur, epaisseur, profondeur + epaisseur)
        .translate(signeA * demi.x, signeB * demi.y, 0));
    }
  }

  const geometrie = mergeGeometries(baguettes);
  baguettes.forEach((baguette) => baguette.dispose());
  return geometrie;
}

/**
 * Affiche l'emplacement visé par la brique en cours.
 */
export class MaquetteFantome {
  /**
   * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
   * @param {typeof import('../config.js').CONFIG.fantome} reglages - Opacité et contour.
   */
  constructor(grille, reglages) {
    this.grille = grille;
    this.reglages = reglages;

    this.materiauVolume = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: reglages.opacite,
      // Évite que le volume translucide masque ce qui est derrière lui.
      depthWrite: false,
    });
    // Contour non éclairé : il garde sa couleur franche quel que soit l'éclairage.
    this.materiauContour = new THREE.MeshBasicMaterial({ color: reglages.couleurContour, toneMapped: false });

    /** Groupe à ajouter à la scène (ou à la plaque du modèle). */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'maquette-fantome';
    this.objet3D.visible = false;

    this.volume = new THREE.Mesh(undefined, this.materiauVolume);
    this.contour = new THREE.Mesh(undefined, this.materiauContour);
    this.objet3D.add(this.volume, this.contour);

    /** @type {Map<string, THREE.BufferGeometry>} Contours déjà construits, par taille. */
    this.cacheContours = new Map();
  }

  /**
   * Montre l'emplacement d'une brique.
   *
   * @param {import('../modeles/chargeurModele.js').DescriptionBrique} description - Taille et couleur.
   * @param {{ x: number, y: number, z: number }} position - Centre de l'emplacement (repère du parent).
   */
  afficher(description, position) {
    this.volume.geometry = obtenirGeometrieAvecTenons(
      this.grille,
      description.largeur,
      description.profondeur,
      this.grille.hauteurCouche,
    );
    this.contour.geometry = this.#obtenirContour(description.largeur, description.profondeur);
    this.materiauVolume.color.setHex(description.couleur);
    this.objet3D.position.set(position.x, position.y, position.z);
    this.objet3D.visible = true;
  }

  /** Cache l'emplacement (par exemple quand le modèle est terminé). */
  masquer() {
    this.objet3D.visible = false;
  }

  /**
   * Construit (ou réutilise) le contour d'une brique de taille donnée.
   *
   * @param {number} largeurTenons - Largeur en tenons.
   * @param {number} profondeurTenons - Profondeur en tenons.
   * @returns {THREE.BufferGeometry}
   */
  #obtenirContour(largeurTenons, profondeurTenons) {
    const cle = `${largeurTenons}x${profondeurTenons}`;
    if (!this.cacheContours.has(cle)) {
      this.cacheContours.set(cle, creerGeometrieContour(
        largeurTenons * this.grille.pas,
        this.grille.hauteurCouche,
        profondeurTenons * this.grille.pas,
        this.reglages.epaisseurContour,
      ));
    }
    return this.cacheContours.get(cle);
  }
}
