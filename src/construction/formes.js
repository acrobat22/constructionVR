/**
 * @file Géométrie des pièces selon leur forme : pavé, pente, quart de rond,
 * cylindre (debout ou couché) et pointe.
 *
 * Chaque géométrie est centrée sur l'origine et tient dans une boîte
 * largeur × hauteur × profondeur. Les géométries identiques sont partagées
 * (une seule copie en mémoire par combinaison de forme et de dimensions).
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Finesse de l'arrondi des arêtes des pavés (nombre de segments). */
const SEGMENTS_ARRONDI = 3;

/** Finesse des cylindres et des pointes (nombre de facettes). */
const FACETTES_ROND = 40;

/** Finesse des courbes des quarts de rond. */
const SEGMENTS_COURBE = 24;

/** Biseau des formes extrudées (arêtes adoucies, comme le bois poncé). */
const BISEAU = 0.002;

/** Hauteur de la lèvre au bas d'une pente (fraction de sa hauteur). */
const LEVRE_PENTE = 0.25;

/**
 * Géométries déjà construites, partagées entre pièces identiques.
 * @type {Map<string, THREE.BufferGeometry>}
 */
const cacheGeometries = new Map();

/**
 * Construit (ou réutilise) la géométrie d'un pavé aux arêtes adoucies.
 *
 * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
 * @param {number} largeurCases - Nombre de cases en largeur (axe x).
 * @param {number} profondeurCases - Nombre de cases en profondeur (axe z).
 * @param {number} hauteur - Hauteur en mètres.
 * @returns {THREE.BufferGeometry}
 */
export function obtenirGeometrieBloc(grille, largeurCases, profondeurCases, hauteur) {
  const cle = `pave|${largeurCases}|${profondeurCases}|${hauteur}`;
  if (!cacheGeometries.has(cle)) {
    const largeur = largeurCases * grille.pas - grille.jeu;
    const profondeur = profondeurCases * grille.pas - grille.jeu;
    const rayon = Math.min(grille.rayonArrondi, hauteur / 3, largeur / 3, profondeur / 3);
    cacheGeometries.set(cle, new RoundedBoxGeometry(largeur, hauteur, profondeur, SEGMENTS_ARRONDI, rayon));
  }
  return cacheGeometries.get(cle);
}

/**
 * Dimensions réelles d'une pièce, en mètres.
 *
 * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
 * @param {import('../modeles/chargeurModele.js').DescriptionBrique} description - Pièce.
 * @returns {{ largeur: number, hauteur: number, profondeur: number }}
 */
export function dimensionsPiece(grille, description) {
  return {
    largeur: description.largeur * grille.pas - grille.jeu,
    hauteur: description.hauteur * grille.hauteurCouche,
    profondeur: description.profondeur * grille.pas - grille.jeu,
  };
}

/**
 * Construit (ou réutilise) la géométrie d'une pièce selon sa forme.
 *
 * @param {typeof import('../config.js').CONFIG.grille} grille - Dimensions de la grille.
 * @param {import('../modeles/chargeurModele.js').DescriptionBrique} description - Pièce.
 * @returns {THREE.BufferGeometry}
 */
export function obtenirGeometrie(grille, description) {
  const { forme, largeur, profondeur, sens, axe } = description;
  const hauteur = description.hauteur * grille.hauteurCouche;
  if (forme === 'pave') {
    return obtenirGeometrieBloc(grille, largeur, profondeur, hauteur);
  }

  const cle = `${forme}|${largeur}|${profondeur}|${hauteur}|${sens}|${axe}`;
  if (!cacheGeometries.has(cle)) {
    const dimensions = dimensionsPiece(grille, description);
    cacheGeometries.set(cle, construireForme(forme, dimensions, sens, axe));
  }
  return cacheGeometries.get(cle);
}

/**
 * Construit la géométrie d'une forme non pavée.
 *
 * @param {string} forme - « pente », « quartRond », « cylindre » ou « pointe ».
 * @param {{ largeur: number, hauteur: number, profondeur: number }} dimensions - En mètres.
 * @param {string | null} sens - Direction de la descente (pente, quart de rond).
 * @param {string | null} axe - Axe d'un cylindre couché.
 * @returns {THREE.BufferGeometry}
 */
function construireForme(forme, { largeur, hauteur, profondeur }, sens, axe) {
  if (forme === 'cylindre') {
    const geometrie = new THREE.CylinderGeometry(0.5, 0.5, 1, FACETTES_ROND);
    if (axe === 'z') {
      geometrie.rotateX(Math.PI / 2);
    } else if (axe === 'x') {
      geometrie.rotateZ(Math.PI / 2);
    }
    return geometrie.scale(largeur, hauteur, profondeur);
  }
  if (forme === 'pointe') {
    return new THREE.ConeGeometry(0.5, 1, FACETTES_ROND).scale(largeur, hauteur, profondeur);
  }

  // Pente et quart de rond : profil dessiné « descendant vers +x », extrudé
  // sur la profondeur, puis tourné selon le sens demandé.
  const estSelonZ = sens === 'z+' || sens === 'z-';
  const longueur = estSelonZ ? profondeur : largeur;
  const epaisseur = estSelonZ ? largeur : profondeur;
  const profil = forme === 'pente'
    ? profilPente(longueur, hauteur)
    : profilQuartRond(longueur, hauteur);
  const geometrie = extruderProfil(profil, longueur, hauteur, epaisseur);
  return orienter(geometrie, sens);
}

/**
 * Profil d'une pente : pleine hauteur à l'arrière, petite lèvre à l'avant.
 *
 * @param {number} longueur - Longueur dans le sens de la descente.
 * @param {number} hauteur - Hauteur maximale.
 * @returns {THREE.Vector2[]}
 */
function profilPente(longueur, hauteur) {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(longueur, 0),
    new THREE.Vector2(longueur, hauteur * LEVRE_PENTE),
    new THREE.Vector2(0, hauteur),
  ];
}

/**
 * Profil d'un quart de rond : quart d'ellipse, pleine hauteur à l'arrière.
 *
 * @param {number} longueur - Longueur dans le sens de la descente.
 * @param {number} hauteur - Hauteur maximale.
 * @returns {THREE.Vector2[]}
 */
function profilQuartRond(longueur, hauteur) {
  const points = [new THREE.Vector2(0, 0)];
  for (let indice = 0; indice <= SEGMENTS_COURBE; indice++) {
    const angle = (indice / SEGMENTS_COURBE) * (Math.PI / 2);
    points.push(new THREE.Vector2(longueur * Math.cos(angle), hauteur * Math.sin(angle)));
  }
  return points;
}

/**
 * Extrude un profil sur une épaisseur, avec un léger biseau, et centre le
 * résultat. Le profil est réduit de la taille du biseau pour que la pièce
 * finie garde exactement ses dimensions.
 *
 * @param {THREE.Vector2[]} profil - Contour dans le plan (x, y).
 * @param {number} longueur - Étendue du profil en x.
 * @param {number} hauteur - Étendue du profil en y.
 * @param {number} epaisseur - Épaisseur de l'extrusion (axe z).
 * @returns {THREE.BufferGeometry}
 */
function extruderProfil(profil, longueur, hauteur, epaisseur) {
  const echelleX = (longueur - 2 * BISEAU) / longueur;
  const echelleY = (hauteur - 2 * BISEAU) / hauteur;
  const contour = new THREE.Shape(profil.map((point) => new THREE.Vector2(
    BISEAU + point.x * echelleX,
    BISEAU + point.y * echelleY,
  )));
  const geometrie = new THREE.ExtrudeGeometry(contour, {
    depth: epaisseur - 2 * BISEAU,
    bevelEnabled: true,
    bevelThickness: BISEAU,
    bevelSize: BISEAU,
    bevelSegments: 2,
    curveSegments: SEGMENTS_COURBE,
  });
  geometrie.translate(-longueur / 2, -hauteur / 2, -(epaisseur - 2 * BISEAU) / 2);

  // Les coordonnées de texture d'une extrusion sont en mètres : on les ramène
  // vers 0–1, comme pour les pavés, pour que le grain du bois ait la même taille.
  const coordonnees = geometrie.getAttribute('uv');
  const plusGrandeDimension = Math.max(longueur, hauteur, epaisseur);
  for (let indice = 0; indice < coordonnees.count; indice++) {
    coordonnees.setXY(
      indice,
      coordonnees.getX(indice) / plusGrandeDimension,
      coordonnees.getY(indice) / plusGrandeDimension,
    );
  }
  geometrie.computeVertexNormals();
  return geometrie;
}

/**
 * Tourne une géométrie construite « descendant vers +x » vers le sens voulu.
 *
 * @param {THREE.BufferGeometry} geometrie - Géométrie à orienter.
 * @param {string} sens - « x+ », « x- », « z+ » ou « z- ».
 * @returns {THREE.BufferGeometry}
 */
function orienter(geometrie, sens) {
  const angles = { 'x+': 0, 'x-': Math.PI, 'z+': -Math.PI / 2, 'z-': Math.PI / 2 };
  return geometrie.rotateY(angles[sens]);
}
