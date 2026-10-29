/**
 * @file Aspect visuel des pièces en bois peint (pavés, pentes, quarts de rond,
 * cylindres, pointes, avec ou sans décor), de leur halo de survol, et de la
 * planchette de base gravée.
 */

import * as THREE from 'three';

import { creerMateriauBoisPeint } from './boisPeint.js';
import { creerDecor } from './decors.js';
import { dimensionsPiece, obtenirGeometrie, obtenirGeometrieBloc } from './formes.js';
import { creerOmbreContact } from './ombreContact.js';

/** Pixels par case dans la texture du quadrillage gravé. */
const PIXELS_PAR_CASE = 32;

/**
 * Une pièce de bois peint saisissable, avec un halo doux au survol.
 */
export class Brique {
  /**
   * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
   * @param {typeof import('../config.js').CONFIG.brique} reglages - Halo de survol.
   * @param {import('../modeles/chargeurModele.js').DescriptionBrique} description - Taille et couleur.
   * @param {typeof import('../config.js').CONFIG.ombreContact} reglagesOmbre - Ombre au pied du bloc.
   * @param {import('./boisPeint.js').TexturesBois | null} texturesBois - Grain du bois (ou `null` : couleur unie).
   * @param {typeof import('../config.js').CONFIG.boisPeint} reglagesBois - Motif, relief et rugosité du bois.
   */
  constructor(grille, reglages, description, reglagesOmbre, texturesBois, reglagesBois) {
    this.reglages = reglages;
    this.description = description;

    const dimensions = dimensionsPiece(grille, description);
    /** Hauteur réelle de la pièce, en mètres. */
    this.hauteur = dimensions.hauteur;
    this.materiau = creerMateriauBoisPeint(
      texturesBois,
      description.couleur,
      reglagesBois,
      Math.max(dimensions.largeur, dimensions.profondeur, dimensions.hauteur),
    );

    /** Objet Three.js à ajouter à la scène et à déplacer. */
    this.objet3D = new THREE.Mesh(obtenirGeometrie(grille, description), this.materiau);
    this.objet3D.castShadow = true;
    this.objet3D.receiveShadow = true;
    this.objet3D.name = 'brique';

    if (description.decor) {
      this.objet3D.add(creerDecor(description.decor, dimensions));
    }

    // Ombre de contact sous la pièce, visible seulement quand elle est posée.
    this.ombreContact = creerOmbreContact(dimensions.largeur, dimensions.profondeur, reglagesOmbre);
    this.ombreContact.position.y = -dimensions.hauteur / 2 + 0.0005;
    this.objet3D.add(this.ombreContact);
  }

  /**
   * Affiche l'ombre de contact seulement quand le bloc repose sur une surface
   * (pas quand il est tenu ou en mouvement).
   *
   * @param {boolean} estAuRepos - `true` si le bloc est posé.
   */
  definirAuRepos(estAuRepos) {
    this.ombreContact.visible = estAuRepos;
  }

  /**
   * Allume ou éteint le halo doux (changement immédiat, sans clignotement).
   *
   * @param {boolean} estSurvolee - `true` si une main est assez proche pour le saisir.
   */
  definirSurvol(estSurvolee) {
    this.materiau.emissiveIntensity = estSurvolee ? this.reglages.intensiteHalo : 0;
  }
}

/**
 * Crée la texture du quadrillage gravé : traits fins entre les cases,
 * fond transparent.
 *
 * @param {number} largeurCases - Nombre de cases en largeur.
 * @param {number} profondeurCases - Nombre de cases en profondeur.
 * @param {string} couleurTraits - Couleur CSS des traits (avec transparence).
 * @returns {THREE.CanvasTexture}
 */
function creerTextureQuadrillage(largeurCases, profondeurCases, couleurTraits) {
  const canevas = document.createElement('canvas');
  canevas.width = largeurCases * PIXELS_PAR_CASE;
  canevas.height = profondeurCases * PIXELS_PAR_CASE;
  const contexte = canevas.getContext('2d');
  contexte.strokeStyle = couleurTraits;
  contexte.lineWidth = 2;
  contexte.beginPath();
  // Traits intérieurs seulement : le bord de la planchette fait déjà cadre.
  for (let colonne = 1; colonne < largeurCases; colonne++) {
    contexte.moveTo(colonne * PIXELS_PAR_CASE, 0);
    contexte.lineTo(colonne * PIXELS_PAR_CASE, canevas.height);
  }
  for (let rangee = 1; rangee < profondeurCases; rangee++) {
    contexte.moveTo(0, rangee * PIXELS_PAR_CASE);
    contexte.lineTo(canevas.width, rangee * PIXELS_PAR_CASE);
  }
  contexte.stroke();

  const texture = new THREE.CanvasTexture(canevas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Crée la planchette de base en bois naturel, au quadrillage gravé, sur
 * laquelle on construit le modèle. Son origine est au centre ; son dessus
 * est à y = 0.
 *
 * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
 * @param {typeof import('../config.js').CONFIG.plaqueDeBase} reglages - Couleur, épaisseur, marge, gravure.
 * @param {number} largeurCases - Largeur du modèle, en cases (marge non comprise).
 * @param {number} profondeurCases - Profondeur du modèle, en cases (marge non comprise).
 * @param {typeof import('../config.js').CONFIG.ombreContact} reglagesOmbre - Ombre au pied de la planchette.
 * @param {import('./boisPeint.js').TexturesBois | null} texturesBois - Grain du bois (ou `null`).
 * @param {typeof import('../config.js').CONFIG.boisPeint} reglagesBois - Motif, relief et rugosité du bois.
 * @returns {THREE.Mesh}
 */
export function creerPlaqueDeBase(grille, reglages, largeurCases, profondeurCases, reglagesOmbre, texturesBois, reglagesBois) {
  const largeurTotale = largeurCases + 2 * reglages.marge;
  const profondeurTotale = profondeurCases + 2 * reglages.marge;
  const largeur = largeurTotale * grille.pas;
  const profondeur = profondeurTotale * grille.pas;

  const plaque = new THREE.Mesh(
    obtenirGeometrieBloc(grille, largeurTotale, profondeurTotale, reglages.epaisseur),
    creerMateriauBoisPeint(texturesBois, reglages.couleur, reglagesBois, Math.max(largeur, profondeur)),
  );
  // Abaissée pour que son dessus soit à y = 0 (les blocs s'y posent).
  plaque.position.y = -reglages.epaisseur / 2;
  plaque.receiveShadow = true;
  plaque.castShadow = true;
  plaque.name = 'plaque-de-base';

  // Quadrillage gravé, juste au-dessus du plateau : repère des cases.
  const quadrillage = new THREE.Mesh(
    new THREE.PlaneGeometry(largeur - grille.jeu, profondeur - grille.jeu),
    new THREE.MeshBasicMaterial({
      map: creerTextureQuadrillage(largeurTotale, profondeurTotale, reglages.couleurGravure),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  quadrillage.rotation.x = -Math.PI / 2;
  quadrillage.position.y = reglages.epaisseur / 2 + 0.0003;
  quadrillage.name = 'quadrillage';
  plaque.add(quadrillage);

  const ombre = creerOmbreContact(largeur, profondeur, reglagesOmbre);
  ombre.position.y = -reglages.epaisseur / 2 + 0.0005;
  plaque.add(ombre);
  return plaque;
}
