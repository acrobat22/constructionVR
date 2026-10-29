/**
 * @file Matériau « bois peint » : une couleur pastel posée sur un bois dont
 * les nervures restent bien visibles.
 *
 * Principe : l'image du bois (Poly Haven, CC0) est convertie une seule fois en
 * niveaux de gris très contrastés. Cette texture multiplie la couleur de la
 * peinture : les veines claires gardent la couleur pastel, les veines sombres
 * l'assombrissent. La texture de relief rend les veines en volume.
 */

import * as THREE from 'three';

import { etirerNiveaux } from './niveauxGrain.js';

/**
 * Crée la texture de grain (niveaux de gris contrastés) à partir de l'image du bois.
 *
 * @param {HTMLImageElement | ImageBitmap} image - Image du bois.
 * @param {number} plancher - Valeur la plus sombre des nervures (0 à 1).
 * @returns {THREE.CanvasTexture}
 */
function creerTextureGrain(image, plancher) {
  const canevas = document.createElement('canvas');
  canevas.width = image.width;
  canevas.height = image.height;
  const contexte = canevas.getContext('2d', { willReadFrequently: true });
  contexte.drawImage(image, 0, 0);
  const pixels = contexte.getImageData(0, 0, canevas.width, canevas.height);
  const donnees = pixels.data;

  // Luminance perçue (pondération Rec. 709).
  const luminances = new Float32Array(donnees.length / 4);
  for (let indice = 0; indice < luminances.length; indice++) {
    const position = indice * 4;
    luminances[indice] = (0.2126 * donnees[position] + 0.7152 * donnees[position + 1]
      + 0.0722 * donnees[position + 2]) / 255;
  }
  const etirees = etirerNiveaux(luminances, plancher);
  for (let indice = 0; indice < etirees.length; indice++) {
    const niveau = Math.round(etirees[indice] * 255);
    const position = indice * 4;
    donnees[position] = niveau;
    donnees[position + 1] = niveau;
    donnees[position + 2] = niveau;
  }
  contexte.putImageData(pixels, 0, 0);

  const texture = new THREE.CanvasTexture(canevas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * @typedef {object} TexturesBois
 * @property {THREE.Texture} grain - Grain contrasté (multiplie la couleur).
 * @property {THREE.Texture} relief - Relief des veines (normal map).
 * @property {THREE.Texture} rugosite - Variation de brillance.
 */

/**
 * Charge et prépare les textures du bois peint (une seule fois pour tout le jeu).
 *
 * @param {typeof import('../config.js').CONFIG.boisPeint} reglages - Chemins et intensité des nervures.
 * @returns {Promise<TexturesBois>}
 */
export async function chargerBoisPeint(reglages) {
  const chargeur = new THREE.TextureLoader();
  const [image, relief, rugosite] = await Promise.all([
    chargeur.loadAsync(reglages.textureGrain),
    chargeur.loadAsync(reglages.textureRelief),
    chargeur.loadAsync(reglages.textureRugosite),
  ]);
  const grain = creerTextureGrain(image.image, reglages.plancherNervures);
  image.dispose();
  relief.colorSpace = THREE.NoColorSpace;
  rugosite.colorSpace = THREE.NoColorSpace;
  for (const texture of [grain, relief, rugosite]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
  }
  return { grain, relief, rugosite };
}

/**
 * Crée le matériau d'un objet en bois peint. Chaque objet reçoit un décalage
 * de texture au hasard : deux blocs n'ont jamais exactement le même grain.
 *
 * @param {TexturesBois | null} textures - Textures préparées (ou `null` : couleur unie).
 * @param {number} couleur - Couleur de la peinture (hexadécimal Three.js).
 * @param {typeof import('../config.js').CONFIG.boisPeint} reglages - Taille du motif, relief, rugosité.
 * @param {number} plusGrandeDimension - Plus grande dimension de l'objet, en mètres.
 * @returns {THREE.MeshStandardMaterial}
 */
export function creerMateriauBoisPeint(textures, couleur, reglages, plusGrandeDimension) {
  const repetition = plusGrandeDimension / reglages.tailleMotif;
  const decalage = new THREE.Vector2(Math.random(), Math.random());
  /**
   * Copie une texture avec son propre cadrage (l'image reste partagée en mémoire).
   *
   * @param {THREE.Texture | undefined} texture - Texture partagée.
   * @returns {THREE.Texture | null}
   */
  const cadrer = (texture) => {
    if (!texture) {
      return null;
    }
    const copie = texture.clone();
    copie.repeat.set(repetition, repetition);
    copie.offset.copy(decalage);
    return copie;
  };

  // Le grain assombrit la peinture en moyenne : on l'éclaircit d'autant pour
  // garder la luminosité du pastel (veines plus claires ET plus sombres).
  const couleurPeinture = new THREE.Color(couleur);
  if (textures) {
    const grainMoyen = reglages.plancherNervures + (1 - reglages.plancherNervures) / 2;
    couleurPeinture.multiplyScalar(1 / grainMoyen);
  }

  return new THREE.MeshStandardMaterial({
    color: couleurPeinture,
    map: cadrer(textures?.grain),
    normalMap: cadrer(textures?.relief),
    normalScale: new THREE.Vector2(reglages.intensiteRelief, reglages.intensiteRelief),
    roughnessMap: cadrer(textures?.rugosite),
    roughness: reglages.rugosite,
    metalness: 0,
    // Le halo de survol est une lumière émise de la même couleur.
    emissive: couleur,
    emissiveIntensity: 0,
  });
}
