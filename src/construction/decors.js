/**
 * @file Décors peints sur une face d'une pièce : yeux, visages, taches,
 * écailles. Dessinés au canevas par le jeu (aucune image externe).
 *
 * Les motifs sont dessinés pour des animaux tournés vers la droite (+x) :
 * l'œil est placé du côté droit de la face.
 */

import * as THREE from 'three';

/** Couleur de « l'encre » des motifs (yeux, traits). */
const ENCRE = '#2b2b3a';

/** Résolution horizontale des textures de décor. */
const LARGEUR_TEXTURE = 512;

/** Décalage du décor au-dessus de la face (évite le scintillement). */
const DECALAGE = 0.0015;

/**
 * Textures déjà dessinées, par motif et proportions.
 * @type {Map<string, THREE.CanvasTexture>}
 */
const cacheTextures = new Map();

/**
 * Dessinateurs de motifs : reçoivent le contexte et la taille du canevas.
 * @type {Record<string, (contexte: CanvasRenderingContext2D, largeur: number, hauteur: number) => void>}
 */
const DESSINATEURS = {
  /** Œil fermé et souriant (arc). */
  'oeil-sourire': (contexte, largeur, hauteur) => {
    contexte.lineWidth = Math.min(largeur, hauteur) * 0.07;
    contexte.beginPath();
    contexte.arc(largeur * 0.72, hauteur * 0.4, Math.min(largeur, hauteur) * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
    contexte.stroke();
  },

  /** Œil rond ouvert, avec un reflet. */
  'oeil-rond': (contexte, largeur, hauteur) => {
    dessinerOeilOuvert(contexte, largeur * 0.68, hauteur * 0.42, Math.min(largeur, hauteur) * 0.2);
  },

  /** Œil rond et sourire, vus de profil. */
  profil: (contexte, largeur, hauteur) => {
    const taille = Math.min(largeur, hauteur);
    dessinerOeilOuvert(contexte, largeur * 0.55, hauteur * 0.36, taille * 0.17);
    contexte.lineWidth = taille * 0.06;
    contexte.beginPath();
    contexte.arc(largeur * 0.8, hauteur * 0.55, taille * 0.18, 0.2 * Math.PI, 0.75 * Math.PI);
    contexte.stroke();
  },

  /** Visage de face : deux yeux, nez rose, sourire et moustaches. */
  visage: (contexte, largeur, hauteur) => {
    const taille = Math.min(largeur, hauteur);
    for (const decalageX of [-0.15, 0.15]) {
      dessinerOeilOuvert(contexte, largeur * (0.5 + decalageX), hauteur * 0.38, taille * 0.08, false);
    }
    contexte.fillStyle = '#f4a3b5';
    contexte.beginPath();
    contexte.moveTo(largeur * 0.44, hauteur * 0.54);
    contexte.lineTo(largeur * 0.56, hauteur * 0.54);
    contexte.lineTo(largeur * 0.5, hauteur * 0.63);
    contexte.closePath();
    contexte.fill();
    contexte.lineWidth = taille * 0.025;
    for (const centreX of [0.45, 0.55]) {
      contexte.beginPath();
      contexte.arc(largeur * centreX, hauteur * 0.65, taille * 0.05, 0.1 * Math.PI, 0.9 * Math.PI);
      contexte.stroke();
    }
    // Moustaches : trois traits de chaque côté.
    contexte.lineWidth = taille * 0.012;
    for (const cote of [-1, 1]) {
      for (const pente of [-0.04, 0, 0.04]) {
        contexte.beginPath();
        contexte.moveTo(largeur * (0.5 + cote * 0.12), hauteur * 0.6);
        contexte.lineTo(largeur * (0.5 + cote * 0.32), hauteur * (0.6 + pente * 1.5));
        contexte.stroke();
      }
    }
  },

  /** Taches de girafe, irrégulières. */
  taches: (contexte, largeur, hauteur) => {
    contexte.fillStyle = 'rgba(190, 110, 50, 0.8)';
    const taches = [[0.2, 0.3, 0.1], [0.5, 0.62, 0.12], [0.8, 0.35, 0.09], [0.33, 0.78, 0.07], [0.74, 0.8, 0.08]];
    for (const [u, v, rayon] of taches) {
      contexte.beginPath();
      contexte.ellipse(largeur * u, hauteur * v, largeur * rayon, Math.min(hauteur * 0.2, largeur * rayon * 0.8), u * 3, 0, Math.PI * 2);
      contexte.fill();
    }
  },

  /** Écailles en demi-cercles, sur trois rangées décalées. */
  ecailles: (contexte, largeur, hauteur) => {
    contexte.strokeStyle = 'rgba(40, 110, 70, 0.6)';
    contexte.lineWidth = largeur * 0.012;
    const colonnes = Math.max(3, Math.round(largeur / hauteur * 3));
    const pas = 1 / colonnes;
    for (let rangee = 0; rangee < 3; rangee++) {
      for (let colonne = 0; colonne < colonnes; colonne++) {
        contexte.beginPath();
        contexte.arc(
          largeur * (pas / 2 + colonne * pas + (rangee % 2) * pas / 2),
          hauteur * (0.28 + rangee * 0.25),
          largeur * pas * 0.45,
          0,
          Math.PI,
        );
        contexte.stroke();
      }
    }
  },
};

/**
 * Dessine un œil ouvert : rond foncé avec un petit reflet blanc, sur un fond
 * blanc facultatif (le blanc de l'œil).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {number} centreX - Centre horizontal.
 * @param {number} centreY - Centre vertical.
 * @param {number} rayon - Rayon de l'œil.
 * @param {boolean} [avecBlanc=true] - Dessiner le blanc de l'œil autour de la pupille.
 */
function dessinerOeilOuvert(contexte, centreX, centreY, rayon, avecBlanc = true) {
  if (avecBlanc) {
    contexte.fillStyle = '#ffffff';
    contexte.beginPath();
    contexte.arc(centreX, centreY, rayon, 0, Math.PI * 2);
    contexte.fill();
  }
  const rayonPupille = avecBlanc ? rayon * 0.55 : rayon;
  contexte.fillStyle = ENCRE;
  contexte.beginPath();
  contexte.arc(centreX + rayon * 0.12, centreY + rayon * 0.08, rayonPupille, 0, Math.PI * 2);
  contexte.fill();
  contexte.fillStyle = '#ffffff';
  contexte.beginPath();
  contexte.arc(centreX + rayon * 0.28, centreY - rayon * 0.12, rayonPupille * 0.32, 0, Math.PI * 2);
  contexte.fill();
}

/**
 * Retourne (en la dessinant si besoin) la texture d'un motif.
 *
 * @param {string} motif - Nom du motif.
 * @param {number} proportions - Largeur / hauteur de la face.
 * @returns {THREE.CanvasTexture}
 */
function obtenirTexture(motif, proportions) {
  const proportionsArrondies = Math.round(proportions * 10) / 10;
  const cle = `${motif}|${proportionsArrondies}`;
  if (!cacheTextures.has(cle)) {
    const canevas = document.createElement('canvas');
    canevas.width = LARGEUR_TEXTURE;
    canevas.height = Math.max(64, Math.round(LARGEUR_TEXTURE / proportionsArrondies));
    const contexte = canevas.getContext('2d');
    contexte.lineCap = 'round';
    contexte.strokeStyle = ENCRE;
    contexte.fillStyle = ENCRE;
    DESSINATEURS[motif](contexte, canevas.width, canevas.height);
    const texture = new THREE.CanvasTexture(canevas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    cacheTextures.set(cle, texture);
  }
  return cacheTextures.get(cle);
}

/**
 * Crée le décor peint d'une pièce, à ajouter comme enfant de son objet 3D.
 *
 * @param {{ face: string, motif: string }} decor - Face et motif.
 * @param {{ largeur: number, hauteur: number, profondeur: number }} dimensions - Pièce, en mètres.
 * @returns {THREE.Mesh}
 */
export function creerDecor(decor, { largeur, hauteur, profondeur }) {
  // Taille du décor et placement selon la face (« y+ » = dessus).
  const placements = {
    'z+': { taille: [largeur, hauteur], position: [0, 0, profondeur / 2 + DECALAGE], rotation: [0, 0, 0] },
    'z-': { taille: [largeur, hauteur], position: [0, 0, -profondeur / 2 - DECALAGE], rotation: [0, Math.PI, 0] },
    'x+': { taille: [profondeur, hauteur], position: [largeur / 2 + DECALAGE, 0, 0], rotation: [0, Math.PI / 2, 0] },
    'x-': { taille: [profondeur, hauteur], position: [-largeur / 2 - DECALAGE, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    'y+': { taille: [largeur, profondeur], position: [0, hauteur / 2 + DECALAGE, 0], rotation: [-Math.PI / 2, 0, 0] },
  };
  const { taille: [largeurDecor, hauteurDecor], position, rotation } = placements[decor.face];

  const maillage = new THREE.Mesh(
    new THREE.PlaneGeometry(largeurDecor * 0.94, hauteurDecor * 0.94),
    new THREE.MeshStandardMaterial({
      map: obtenirTexture(decor.motif, largeurDecor / hauteurDecor),
      transparent: true,
      depthWrite: false,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  maillage.position.set(...position);
  maillage.rotation.set(...rotation);
  maillage.name = 'decor';
  return maillage;
}
