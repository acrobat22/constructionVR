/**
 * @file Point d'entrée : crée les modules et les relie entre eux.
 *
 * C'est le seul endroit qui connaît tous les modules (inversion des
 * dépendances) : chaque module reçoit ici ce dont il a besoin.
 */

import { Group, Vector3 } from 'three';

import { CONFIG } from './config.js';
import { creerEnvironnement, creerRendu } from './coeur/scene.js';
import { ajouterSolOmbres, chargerAmbiance } from './coeur/ambiance.js';
import { Lampe } from './coeur/lampe.js';
import { creerTapis } from './coeur/tapis.js';
import { SurveillantFluidite } from './coeur/qualiteAdaptative.js';
import { SessionXR } from './coeur/sessionXR.js';
import { Mains } from './entrees/mains.js';
import { DetecteurPincement } from './entrees/detecteurPincement.js';
import { Souris } from './entrees/souris.js';
import { GestionnaireSaisie } from './construction/saisie.js';
import { Historique } from './construction/historique.js';
import { MaquetteFantome } from './construction/maquetteFantome.js';
import { Partie } from './construction/partie.js';
import { Atelier } from './construction/atelier.js';
import { AideEmplacement } from './construction/aideEmplacement.js';
import { creerMiniature } from './construction/miniature.js';
import { chargerBoisPeint } from './construction/boisPeint.js';
import { Bouton3D } from './interface/bouton3D.js';
import { dessinerFlecheRetour, dessinerLecture, dessinerMaison, dessinerOeil } from './interface/icones.js';
import { CarteProgression } from './interface/carteProgression.js';
import { LampeAide } from './interface/lampeAide.js';
import { MenuModeles } from './interface/menuModeles.js';
import { genererVignettes } from './interface/vignettes.js';
import { ModeSansCasque } from './interface/modeSansCasque.js';
import { Sons } from './interface/sons.js';
import { chargerModele, calculerEmprise, calculerPositionsEnMetres } from './modeles/chargeurModele.js';
import { chargerCatalogue, trierParNombrePieces } from './modeles/catalogue.js';

const zoneMessage = document.getElementById('message-statut');

const { scene, camera } = creerEnvironnement(CONFIG);
const renderer = creerRendu(document.getElementById('scene'), camera);
ajouterSolOmbres(scene, CONFIG.ambiance);
scene.add(creerTapis(CONFIG.tapis, CONFIG.table));

/** Hauteur du plan de jeu : dessus du tapis posé sur la table. */
const HAUTEUR_PLAN_DE_JEU = CONFIG.table.hauteur + CONFIG.tapis.epaisseur;

// Sons doux : le contexte audio est réveillé au premier clic sur la page
// (exigence des navigateurs), et la case « Sons doux » les active ou les coupe.
const sons = new Sons(CONFIG.sons);
const caseSons = document.getElementById('case-sons');
sons.definirActifs(caseSons.checked);
const boutonEcouter = document.getElementById('bouton-ecouter');
caseSons.addEventListener('change', () => {
  sons.definirActifs(caseSons.checked);
  // « Écouter » n'a de sens que si les sons sont activés.
  boutonEcouter.disabled = !caseSons.checked;
  sons.reveiller();
});
boutonEcouter.disabled = !caseSons.checked;
// Fait entendre la mélodie de réussite pour régler le volume avant la VR.
boutonEcouter.addEventListener('click', () => {
  sons.reveiller();
  sons.jouerReussite();
});
document.addEventListener('click', () => sons.reveiller());

/**
 * Convertit une position relative au centre du plateau en coordonnées de la scène.
 *
 * @param {{ x: number, z: number }} emplacement - Décalage depuis le centre du plateau.
 * @param {number} hauteurAuDessus - Hauteur au-dessus du plan de jeu (le tapis).
 * @returns {Vector3}
 */
function surLaTable(emplacement, hauteurAuDessus) {
  return new Vector3(
    emplacement.x,
    HAUTEUR_PLAN_DE_JEU + hauteurAuDessus,
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

const boutonModele = new Bouton3D(CONFIG.bouton, {
  libelle: CONFIG.miniature.visibleAuDemarrage ? LIBELLES_MODELE.cacher : LIBELLES_MODELE.voir,
  dessinerIcone: dessinerOeil,
  surAppui: () => {
    const miniature = atelier.miniature;
    if (!miniature) {
      return;
    }
    miniature.visible = !miniature.visible;
    boutonModele.definirLibelle(miniature.visible ? LIBELLES_MODELE.cacher : LIBELLES_MODELE.voir);
  },
});
boutonModele.objet3D.position.copy(surLaTable(CONFIG.disposition.boutonModele, CONFIG.bouton.hauteur));
scene.add(boutonModele.objet3D);

// « Commencer » n'est visible que pendant la présentation du modèle.
const boutonCommencer = new Bouton3D(CONFIG.bouton, {
  libelle: 'Commencer',
  dessinerIcone: dessinerLecture,
  surAppui: () => partie.commencer(),
});
boutonCommencer.objet3D.position.copy(surLaTable(CONFIG.disposition.boutonCommencer, CONFIG.bouton.hauteur));
boutonCommencer.objet3D.visible = false;
scene.add(boutonCommencer.objet3D);

/**
 * Ramène le joueur au menu des modèles : en VR, on termine la session (la page
 * réaffiche alors l'accueil) ; sans casque, on quitte le mode souris.
 * https://developer.mozilla.org/fr/docs/Web/API/XRSession/end
 */
function revenirAuMenu() {
  const session = renderer.xr.getSession();
  if (session) {
    session.end().catch((erreur) => console.error('[main.revenirAuMenu] Fin de session impossible :', erreur));
  } else {
    modeSansCasque.desactiver();
  }
}

// « Menu » n'est visible qu'une fois le modèle terminé.
const boutonMenu = new Bouton3D(CONFIG.bouton, {
  libelle: 'Menu',
  dessinerIcone: dessinerMaison,
  surAppui: revenirAuMenu,
});
boutonMenu.objet3D.position.copy(surLaTable(CONFIG.disposition.boutonMenu, CONFIG.bouton.hauteur));
boutonMenu.objet3D.visible = false;
scene.add(boutonMenu.objet3D);

// Aide à l'emplacement : éteinte par défaut, la lampe l'allume ou l'éteint.
const aide = new AideEmplacement(CONFIG.aide);
const lampeAide = new LampeAide({
  surAppui: () => aide.basculer(tempsCourant),
  margeVisee: CONFIG.bouton.margeVisee,
});
lampeAide.objet3D.position.copy(surLaTable(CONFIG.disposition.lampeAide, 0));
scene.add(lampeAide.objet3D);

const boutons = [boutonAnnuler, boutonModele, boutonCommencer, boutonMenu, lampeAide];

const carte = new CarteProgression(CONFIG.carte);
scene.add(carte.objet3D);

/**
 * Réactions aux pincements, partagées par les mains (VR) et la souris (sans casque).
 * @type {import('./entrees/mains.js').EcouteursPincement}
 */
const ecouteursPincement = {
  surDebutPincement: (cote, point, options) => {
    // Un pincement sur un bouton visible l'active ; ailleurs, il saisit une brique.
    const boutonVise = boutons.find((bouton) => bouton.objet3D.visible && bouton.estVise(point));
    if (boutonVise) {
      boutonVise.appuyer(tempsCourant);
      sons.jouerSaisie();
    } else if (saisie.saisir(cote, point, options)) {
      sons.jouerSaisie();
    }
  },
  surFinPincement: (cote) => {
    const objetLache = saisie.relacher(cote);
    if (objetLache) {
      partie.surObjetRelache(objetLache);
    }
  },
};

const mains = new Mains(
  renderer,
  scene,
  CONFIG.mains,
  () => new DetecteurPincement(CONFIG.mains.pincement),
  ecouteursPincement,
);

const souris = new Souris({
  canevas: renderer.domElement,
  camera,
  scene,
  objetsTenus: () => saisie.objetsTenus(),
  ecouteurs: ecouteursPincement,
  hauteurCible: () => partie.hauteurPlaceCourante,
  reglages: CONFIG.souris,
});

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

/** Affiche la carte selon l'état de la partie et de l'aide. */
function rafraichirCarte() {
  const nom = atelier.modele?.nom ?? '';
  if (partie.estEnPresentation) {
    carte.afficherPresentation(nom);
  } else {
    carte.afficher(nom, partie.nombreBriquesPosees, partie.nombreBriques, {
      aideVisible: aide.estVisible(tempsCourant),
    });
  }
}

const maquette = new MaquetteFantome(CONFIG.grille, CONFIG.fantome);
const partie = new Partie({
  conteneurModele,
  scene,
  saisie,
  historique: new Historique(),
  maquette,
  positionReserve: surLaTable(CONFIG.disposition.reserve, 0),
  zoneTable,
  grille: CONFIG.grille,
  reglages: CONFIG.accrochage,
  reglagesChute: CONFIG.chute,
  surBriquePosee: () => sons.jouerAccrochage(),
  surModeleTermine: () => sons.jouerReussite(),
  surChangement: () => {
    boutonAnnuler.definirActif(partie.peutAnnuler);
    boutonCommencer.objet3D.visible = partie.estEnPresentation;
    boutonMenu.objet3D.visible = partie.estTerminee;
    rafraichirCarte();
  },
});

// Le bois se charge une seule fois ; sans lui, les pièces restent unies.
const texturesBois = await chargerBoisPeint(CONFIG.boisPeint).catch((erreur) => {
  console.error('[main] Textures du bois non chargées, pièces unies :', erreur);
  return null;
});

const atelier = new Atelier({
  scene,
  conteneurModele,
  partie,
  config: CONFIG,
  positionMiniature: surLaTable(CONFIG.disposition.miniature, 0),
  supportTable: { ...zoneTable, dessus: HAUTEUR_PLAN_DE_JEU },
  texturesBois,
  bordAvantPlanchette: -CONFIG.table.distanceJoueur + CONFIG.disposition.bordAvantPlanchette,
});

/**
 * Installe le modèle choisi sur la table (présentation, puis « Commencer »).
 * Appelé à chaque choix sur l'accueil et à chaque retour à l'accueil, pour
 * que la partie suivante reparte toujours de zéro.
 *
 * @param {string | null} url - Adresse du modèle choisi.
 */
function preparerModeleChoisi(url) {
  if (!url) {
    return;
  }
  atelier.preparer(url)
    .then(() => boutonModele.definirLibelle(LIBELLES_MODELE.voir))
    .catch((erreur) => {
      console.error('[main] Chargement du modèle impossible :', erreur);
      zoneMessage.textContent = 'Ce modèle n’a pas pu être chargé. Choisissez-en un autre ou rechargez la page.';
    });
}

const menu = new MenuModeles(document.getElementById('liste-modeles'), preparerModeleChoisi);

const modeSansCasque = new ModeSansCasque({
  panneauAccueil: document.querySelector('.panneau'),
  barreAide: document.getElementById('barre-aide'),
  boutonEssayer: document.getElementById('bouton-souris'),
  boutonRetour: document.getElementById('bouton-retour'),
}, souris, () => preparerModeleChoisi(menu.urlChoisie));

try {
  const familles = await chargerCatalogue(CONFIG.modele.catalogue);
  const adresses = familles.flatMap((famille) => famille.adresses);
  const modeles = await Promise.all(adresses.map(async (url) => ({ url, modele: await chargerModele(url) })));
  const modeleParAdresse = new Map(modeles.map(({ url, modele }) => [url, modele]));

  // Chaque famille, du modèle le plus court au plus long à construire.
  menu.afficher(familles.map((famille) => ({
    nom: famille.nom,
    entrees: trierParNombrePieces(famille.adresses.map((url) => {
      const modele = modeleParAdresse.get(url);
      return { url, nom: modele.nom, nombrePieces: modele.briques.length, description: modele.description };
    })),
  })));
  preparerModeleChoisi(menu.urlChoisie);

  // Vignettes du menu : chaque modèle terminé, photographié par le jeu.
  const vignettes = genererVignettes(modeles.map(({ url, modele }) => {
    const objet3D = creerMiniature({
      modele,
      places: calculerPositionsEnMetres(modele, CONFIG.grille),
      emprise: calculerEmprise(modele),
      config: CONFIG,
      texturesBois,
    });
    objet3D.scale.setScalar(1);
    objet3D.visible = true;
    return { url, objet3D };
  }));
  for (const [url, image] of vignettes) {
    menu.definirVignette(url, image);
  }
} catch (erreur) {
  console.error('[main] Chargement des modèles impossible :', erreur);
  zoneMessage.textContent = 'Les modèles n’ont pas pu être chargés. Rechargez la page pour réessayer.';
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
renderer.xr.addEventListener('sessionstart', () => {
  surveillant.reinitialiser();
  // En VR, ce sont les mains qui comptent : la souris est mise de côté.
  modeSansCasque.desactiver();
});
// Retour à l'accueil après la VR : la prochaine partie repart de zéro.
renderer.xr.addEventListener('sessionend', () => preparerModeleChoisi(menu.urlChoisie));

/** Étape suivie par l'aide (nombre de pièces posées), ou `null` hors étape. */
let etapeSuivie = null;
/** Dernier état affiché de l'aide (pour ne redessiner la carte qu'au changement). */
let aideEtaitVisible = false;

/**
 * Fait suivre l'aide aux étapes de la partie, règle le fondu du cadre et
 * l'état de la lampe. À appeler une fois par image.
 *
 * @param {number} temps - Instant courant, en ms.
 */
function mettreAJourAide(temps) {
  const etape = partie.estEnPresentation || partie.estTerminee ? null : partie.nombreBriquesPosees;
  if (etape !== etapeSuivie) {
    etapeSuivie = etape;
    if (etape === null) {
      aide.terminerEtape();
    } else {
      aide.nouvelleEtape(temps);
    }
  }
  const estVisible = aide.estVisible(temps);
  maquette.definirOpacite(aide.opacite(temps));
  lampeAide.definirAllumee(estVisible);
  if (estVisible !== aideEtaitVisible) {
    aideEtaitVisible = estVisible;
    rafraichirCarte();
  }
}

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
  souris.mettreAJour();
  const pointsDePincement = new Map([...mains.pointsDePincement, ...souris.pointsDePincement]);
  saisie.mettreAJour(pointsDePincement);
  partie.mettreAJour(temps);
  mettreAJourAide(temps);
  for (const bouton of boutons) {
    bouton.mettreAJour(pointsDePincement, temps);
  }
  renderer.render(scene, camera);
});

