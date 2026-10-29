/**
 * @file Tapis de jeu en feutrine, posé sur la table sous la zone de jeu.
 *
 * Sa couleur foncée fait ressortir les pièces pastel et le bois clair :
 * contraste d'au moins 3:1 pour toutes les couleurs des modèles (règle WCAG
 * des objets graphiques). Les fibres viennent d'une texture de laine
 * (Poly Haven, CC0), dont seules les nuances et le relief sont gardés.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { creerTextureGrain } from '../construction/boisPeint.js';

/**
 * Crée le tapis. Les textures se chargent en arrière-plan ; en cas d'échec,
 * le tapis reste uni (sa couleur suffit au contraste).
 *
 * @param {typeof import('../config.js').CONFIG.tapis} reglages - Taille, couleur, textures.
 * @param {typeof import('../config.js').CONFIG.table} reglagesTable - Position de la table.
 * @returns {THREE.Mesh}
 */
export function creerTapis(reglages, reglagesTable) {
  const materiau = new THREE.MeshStandardMaterial({ color: reglages.couleur, roughness: 1 });
  const tapis = new THREE.Mesh(
    new RoundedBoxGeometry(reglages.largeur, reglages.epaisseur, reglages.profondeur, 2, reglages.epaisseur / 2),
    materiau,
  );
  tapis.position.set(0, reglagesTable.hauteur + reglages.epaisseur / 2, -reglagesTable.distanceJoueur);
  tapis.receiveShadow = true;
  tapis.name = 'tapis';

  chargerFibres(reglages, materiau).catch((erreur) => {
    console.error('[tapis] Textures de feutrine non chargées, tapis uni :', erreur);
  });
  return tapis;
}

/**
 * Charge les fibres de la feutrine et les applique au matériau.
 *
 * @param {typeof import('../config.js').CONFIG.tapis} reglages - Chemins et intensités.
 * @param {THREE.MeshStandardMaterial} materiau - Matériau du tapis.
 * @returns {Promise<void>}
 */
async function chargerFibres(reglages, materiau) {
  const chargeur = new THREE.TextureLoader();
  const [image, relief, rugosite] = await Promise.all([
    chargeur.loadAsync(reglages.textureCouleur),
    chargeur.loadAsync(reglages.textureRelief),
    chargeur.loadAsync(reglages.textureRugosite),
  ]);
  const nuances = creerTextureGrain(image.image, reglages.plancherNuances);
  image.dispose();
  relief.colorSpace = THREE.NoColorSpace;
  rugosite.colorSpace = THREE.NoColorSpace;
  const repetition = new THREE.Vector2(
    reglages.largeur / reglages.tailleMotif,
    reglages.profondeur / reglages.tailleMotif,
  );
  for (const texture of [nuances, relief, rugosite]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.copy(repetition);
    texture.anisotropy = 8;
  }

  // Les nuances assombrissent en moyenne : on compense pour garder la couleur voulue.
  const nuanceMoyenne = reglages.plancherNuances + (1 - reglages.plancherNuances) / 2;
  materiau.color.setHex(reglages.couleur).multiplyScalar(1 / nuanceMoyenne);
  materiau.map = nuances;
  materiau.normalMap = relief;
  materiau.roughnessMap = rugosite;
  materiau.needsUpdate = true;
}
