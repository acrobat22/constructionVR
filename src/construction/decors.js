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

  /** Visage humain de face : sourcils, yeux, petit nez rond, joues roses, sourire. */
  'visage-humain': (contexte, largeur, hauteur) => {
    dessinerVisageHumain(contexte, largeur, hauteur, { couleurNez: '#eab08a', rayonNez: 0.045, largeurSourire: 0.16 });
  },

  /** Visage de clown : comme le visage humain, avec un gros nez corail et un grand sourire. */
  'visage-clown': (contexte, largeur, hauteur) => {
    dessinerVisageHumain(contexte, largeur, hauteur, { couleurNez: '#e8837a', rayonNez: 0.09, largeurSourire: 0.24 });
  },

  /** Visage de citrouille : yeux triangulaires et bouche dentelée, souriants. */
  citrouille: (contexte, largeur, hauteur) => {
    const taille = Math.min(largeur, hauteur);
    contexte.fillStyle = '#6e4b32';
    // Yeux : triangles pointe en haut.
    for (const cote of [-1, 1]) {
      const oeilX = largeur / 2 + cote * taille * 0.32;
      contexte.beginPath();
      contexte.moveTo(oeilX - taille * 0.12, hauteur * 0.45);
      contexte.lineTo(oeilX + taille * 0.12, hauteur * 0.45);
      contexte.lineTo(oeilX, hauteur * 0.45 - taille * 0.2);
      contexte.closePath();
      contexte.fill();
    }
    // Bouche souriante, en zigzag sur le haut.
    const gauche = largeur / 2 - taille * 0.5;
    const droite = largeur / 2 + taille * 0.5;
    const dents = 5;
    contexte.beginPath();
    contexte.moveTo(gauche, hauteur * 0.6);
    for (let dent = 0; dent < dents; dent++) {
      const x = gauche + (droite - gauche) * (dent + 0.5) / dents;
      contexte.lineTo(x, hauteur * 0.6 + taille * 0.07);
      contexte.lineTo(gauche + (droite - gauche) * (dent + 1) / dents, hauteur * 0.6);
    }
    contexte.quadraticCurveTo(largeur / 2, hauteur * 0.6 + taille * 0.45, gauche, hauteur * 0.6);
    contexte.fill();
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

  /** Porte en bois au sommet arrondi, avec sa poignée, centrée en bas de la face. */
  porte: (contexte, largeur, hauteur) => {
    const largeurPorte = Math.min(largeur * 0.36, hauteur * 0.5);
    const hauteurPorte = hauteur * 0.82;
    const gauche = (largeur - largeurPorte) / 2;
    const haut = hauteur - hauteurPorte;
    contexte.fillStyle = '#9a6b48';
    contexte.beginPath();
    contexte.moveTo(gauche, hauteur);
    contexte.lineTo(gauche, haut + largeurPorte / 2);
    contexte.arc(gauche + largeurPorte / 2, haut + largeurPorte / 2, largeurPorte / 2, Math.PI, 0);
    contexte.lineTo(gauche + largeurPorte, hauteur);
    contexte.closePath();
    contexte.fill();
    contexte.strokeStyle = '#6e4b32';
    contexte.lineWidth = largeurPorte * 0.06;
    contexte.stroke();
    contexte.fillStyle = '#f6d56f';
    contexte.beginPath();
    contexte.arc(gauche + largeurPorte * 0.78, haut + hauteurPorte * 0.6, largeurPorte * 0.06, 0, Math.PI * 2);
    contexte.fill();
  },

  /** Fenêtre à croisillons (quatre carreaux bleu ciel, cadre clair), centrée. */
  fenetre: (contexte, largeur, hauteur) => {
    const cote = Math.min(largeur * 0.4, hauteur * 0.62);
    const gauche = (largeur - cote) / 2;
    const haut = (hauteur - cote) / 2;
    contexte.fillStyle = '#a9d3f2';
    contexte.fillRect(gauche, haut, cote, cote);
    contexte.strokeStyle = '#fff8e8';
    contexte.lineWidth = cote * 0.1;
    contexte.strokeRect(gauche, haut, cote, cote);
    contexte.beginPath();
    contexte.moveTo(gauche + cote / 2, haut);
    contexte.lineTo(gauche + cote / 2, haut + cote);
    contexte.moveTo(gauche, haut + cote / 2);
    contexte.lineTo(gauche + cote, haut + cote / 2);
    contexte.stroke();
  },

  /** Rayures horizontales bleues (maillot de marin). */
  rayures: (contexte, largeur, hauteur) => {
    contexte.fillStyle = '#7fa6d8';
    const nombre = 4;
    const pas = hauteur / (nombre * 2);
    for (let indice = 0; indice < nombre; indice++) {
      contexte.fillRect(0, pas * (indice * 2 + 0.5), largeur, pas);
    }
  },

  /** Hélice à deux pales autour d'un moyeu. */
  helice: (contexte, largeur, hauteur) => {
    const taille = Math.min(largeur, hauteur);
    contexte.save();
    contexte.translate(largeur / 2, hauteur / 2);
    contexte.rotate(-0.5);
    contexte.fillStyle = '#c9a07a';
    for (const sens of [-1, 1]) {
      contexte.beginPath();
      contexte.ellipse(sens * taille * 0.24, 0, taille * 0.24, taille * 0.07, 0, 0, Math.PI * 2);
      contexte.fill();
    }
    contexte.fillStyle = '#6b6f7a';
    contexte.beginPath();
    contexte.arc(0, 0, taille * 0.08, 0, Math.PI * 2);
    contexte.fill();
    contexte.restore();
  },

  /** Pommes rouge pastel avec leur petite feuille, éparpillées dans le feuillage. */
  fruits: (contexte, largeur, hauteur) => {
    const taille = Math.min(largeur, hauteur);
    const pommes = [[0.16, 0.35], [0.42, 0.62], [0.68, 0.3], [0.86, 0.66], [0.3, 0.82], [0.58, 0.16]];
    for (const [u, v] of pommes) {
      contexte.fillStyle = '#e8837a';
      contexte.beginPath();
      contexte.arc(largeur * u, hauteur * v, taille * 0.09, 0, Math.PI * 2);
      contexte.fill();
      contexte.fillStyle = '#5f9a6a';
      contexte.beginPath();
      contexte.ellipse(largeur * u + taille * 0.05, hauteur * v - taille * 0.09, taille * 0.04, taille * 0.02, -0.6, 0, Math.PI * 2);
      contexte.fill();
    }
  },

  /** Rangée de hublots ronds cerclés (cabine de bateau). */
  hublots: (contexte, largeur, hauteur) => {
    const nombre = Math.max(2, Math.round(largeur / hauteur * 1.5));
    const rayon = Math.min(hauteur * 0.2, largeur / nombre * 0.28);
    for (let indice = 0; indice < nombre; indice++) {
      const x = largeur * (indice + 0.5) / nombre;
      contexte.fillStyle = '#a9d3f2';
      contexte.beginPath();
      contexte.arc(x, hauteur * 0.5, rayon, 0, Math.PI * 2);
      contexte.fill();
      contexte.lineWidth = rayon * 0.35;
      contexte.strokeStyle = '#6b6f7a';
      contexte.stroke();
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
 * Dessine un visage humain de face, centré sur la face (tête ronde).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte du canevas.
 * @param {number} largeur - Largeur du canevas, en pixels.
 * @param {number} hauteur - Hauteur du canevas, en pixels.
 * @param {{ couleurNez: string, rayonNez: number, largeurSourire: number }} reglages -
 *   Couleur et rayon du nez, demi-largeur du sourire (fractions de la plus petite dimension).
 */
function dessinerVisageHumain(contexte, largeur, hauteur, { couleurNez, rayonNez, largeurSourire }) {
  const taille = Math.min(largeur, hauteur);
  const centreX = largeur / 2;
  const centreY = hauteur / 2;

  // Joues roses, discrètes, sous les yeux.
  contexte.fillStyle = 'rgba(244, 140, 150, 0.45)';
  for (const cote of [-1, 1]) {
    contexte.beginPath();
    contexte.arc(centreX + cote * taille * 0.24, centreY + taille * 0.1, taille * 0.07, 0, Math.PI * 2);
    contexte.fill();
  }

  // Yeux ouverts et sourcils légèrement arqués.
  contexte.strokeStyle = ENCRE;
  contexte.lineCap = 'round';
  for (const cote of [-1, 1]) {
    const oeilX = centreX + cote * taille * 0.15;
    dessinerOeilOuvert(contexte, oeilX, centreY - taille * 0.08, taille * 0.065, false);
    contexte.lineWidth = taille * 0.022;
    contexte.beginPath();
    contexte.arc(oeilX, centreY - taille * 0.08, taille * 0.11, 1.2 * Math.PI, 1.8 * Math.PI);
    contexte.stroke();
  }

  // Nez rond.
  contexte.fillStyle = couleurNez;
  contexte.beginPath();
  contexte.arc(centreX, centreY + taille * 0.06, taille * rayonNez, 0, Math.PI * 2);
  contexte.fill();

  // Sourire.
  contexte.lineWidth = taille * 0.03;
  contexte.beginPath();
  contexte.arc(centreX, centreY + taille * 0.08, taille * largeurSourire, 0.2 * Math.PI, 0.8 * Math.PI);
  contexte.stroke();
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
