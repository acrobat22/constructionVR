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
import { DetecteurPincement } from './entrees/detecteurPincement.js';
import { Brique } from './construction/brique.js';
import { GestionnaireSaisie } from './construction/saisie.js';

const { scene, camera } = creerEnvironnement(CONFIG);
const renderer = creerRendu(document.getElementById('scene'), camera);

const saisie = new GestionnaireSaisie(CONFIG.saisie);

const mains = new Mains(
  renderer,
  scene,
  CONFIG.mains,
  () => new DetecteurPincement(CONFIG.mains.pincement),
  {
    surDebutPincement: (cote, point) => saisie.saisir(cote, point),
    surFinPincement: (cote) => saisie.relacher(cote),
  },
);

// Brique d'essai (étape 2), posée sur la table, un peu vers le joueur.
const briqueDeTest = new Brique(CONFIG.brique, CONFIG.briqueDeTest.couleur);
briqueDeTest.objet3D.position.set(
  0,
  CONFIG.table.hauteur + CONFIG.brique.hauteur / 2,
  -CONFIG.table.distanceJoueur + CONFIG.briqueDeTest.decalageVersJoueur,
);
scene.add(briqueDeTest.objet3D);
saisie.ajouterObjet(briqueDeTest);

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
  mains.mettreAJour();
  saisie.mettreAJour(mains.pointsDePincement);
  renderer.render(scene, camera);
});
