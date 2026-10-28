/**
 * @file Création de l'environnement 3D : scène, caméra, lumières, sol, table,
 * ainsi que du moteur de rendu WebGL.
 */

import * as THREE from 'three';

/**
 * Crée la scène et la caméra, avec un éclairage doux, un sol et une table
 * à hauteur assise placée devant le joueur.
 *
 * @param {typeof import('../config.js').CONFIG} config - Configuration globale.
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
 */
export function creerEnvironnement(config) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.scene.couleurFond);

  const camera = new THREE.PerspectiveCamera(
    config.camera.champDeVision,
    window.innerWidth / window.innerHeight,
    0.05,
    100,
  );
  // Position utilisée pour l'aperçu hors VR ; en VR, le casque la remplace.
  camera.position.set(0, config.camera.hauteurYeuxAssis, 0);
  camera.lookAt(0, config.table.hauteur, -config.table.distanceJoueur);

  ajouterLumieres(scene);
  scene.add(creerSol(config.scene));
  scene.add(creerTable(config.table));

  return { scene, camera };
}

/**
 * Crée le moteur de rendu, l'insère dans la page et l'adapte à la taille
 * de la fenêtre.
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

  // Le canevas est un aperçu décoratif : on le décrit pour les lecteurs d'écran.
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Aperçu de la scène : une table de construction');
  conteneur.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return renderer;
}

/**
 * Ajoute un éclairage doux et uniforme (pas d'ombres dures, pas d'éblouissement).
 *
 * @param {THREE.Scene} scene - Scène à éclairer.
 */
function ajouterLumieres(scene) {
  const lumiereAmbiante = new THREE.HemisphereLight(0xffffff, 0x444455, 2);
  scene.add(lumiereAmbiante);

  const lumiereDirectionnelle = new THREE.DirectionalLight(0xffffff, 1.5);
  lumiereDirectionnelle.position.set(1, 3, 1);
  scene.add(lumiereDirectionnelle);
}

/**
 * Crée un sol horizontal uni.
 *
 * @param {{ couleurSol: number, tailleSol: number }} reglagesScene - Réglages du sol.
 * @returns {THREE.Mesh}
 */
function creerSol(reglagesScene) {
  const geometrie = new THREE.PlaneGeometry(reglagesScene.tailleSol, reglagesScene.tailleSol);
  const materiau = new THREE.MeshStandardMaterial({ color: reglagesScene.couleurSol });
  const sol = new THREE.Mesh(geometrie, materiau);
  // Le plan est vertical par défaut : on le couche.
  sol.rotation.x = -Math.PI / 2;
  sol.name = 'sol';
  return sol;
}

/**
 * Crée le plateau de la table de construction, devant le joueur.
 *
 * @param {typeof import('../config.js').CONFIG.table} reglagesTable - Réglages de la table.
 * @returns {THREE.Mesh}
 */
function creerTable(reglagesTable) {
  const geometrie = new THREE.BoxGeometry(
    reglagesTable.largeur,
    reglagesTable.epaisseur,
    reglagesTable.profondeur,
  );
  const materiau = new THREE.MeshStandardMaterial({ color: reglagesTable.couleur });
  const table = new THREE.Mesh(geometrie, materiau);
  // Le dessus du plateau est à la hauteur demandée.
  table.position.set(0, reglagesTable.hauteur - reglagesTable.epaisseur / 2, -reglagesTable.distanceJoueur);
  table.name = 'table';
  return table;
}
