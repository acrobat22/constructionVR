/**
 * @file Création de la scène, de la caméra, du moteur de rendu et de la
 * table de construction (plateau en chêne texturé et quatre pieds).
 *
 * Le rendu des couleurs imite un appareil photo (`NeutralToneMapping`),
 * comme dans l'exemple de puzzle qui a inspiré l'ambiance.
 */

import * as THREE from 'three';

/**
 * Crée la scène, la caméra et la table.
 *
 * @param {typeof import('../config.js').CONFIG} config - Configuration globale.
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
 */
export function creerEnvironnement(config) {
  const scene = new THREE.Scene();
  // Couleur de secours, remplacée par la photo de la pièce une fois chargée.
  scene.background = new THREE.Color(config.ambiance.couleurSecours);

  const camera = new THREE.PerspectiveCamera(
    config.camera.champDeVision,
    window.innerWidth / window.innerHeight,
    0.05,
    100,
  );
  // Position utilisée pour l'aperçu hors VR ; en VR, le casque la remplace.
  camera.position.set(0, config.camera.hauteurYeuxAssis, 0);
  camera.lookAt(0, config.table.hauteur, -config.table.distanceJoueur);

  scene.add(creerTable(config.table));

  return { scene, camera };
}

/**
 * Crée le moteur de rendu (ombres, rendu photographique), l'insère dans la
 * page et l'adapte à la taille de la fenêtre.
 *
 * @param {HTMLElement} conteneur - Élément de la page qui reçoit le canevas.
 * @param {THREE.PerspectiveCamera} camera - Caméra à réajuster au redimensionnement.
 * @returns {THREE.WebGLRenderer}
 */
export function creerRendu(conteneur, camera) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  // `PCFShadowMap` (par défaut) adoucit les bords selon `shadow.radius`.
  renderer.shadowMap.enabled = true;
  // Rendu « appareil photo » : hautes lumières adoucies, couleurs naturelles.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  // Le canevas est un aperçu décoratif : on le décrit pour les lecteurs d'écran.
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Aperçu de la scène : une table de construction dans une pièce lumineuse');
  conteneur.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return renderer;
}

/**
 * Charge une texture répétée du plateau. En cas d'échec, le plateau garde
 * simplement sa couleur unie.
 *
 * @param {string} url - Adresse de l'image.
 * @param {THREE.ColorSpace} espaceCouleur - `SRGBColorSpace` pour la couleur, `NoColorSpace` sinon.
 * @param {THREE.Vector2} repetition - Nombre de répétitions en largeur et en profondeur.
 * @param {(texture: THREE.Texture) => void} surChargement - Reçoit la texture prête.
 */
function chargerTextureRepetee(url, espaceCouleur, repetition, surChargement) {
  new THREE.TextureLoader().load(
    url,
    (texture) => {
      texture.colorSpace = espaceCouleur;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.copy(repetition);
      texture.anisotropy = 8;
      surChargement(texture);
    },
    undefined,
    (erreur) => console.error(`[scene.chargerTextureRepetee] Texture « ${url} » non chargée :`, erreur),
  );
}

/**
 * Crée la table de construction (plateau en chêne et quatre pieds), devant le joueur.
 *
 * @param {typeof import('../config.js').CONFIG.table} reglagesTable - Réglages de la table.
 * @returns {THREE.Group}
 */
function creerTable(reglagesTable) {
  const table = new THREE.Group();
  table.name = 'table';
  table.position.set(0, 0, -reglagesTable.distanceJoueur);

  const materiauPlateau = new THREE.MeshStandardMaterial({
    color: reglagesTable.couleurSecours,
    roughness: 0.55,
  });
  const repetition = new THREE.Vector2(
    reglagesTable.largeur / reglagesTable.tailleMotif,
    reglagesTable.profondeur / reglagesTable.tailleMotif,
  );
  chargerTextureRepetee(reglagesTable.textureCouleur, THREE.SRGBColorSpace, repetition, (texture) => {
    materiauPlateau.map = texture;
    // La texture porte la couleur : on neutralise la teinte de secours.
    materiauPlateau.color.set(0xffffff);
    materiauPlateau.needsUpdate = true;
  });
  chargerTextureRepetee(reglagesTable.textureRelief, THREE.NoColorSpace, repetition, (texture) => {
    materiauPlateau.normalMap = texture;
    materiauPlateau.needsUpdate = true;
  });
  chargerTextureRepetee(reglagesTable.textureRugosite, THREE.NoColorSpace, repetition, (texture) => {
    materiauPlateau.roughnessMap = texture;
    materiauPlateau.roughness = 1;
    materiauPlateau.needsUpdate = true;
  });

  const plateau = new THREE.Mesh(
    new THREE.BoxGeometry(reglagesTable.largeur, reglagesTable.epaisseur, reglagesTable.profondeur),
    materiauPlateau,
  );
  // Le dessus du plateau est à la hauteur demandée.
  plateau.position.y = reglagesTable.hauteur - reglagesTable.epaisseur / 2;
  plateau.castShadow = true;
  plateau.receiveShadow = true;
  table.add(plateau);

  const hauteurPied = reglagesTable.hauteur - reglagesTable.epaisseur;
  const geometriePied = new THREE.CylinderGeometry(
    reglagesTable.rayonPieds,
    reglagesTable.rayonPieds,
    hauteurPied,
    16,
  );
  const materiauPied = new THREE.MeshStandardMaterial({ color: reglagesTable.couleurPieds, roughness: 0.6 });
  // Pieds légèrement en retrait des bords du plateau.
  const retrait = reglagesTable.rayonPieds * 3;
  const demiLargeur = reglagesTable.largeur / 2 - retrait;
  const demiProfondeur = reglagesTable.profondeur / 2 - retrait;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const pied = new THREE.Mesh(geometriePied, materiauPied);
    pied.position.set(x * demiLargeur, hauteurPied / 2, z * demiProfondeur);
    pied.castShadow = true;
    table.add(pied);
  }

  return table;
}
