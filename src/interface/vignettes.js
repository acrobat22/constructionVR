/**
 * @file Vignettes des modèles pour le menu d'accueil, générées par le jeu à
 * partir des fichiers JSON : aucune image à dessiner ni à mettre à jour.
 */

import * as THREE from 'three';

/** Taille des vignettes, en pixels. */
const LARGEUR = 320;
const HAUTEUR = 240;

/** Couleur de fond des vignettes (clair et chaud, comme la pièce du jeu). */
const COULEUR_FOND = 0xefe7da;

/**
 * Génère une image pour chaque modèle, avec un seul moteur de rendu temporaire.
 *
 * @param {{ url: string, objet3D: THREE.Object3D }[]} modeles - Modèles terminés à photographier.
 * @returns {Map<string, string>} Image (`data:image/png`) par adresse de modèle.
 */
export function genererVignettes(modeles) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(LARGEUR, HAUTEUR);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COULEUR_FOND);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8d7a66, 2));
  const soleil = new THREE.DirectionalLight(0xfff1dd, 2.2);
  soleil.position.set(1, 2, 2);
  scene.add(soleil);

  const camera = new THREE.PerspectiveCamera(30, LARGEUR / HAUTEUR, 0.01, 20);
  const vignettes = new Map();
  try {
    for (const { url, objet3D } of modeles) {
      scene.add(objet3D);
      cadrer(camera, objet3D);
      renderer.render(scene, camera);
      vignettes.set(url, renderer.domElement.toDataURL('image/png'));
      scene.remove(objet3D);
    }
  } finally {
    // Libère le contexte graphique : le jeu n'en garde qu'un.
    renderer.dispose();
    renderer.forceContextLoss();
  }
  return vignettes;
}

/**
 * Place la caméra pour voir le modèle de trois quarts face, un peu en hauteur.
 * Le cadrage se fait sur les pièces seules : la planchette déborde un peu,
 * mais le modèle remplit la vignette.
 *
 * @param {THREE.PerspectiveCamera} camera - Caméra à placer.
 * @param {THREE.Object3D} objet - Objet à cadrer.
 */
function cadrer(camera, objet) {
  objet.updateMatrixWorld(true);
  const boite = new THREE.Box3();
  objet.traverse((enfant) => {
    if (enfant.name === 'brique') {
      boite.expandByObject(enfant);
    }
  });
  if (boite.isEmpty()) {
    boite.setFromObject(objet);
  }
  const centre = boite.getCenter(new THREE.Vector3());
  const rayon = boite.getBoundingSphere(new THREE.Sphere()).radius;
  const distance = rayon / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.1;
  const direction = new THREE.Vector3(0.45, 0.5, 1).normalize();
  camera.position.copy(centre).addScaledVector(direction, distance);
  camera.lookAt(centre);
}
