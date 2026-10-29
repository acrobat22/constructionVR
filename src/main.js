/**
 * @file Point d'entrée : crée les modules et les relie entre eux.
 *
 * C'est le seul endroit qui connaît tous les modules (inversion des
 * dépendances) : chaque module reçoit ici ce dont il a besoin.
 */

import { Box3, Group, Vector3 } from 'three';

import { CONFIG } from './config.js';
import { creerEnvironnement, creerRendu } from './coeur/scene.js';
import { ajouterSolOmbres, chargerAmbiance } from './coeur/ambiance.js';
import { Lampe } from './coeur/lampe.js';
import { SurveillantFluidite } from './coeur/qualiteAdaptative.js';
import { SessionXR } from './coeur/sessionXR.js';
import { Mains } from './entrees/mains.js';
import { DetecteurPincement } from './entrees/detecteurPincement.js';
import { Brique, creerPlaqueDeBase } from './construction/brique.js';
import { GestionnaireSaisie } from './construction/saisie.js';
import { Historique } from './construction/historique.js';
import { MaquetteFantome } from './construction/maquetteFantome.js';
import { Partie } from './construction/partie.js';
import { creerMiniature } from './construction/miniature.js';
import { Bouton3D } from './interface/bouton3D.js';
import { dessinerFlecheRetour, dessinerOeil } from './interface/icones.js';
import { CarteProgression } from './interface/carteProgression.js';
import { chargerModele, calculerEmprise, calculerPositionsEnMetres } from './modeles/chargeurModele.js';

const zoneMessage = document.getElementById('message-statut');

const { scene, camera } = creerEnvironnement(CONFIG);
const renderer = creerRendu(document.getElementById('scene'), camera);
ajouterSolOmbres(scene, CONFIG.ambiance);

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

const lampe = new Lampe(CONFIG.lampe, surLaTable({ x: 0, z: 0 }, 0));
lampe.objet3D.position.add(new Vector3(CONFIG.lampe.decalage.x, 0, CONFIG.lampe.decalage.z));
scene.add(lampe.objet3D);

// La pièce photographiée se charge en arrière-plan ; le jeu reste jouable sans elle.
chargerAmbiance(scene, CONFIG.ambiance).catch((erreur) => {
  console.error('[main] Chargement de la pièce impossible :', erreur);
});

// Temps de la dernière image, transmis aux boutons lors d'un appui.
let tempsCourant = 0;

const saisie = new GestionnaireSaisie(CONFIG.saisie);

const boutonAnnuler = new Bouton3D(CONFIG.bouton, {
  libelle: 'Annuler',
  dessinerIcone: dessinerFlecheRetour,
  surAppui: () => partie.annuler(),
  estActif: false,
});
boutonAnnuler.objet3D.position.copy(surLaTable(CONFIG.disposition.boutonAnnuler, CONFIG.bouton.hauteur));
scene.add(boutonAnnuler.objet3D);

/** Libellés du bouton « œil » selon que la miniature est affichée ou non. */
const LIBELLES_MODELE = Object.freeze({ voir: 'Voir le modèle', cacher: 'Cacher le modèle' });

/** @type {Group | null} Miniature du modèle terminé (créée au chargement du modèle). */
let miniature = null;

const boutonModele = new Bouton3D(CONFIG.bouton, {
  libelle: CONFIG.miniature.visibleAuDemarrage ? LIBELLES_MODELE.cacher : LIBELLES_MODELE.voir,
  dessinerIcone: dessinerOeil,
  surAppui: () => {
    if (!miniature) {
      return;
    }
    miniature.visible = !miniature.visible;
    boutonModele.definirLibelle(miniature.visible ? LIBELLES_MODELE.cacher : LIBELLES_MODELE.voir);
  },
});
boutonModele.objet3D.position.copy(surLaTable(CONFIG.disposition.boutonModele, CONFIG.bouton.hauteur));
scene.add(boutonModele.objet3D);

const boutons = [boutonAnnuler, boutonModele];

const carte = new CarteProgression(CONFIG.carte);
scene.add(carte.objet3D);

const mains = new Mains(
  renderer,
  scene,
  CONFIG.mains,
  () => new DetecteurPincement(CONFIG.mains.pincement),
  {
    surDebutPincement: (cote, point) => {
      // Un pincement sur un bouton l'active ; ailleurs, il saisit une brique.
      const boutonVise = boutons.find((bouton) => bouton.estVise(point));
      if (boutonVise) {
        boutonVise.appuyer(tempsCourant);
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

/** Plateau de la table, en coordonnées de la scène. */
const zoneTable = {
  minX: -CONFIG.table.largeur / 2,
  maxX: CONFIG.table.largeur / 2,
  minZ: -CONFIG.table.distanceJoueur - CONFIG.table.profondeur / 2,
  maxZ: -CONFIG.table.distanceJoueur + CONFIG.table.profondeur / 2,
};

/** Nom du modèle en cours, affiché sur la carte. */
let nomModele = '';

const partie = new Partie({
  conteneurModele,
  scene,
  saisie,
  historique: new Historique(),
  maquette: new MaquetteFantome(CONFIG.grille, CONFIG.fantome),
  positionReserve: surLaTable(CONFIG.disposition.reserve, CONFIG.grille.hauteurCouche / 2),
  zoneTable,
  grille: CONFIG.grille,
  reglages: CONFIG.accrochage,
  reglagesChute: CONFIG.chute,
  surChangement: () => {
    boutonAnnuler.definirActif(partie.peutAnnuler);
    carte.afficher(nomModele, partie.nombreBriquesPosees, partie.nombreBriques);
  },
});

try {
  const modele = await chargerModele(CONFIG.modele.url);
  nomModele = modele.nom;
  const emprise = calculerEmprise(modele);
  const places = calculerPositionsEnMetres(modele, CONFIG.grille);

  const plaque = creerPlaqueDeBase(
    CONFIG.grille,
    CONFIG.plaqueDeBase,
    emprise.maxX - emprise.minX,
    emprise.maxZ - emprise.minZ,
    CONFIG.ombreContact,
  );
  conteneurModele.add(plaque);
  conteneurModele.updateMatrixWorld(true);
  const boitePlaque = new Box3().setFromObject(plaque);
  const supportPlaque = {
    minX: boitePlaque.min.x,
    maxX: boitePlaque.max.x,
    minZ: boitePlaque.min.z,
    maxZ: boitePlaque.max.z,
    dessus: conteneurModele.position.y,
  };

  miniature = creerMiniature({ modele, places, emprise, config: CONFIG });
  miniature.position.copy(surLaTable(CONFIG.disposition.miniature, 0));
  scene.add(miniature);

  partie.demarrer(
    modele.briques.map((description) => new Brique(CONFIG.grille, CONFIG.brique, description, CONFIG.ombreContact)),
    places,
    [{ ...zoneTable, dessus: CONFIG.table.hauteur }, supportPlaque],
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

// Qualité adaptative : chaque lenteur persistante baisse la qualité d'un cran.
const surveillant = new SurveillantFluidite(CONFIG.qualite);
const baissesDeQualite = [
  () => lampe.definirResolutionOmbre(CONFIG.lampe.resolutionOmbreReduite),
  () => lampe.desactiverOmbres(),
];
renderer.xr.addEventListener('sessionstart', () => surveillant.reinitialiser());

// Boucle de rendu : `setAnimationLoop` est obligatoire en WebXR
// (elle suit la fréquence d'affichage du casque).
renderer.setAnimationLoop((temps) => {
  tempsCourant = temps;
  if (surveillant.enregistrerImage(temps) && baissesDeQualite.length > 0) {
    const baisserQualite = baissesDeQualite.shift();
    baisserQualite();
    console.info('[main] Affichage lent : qualité des ombres réduite.');
  }

  mains.mettreAJour();
  const pointsDePincement = mains.pointsDePincement;
  saisie.mettreAJour(pointsDePincement);
  partie.mettreAJour(temps);
  for (const bouton of boutons) {
    bouton.mettreAJour(pointsDePincement, temps);
  }
  renderer.render(scene, camera);
});
