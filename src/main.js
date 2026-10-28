/**
 * @file Point d'entrée : crée les modules et les relie entre eux.
 *
 * C'est le seul endroit qui connaît tous les modules (inversion des
 * dépendances) : chaque module reçoit ici ce dont il a besoin.
 */

import { CONFIG } from './config.js';
import { creerEnvironnement, creerRendu } from './coeur/scene.js';
import { SessionXR } from './coeur/sessionXR.js';
import { Mains } from './entrees/mains.js';

const { scene, camera } = creerEnvironnement(CONFIG);
const renderer = creerRendu(document.getElementById('scene'), camera);

new Mains(renderer, scene, CONFIG.mains);

const sessionXR = new SessionXR({
  renderer,
  bouton: document.getElementById('bouton-vr'),
  zoneMessage: document.getElementById('message-statut'),
  reglages: CONFIG.session,
});
sessionXR.initialiser();

// Boucle de rendu : `setAnimationLoop` est obligatoire en WebXR
// (elle suit la fréquence d'affichage du casque).
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
