/**
 * @file Maquette « fantôme » : montre l'emplacement de la prochaine brique.
 *
 * Deux indices visuels, pour ne jamais reposer sur la seule couleur :
 *   - un volume translucide de la couleur de la brique ;
 *   - un contour net et clair autour de ce volume.
 * Aucun clignotement : l'affichage est fixe (il apparaît seulement en fondu).
 *
 * Le cadre est une aide qui peut être éteinte (voir `aideEmplacement.js`).
 * Indépendamment de lui, les cases de la première pièce sont colorées sur la
 * planchette, pour aider à bien démarrer.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { dimensionsPiece, obtenirGeometrie } from './formes.js';

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
 * Dessine le marquage des cases de départ : la couleur de la pièce, avec un
 * liseré clair (l'information ne repose pas sur la couleur seule).
 *
 * @param {number} couleur - Couleur de la pièce (hexadécimal Three.js).
 * @param {number} couleurLisere - Couleur du liseré (hexadécimal Three.js).
 * @param {number} proportions - Largeur / profondeur des cases.
 * @returns {THREE.CanvasTexture}
 */
function creerTextureMarque(couleur, couleurLisere, proportions) {
  const canevas = document.createElement('canvas');
  canevas.width = 256;
  canevas.height = Math.max(32, Math.round(256 / proportions));
  const contexte = canevas.getContext('2d');
  const enCss = (valeur) => `#${valeur.toString(16).padStart(6, '0')}`;
  const epaisseur = 14;
  contexte.fillStyle = enCss(couleur);
  contexte.globalAlpha = 0.85;
  contexte.fillRect(0, 0, canevas.width, canevas.height);
  contexte.globalAlpha = 1;
  contexte.strokeStyle = enCss(couleurLisere);
  contexte.lineWidth = epaisseur;
  contexte.strokeRect(epaisseur / 2, epaisseur / 2, canevas.width - epaisseur, canevas.height - epaisseur);
  const texture = new THREE.CanvasTexture(canevas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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
    this.materiauContour = new THREE.MeshBasicMaterial({
      color: reglages.couleurContour,
      toneMapped: false,
      transparent: true,
    });

    /** Groupe à ajouter à la scène (ou à la plaque du modèle). */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'maquette-fantome';
    this.objet3D.visible = false;
    /** `true` quand une pièce attend sa place (sinon rien à montrer). */
    this.aUneCible = false;
    /** Opacité relative imposée par l'aide (0 = éteinte, 1 = pleinement visible). */
    this.facteurOpacite = 0;

    /** Cases colorées de la première pièce, à ajouter au même parent que le cadre. */
    this.marqueDepart = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      }),
    );
    this.marqueDepart.rotation.x = -Math.PI / 2;
    this.marqueDepart.visible = false;
    this.marqueDepart.name = 'marque-depart';

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
    this.volume.geometry = obtenirGeometrie(this.grille, description);
    this.contour.geometry = this.#obtenirContour(description);
    this.materiauVolume.color.setHex(description.couleur);
    this.objet3D.position.set(position.x, position.y, position.z);
    this.aUneCible = true;
    this.#appliquerOpacite();
  }

  /** Cache l'emplacement (par exemple quand le modèle est terminé). */
  masquer() {
    this.aUneCible = false;
    this.#appliquerOpacite();
  }

  /**
   * Règle la visibilité du cadre selon l'aide (fondu d'apparition).
   *
   * @param {number} facteur - 0 = éteint, 1 = pleinement visible.
   */
  definirOpacite(facteur) {
    if (facteur !== this.facteurOpacite) {
      this.facteurOpacite = facteur;
      this.#appliquerOpacite();
    }
  }

  /**
   * Colore, sur la planchette, les cases où va la première pièce.
   *
   * @param {import('../modeles/chargeurModele.js').DescriptionBrique} description - Taille et couleur.
   * @param {{ x: number, y: number, z: number }} position - Centre de la pièce (repère du parent).
   */
  afficherMarqueDepart(description, position) {
    const largeur = description.largeur * this.grille.pas;
    const profondeur = description.profondeur * this.grille.pas;
    this.marqueDepart.scale.set(largeur, profondeur, 1);
    this.marqueDepart.material.map?.dispose();
    this.marqueDepart.material.map = creerTextureMarque(description.couleur, this.reglages.couleurContour, largeur / profondeur);
    this.marqueDepart.material.needsUpdate = true;
    // Posée sur le dessus de la planchette (y = 0 dans le repère du modèle).
    this.marqueDepart.position.set(position.x, 0.0008, position.z);
    this.marqueDepart.visible = true;
  }

  /** Retire le marquage des cases de départ. */
  masquerMarqueDepart() {
    this.marqueDepart.visible = false;
  }

  /** Applique l'opacité (cadre visible seulement s'il a une cible et que l'aide l'autorise). */
  #appliquerOpacite() {
    const facteur = this.aUneCible ? this.facteurOpacite : 0;
    this.objet3D.visible = facteur > 0;
    this.materiauVolume.opacity = this.reglages.opacite * facteur;
    this.materiauContour.opacity = facteur;
  }

  /**
   * Construit (ou réutilise) le contour d'une pièce : le cadre de la boîte
   * qui la contient (pour une forme arrondie, il montre son encombrement).
   *
   * @param {import('../modeles/chargeurModele.js').DescriptionBrique} description - Pièce visée.
   * @returns {THREE.BufferGeometry}
   */
  #obtenirContour(description) {
    const { largeur, hauteur, profondeur } = dimensionsPiece(this.grille, description);
    const cle = `${largeur}x${hauteur}x${profondeur}`;
    if (!this.cacheContours.has(cle)) {
      this.cacheContours.set(cle, creerGeometrieContour(
        largeur + this.grille.jeu,
        hauteur,
        profondeur + this.grille.jeu,
        this.reglages.epaisseurContour,
      ));
    }
    return this.cacheContours.get(cle);
  }
}
