/**
 * @file Point d'entrée : crée les modules et les relie entre eux.
 *
 * C'est le seul endroit qui connaît tous les modules (inversion des
 * dépendances) : chaque module reçoit ici ce dont il a besoin.
 */

import { Group, Vector3 } from 'three';

import { CONFIG } from './config.js';
import { creerEnvironnement, creerRendu, appliquerEnvironnement } from './coeur/scene.js';
import { SessionXR } from './coeur/sessionXR.js';
import { Mains } from './entrees/mains.js';
import { DetecteurPincement } from './entrees/detecteurPincement.js';
import { Brique, creerPlaqueDeBase } from './construction/brique.js';
import { GestionnaireSaisie } from './construction/saisie.js';
import { Historique } from './construction/historique.js';
import { MaquetteFantome } from './construction/maquetteFantome.js';
import { Partie } from './construction/partie.js';
import { BoutonAnnuler } from './interface/boutonAnnuler.js';
import { chargerModele, calculerEmprise, calculerPositionsEnMetres } from './modeles/chargeurModele.js';

const zoneMessage = document.getElementById('message-statut');

const { scene, camera } = creerEnvironnement(CONFIG);
const renderer = creerRendu(document.getElementById('scene'), camera);
appliquerEnvironnement(scene, renderer, CONFIG.eclairage.intensiteEnvironnement);

/**
 * Convertit une position relative au centre du plateau en coordonnées de la scène.
 *
 * @param {{ x: number, z: number }} emplacement - Décalage depuis le centre du plateau.
 * @param {number} hauteurAuDessus - Hauteur au-dessus du plateau.
 * @returns {Vector3}
 */
function surLaTable(emplacement, hauteurAuDessus) {
  return new Vector3(
    emplacement.x,
    CONFIG.table.hauteur + hauteurAuDessus,
    -CONFIG.table.distanceJoueur + emplacement.z,
  );
}

// Temps de la dernière image, transmis au bouton lors d'un appui.
let tempsCourant = 0;

const saisie = new GestionnaireSaisie(CONFIG.saisie);

const boutonAnnuler = new BoutonAnnuler(CONFIG.boutonAnnuler, () => partie.annuler());
boutonAnnuler.objet3D.position.copy(
  surLaTable(CONFIG.disposition.boutonAnnuler, CONFIG.boutonAnnuler.hauteur),
);
scene.add(boutonAnnuler.objet3D);

const mains = new Mains(
  renderer,
  scene,
  CONFIG.mains,
  () => new DetecteurPincement(CONFIG.mains.pincement),
  {
    surDebutPincement: (cote, point) => {
      // Un pincement sur le bouton l'active ; ailleurs, il saisit une brique.
      if (boutonAnnuler.estVise(point)) {
        boutonAnnuler.appuyer(tempsCourant);
      } else {
        saisie.saisir(cote, point);
      }
    },
    surFinPincement: (cote) => {
      const objetLache = saisie.relacher(cote);
      if (objetLache) {
        partie.surObjetRelache(objetLache);
      }
    },
  },
);

// Conteneur du modèle : origine au centre de la plaque, dessus de la plaque à y = 0.
const conteneurModele = new Group();
conteneurModele.name = 'modele';
conteneurModele.position.copy(surLaTable(CONFIG.disposition.modele, CONFIG.plaqueDeBase.epaisseur));
scene.add(conteneurModele);

const partie = new Partie({
  conteneurModele,
  scene,
  saisie,
  historique: new Historique(),
  maquette: new MaquetteFantome(CONFIG.grille, CONFIG.fantome),
  positionReserve: surLaTable(CONFIG.disposition.reserve, CONFIG.grille.hauteurCouche / 2),
  reglages: CONFIG.accrochage,
  surChangement: () => boutonAnnuler.definirActif(partie.peutAnnuler),
});

try {
  const modele = await chargerModele(CONFIG.modele.url);
  const emprise = calculerEmprise(modele);
  conteneurModele.add(creerPlaqueDeBase(
    CONFIG.grille,
    CONFIG.plaqueDeBase,
    emprise.maxX - emprise.minX,
    emprise.maxZ - emprise.minZ,
  ));
  partie.demarrer(
    modele.briques.map((description) => new Brique(CONFIG.grille, CONFIG.brique, description)),
    calculerPositionsEnMetres(modele, CONFIG.grille),
  );
} catch (erreur) {
  console.error('[main] Chargement du modèle impossible :', erreur);
  zoneMessage.textContent = 'Le modèle à construire n’a pas pu être chargé. Rechargez la page pour réessayer.';
}

const sessionXR = new SessionXR({
  renderer,
  bouton: document.getElementById('bouton-vr'),
  zoneMessage,
  reglages: CONFIG.session,
});
sessionXR.initialiser();

// Boucle de rendu : `setAnimationLoop` est obligatoire en WebXR
// (elle suit la fréquence d'affichage du casque).
renderer.setAnimationLoop((temps) => {
  tempsCourant = temps;
  mains.mettreAJour();
  const pointsDePincement = mains.pointsDePincement;
  saisie.mettreAJour(pointsDePincement);
  partie.mettreAJour(temps);
  boutonAnnuler.mettreAJour(pointsDePincement, temps);
  renderer.render(scene, camera);
});
