/**
 * @file Création de l'environnement 3D : scène, caméra, lumières, ombres,
 * sol, table, ainsi que du moteur de rendu WebGL.
 *
 * L'ambiance s'inspire de l'exemple officiel `webgl_animation_multiple` :
 * lumière du ciel + soleil avec ombres douces, sol clair, brouillard léger.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
  scene.fog = new THREE.Fog(config.scene.couleurFond, config.scene.brouillardDebut, config.scene.brouillardFin);

  const camera = new THREE.PerspectiveCamera(
    config.camera.champDeVision,
    window.innerWidth / window.innerHeight,
    0.05,
    100,
  );
  // Position utilisée pour l'aperçu hors VR ; en VR, le casque la remplace.
  camera.position.set(0, config.camera.hauteurYeuxAssis, 0);
  camera.lookAt(0, config.table.hauteur, -config.table.distanceJoueur);

  ajouterLumieres(scene, config.eclairage, config.table);
  scene.add(creerSol(config.scene));
  scene.add(creerTable(config.table));

  return { scene, camera };
}

/**
 * Crée le moteur de rendu (ombres activées), l'insère dans la page et
 * l'adapte à la taille de la fenêtre.
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
 * Ajoute à la scène un environnement de reflets doux (pièce neutre
 * pré-calculée une seule fois), qui donne l'aspect plastique aux briques.
 *
 * @param {THREE.Scene} scene - Scène à compléter.
 * @param {THREE.WebGLRenderer} renderer - Moteur de rendu (nécessaire au calcul).
 * @param {number} intensite - Intensité des reflets.
 */
export function appliquerEnvironnement(scene, renderer, intensite) {
  const generateur = new THREE.PMREMGenerator(renderer);
  scene.environment = generateur.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = intensite;
  generateur.dispose();
}

/**
 * Ajoute la lumière du ciel et un soleil projetant des ombres douces,
 * limitées à la zone de la table pour ménager le casque.
 *
 * @param {THREE.Scene} scene - Scène à éclairer.
 * @param {typeof import('../config.js').CONFIG.eclairage} reglages - Réglages d'éclairage.
 * @param {typeof import('../config.js').CONFIG.table} reglagesTable - Position de la table (cible du soleil).
 */
function ajouterLumieres(scene, reglages, reglagesTable) {
  const lumiereCiel = new THREE.HemisphereLight(
    reglages.couleurCiel,
    reglages.couleurSolReflet,
    reglages.intensiteCiel,
  );
  scene.add(lumiereCiel);

  const soleil = new THREE.DirectionalLight(0xffffff, reglages.intensiteSoleil);
  soleil.position.set(reglages.positionSoleil.x, reglages.positionSoleil.y, reglages.positionSoleil.z);
  soleil.target.position.set(0, reglagesTable.hauteur, -reglagesTable.distanceJoueur);
  soleil.castShadow = true;

  const ombre = soleil.shadow;
  ombre.mapSize.set(reglages.resolutionOmbre, reglages.resolutionOmbre);
  ombre.radius = reglages.flouOmbre;
  ombre.camera.left = -reglages.etendueOmbre;
  ombre.camera.right = reglages.etendueOmbre;
  ombre.camera.top = reglages.etendueOmbre;
  ombre.camera.bottom = -reglages.etendueOmbre;
  ombre.camera.near = 0.5;
  ombre.camera.far = 8;
  // Évite les stries d'auto-ombrage sur les faces des briques.
  ombre.bias = -0.0005;
  ombre.normalBias = 0.01;

  scene.add(soleil);
  // La cible doit être dans la scène pour que l'orientation soit prise en compte.
  scene.add(soleil.target);
}

/**
 * Crée un grand sol mat qui reçoit les ombres et se fond dans le brouillard.
 *
 * @param {typeof import('../config.js').CONFIG.scene} reglagesScene - Réglages du sol.
 * @returns {THREE.Mesh}
 */
function creerSol(reglagesScene) {
  const geometrie = new THREE.PlaneGeometry(reglagesScene.tailleSol, reglagesScene.tailleSol);
  const materiau = new THREE.MeshStandardMaterial({ color: reglagesScene.couleurSol, roughness: 1 });
  const sol = new THREE.Mesh(geometrie, materiau);
  // Le plan est vertical par défaut : on le couche.
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  sol.name = 'sol';
  return sol;
}

/**
 * Crée la table de construction (plateau et quatre pieds), devant le joueur.
 *
 * @param {typeof import('../config.js').CONFIG.table} reglagesTable - Réglages de la table.
 * @returns {THREE.Group}
 */
function creerTable(reglagesTable) {
  const table = new THREE.Group();
  table.name = 'table';
  table.position.set(0, 0, -reglagesTable.distanceJoueur);

  const plateau = new THREE.Mesh(
    new THREE.BoxGeometry(reglagesTable.largeur, reglagesTable.epaisseur, reglagesTable.profondeur),
    new THREE.MeshStandardMaterial({ color: reglagesTable.couleur, roughness: 0.6 }),
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
  const materiauPied = new THREE.MeshStandardMaterial({ color: reglagesTable.couleurPieds, roughness: 0.7 });
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
