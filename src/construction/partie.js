/**
 * @file Déroulé du mode guidé : une brique à la fois.
 *
 * À chaque étape :
 *   1. la brique suivante attend dans la réserve, sur la table ;
 *   2. la maquette fantôme montre sa place sur la plaque de base ;
 *   3. lâchée près de sa place, la brique y glisse doucement et s'y fixe ;
 *      lâchée ailleurs, elle descend doucement se poser là où elle est
 *      (sur la table, la plaque ou une autre brique) ; lâchée hors de la
 *      table, elle revient doucement dans la réserve (jamais par terre).
 * « Annuler » ramène doucement la dernière brique posée dans la réserve.
 */

import { Vector3 } from 'three';

import { estAPortee, adoucir, interpoler } from './accrochage.js';
import { calculerRepos, RESULTAT_REPOS } from './supports.js';

/**
 * @typedef {object} Glissement
 * @property {import('./brique.js').Brique} brique - Brique en mouvement.
 * @property {Vector3} depart - Position de départ (repère de la scène).
 * @property {Vector3} arrivee - Position d'arrivée (repère de la scène).
 * @property {number} duree - Durée du mouvement, en millisecondes.
 * @property {number | null} debut - Instant de départ (fixé à la première image).
 * @property {() => void} aLaFin - Action à exécuter une fois arrivée.
 */

/**
 * Orchestre la construction guidée d'un modèle.
 */
export class Partie {
  /**
   * @param {object} dependances
   * @param {import('three').Object3D} dependances.conteneurModele - Groupe posé sur la table,
   *   origine au centre de la plaque de base (dessus de la plaque à y = 0).
   * @param {import('three').Object3D} dependances.scene - Scène où vivent les briques libres.
   * @param {import('./saisie.js').GestionnaireSaisie} dependances.saisie - Saisie par pincement.
   * @param {import('./historique.js').Historique} dependances.historique - Pile d'annulation.
   * @param {import('./maquetteFantome.js').MaquetteFantome} dependances.maquette - Emplacement visé.
   * @param {Vector3} dependances.positionReserve - Point de la table où attend la pièce suivante
   *   (dessus du plateau, repère de la scène) ; la pièce y est posée selon sa hauteur.
   * @param {import('./supports.js').Emprise} dependances.zoneTable - Plateau de la table (repère de la scène).
   * @param {typeof import('../config.js').CONFIG.grille} dependances.grille - Dimensions de la grille.
   * @param {typeof import('../config.js').CONFIG.accrochage} dependances.reglages - Distance et durée.
   * @param {typeof import('../config.js').CONFIG.chute} dependances.reglagesChute - Durée de la chute douce.
   * @param {() => void} dependances.surChangement - Appelé quand l'état change (bouton, carte…).
   * @param {() => void} [dependances.surBriquePosee] - Appelé quand une brique se fixe à sa place.
   * @param {() => void} [dependances.surModeleTermine] - Appelé quand la dernière brique est posée.
   */
  constructor({
    conteneurModele, scene, saisie, historique, maquette,
    positionReserve, zoneTable, grille, reglages, reglagesChute, surChangement,
    surBriquePosee = () => {}, surModeleTermine = () => {},
  }) {
    this.surBriquePosee = surBriquePosee;
    this.surModeleTermine = surModeleTermine;
    this.conteneurModele = conteneurModele;
    this.scene = scene;
    this.saisie = saisie;
    this.historique = historique;
    this.maquette = maquette;
    this.positionReserve = positionReserve;
    this.zoneTable = zoneTable;
    this.grille = grille;
    this.reglages = reglages;
    this.reglagesChute = reglagesChute;
    this.surChangement = surChangement;

    /** @type {import('./brique.js').Brique[]} */
    this.briques = [];
    /** @type {Vector3[]} Places des briques, dans le repère du conteneur du modèle. */
    this.places = [];
    /** @type {import('./supports.js').Support[]} Surfaces fixes (table, plaque). */
    this.supportsFixes = [];
    this.indiceEtape = 0;
    /** @type {Glissement | null} */
    this.glissement = null;

    this.conteneurModele.add(this.maquette.objet3D);
  }

  /** @returns {boolean} `true` si une annulation est possible maintenant. */
  get peutAnnuler() {
    return this.historique.peutAnnuler && this.glissement === null;
  }

  /** @returns {boolean} `true` quand toutes les briques sont posées. */
  get estTerminee() {
    return this.indiceEtape >= this.briques.length;
  }

  /** @returns {number} Nombre de briques déjà posées à leur place. */
  get nombreBriquesPosees() {
    return this.indiceEtape;
  }

  /** @returns {number} Nombre total de briques du modèle. */
  get nombreBriques() {
    return this.briques.length;
  }

  /**
   * Commence la construction d'un modèle.
   *
   * @param {import('./brique.js').Brique[]} briques - Briques dans l'ordre de construction.
   * @param {{ x: number, y: number, z: number }[]} places - Centre de chaque brique, repère du conteneur.
   * @param {import('./supports.js').Support[]} supportsFixes - Surfaces fixes (table, plaque), repère de la scène.
   */
  demarrer(briques, places, supportsFixes) {
    this.briques = briques;
    this.places = places.map((place) => new Vector3(place.x, place.y, place.z));
    this.supportsFixes = supportsFixes;
    this.indiceEtape = 0;
    this.historique.vider();
    this.#preparerEtape();
  }

  /**
   * Appelé quand le joueur lâche un objet : accroche la brique si elle est
   * près de sa place, sinon la pose doucement (ou la ramène à la réserve).
   *
   * @param {object} objet - Objet lâché (renvoyé par la saisie).
   */
  surObjetRelache(objet) {
    const brique = this.briques[this.indiceEtape];
    if (objet !== brique || this.glissement) {
      return;
    }
    const indice = this.indiceEtape;
    const place = this.#placeDansLaScene(indice);
    // Pendant tout mouvement automatique, la brique ne peut pas être saisie.
    this.saisie.retirerObjet(brique);

    if (estAPortee(brique.objet3D.position, place, this.reglages.distance)) {
      this.#lancerGlissement(brique, place, this.reglages.dureeGlissement, () => {
        this.historique.executer(this.#creerActionPoser(indice));
      });
      return;
    }

    const repos = calculerRepos(this.#emprise(brique, brique.objet3D.position), this.#supports(), this.zoneTable);
    const redevenirSaisissable = () => this.saisie.ajouterObjet(brique);
    if (repos.resultat === RESULTAT_REPOS.RESERVE) {
      this.#lancerGlissement(brique, this.#positionReserve(brique), this.reglages.dureeGlissement, redevenirSaisissable);
      return;
    }
    const arrivee = brique.objet3D.position.clone();
    arrivee.y = repos.hauteur + brique.hauteur / 2;
    const hauteurDeChute = Math.max(0, brique.objet3D.position.y - arrivee.y);
    const duree = this.reglagesChute.dureeMinimale + hauteurDeChute * this.reglagesChute.dureeParMetre;
    this.#lancerGlissement(brique, arrivee, duree, redevenirSaisissable);
  }

  /** Annule la dernière brique posée (si aucun mouvement n'est en cours). */
  annuler() {
    if (this.peutAnnuler) {
      this.historique.annuler();
    }
  }

  /**
   * Fait avancer le mouvement en cours et met à jour les ombres de contact.
   * À appeler une fois par image.
   *
   * @param {number} temps - Instant courant, en millisecondes.
   */
  mettreAJour(temps) {
    if (this.glissement) {
      const glissement = this.glissement;
      if (glissement.debut === null) {
        glissement.debut = temps;
      }
      const progression = adoucir((temps - glissement.debut) / glissement.duree);
      const position = interpoler(glissement.depart, glissement.arrivee, progression);
      glissement.brique.objet3D.position.set(position.x, position.y, position.z);

      if (progression >= 1) {
        this.glissement = null;
        glissement.aLaFin();
        this.surChangement();
      }
    }

    // L'ombre de contact n'apparaît que sous une brique posée.
    for (const brique of this.briques) {
      const estEnMouvement = this.glissement?.brique === brique || this.saisie.estTenu(brique);
      brique.definirAuRepos(!estEnMouvement);
    }
  }

  /**
   * Crée l'action annulable « poser la brique n° indice ».
   *
   * @param {number} indice - Numéro de la brique dans l'ordre de construction.
   * @returns {import('./historique.js').ActionAnnulable}
   */
  #creerActionPoser(indice) {
    return {
      executer: () => {
        const brique = this.briques[indice];
        // La brique devient partie du modèle : elle suit le conteneur.
        this.conteneurModele.add(brique.objet3D);
        brique.objet3D.position.copy(this.places[indice]);
        this.indiceEtape = indice + 1;
        this.#preparerEtape();
        this.surBriquePosee();
        if (this.estTerminee) {
          this.surModeleTermine();
        }
      },
      annuler: () => {
        // La brique suivante, qui attendait dans la réserve, est rangée.
        const briqueSuivante = this.briques[indice + 1];
        if (briqueSuivante) {
          this.saisie.retirerObjet(briqueSuivante);
          briqueSuivante.objet3D.removeFromParent();
        }
        // La brique posée revient doucement dans la réserve.
        const brique = this.briques[indice];
        const depart = this.#placeDansLaScene(indice);
        this.scene.add(brique.objet3D);
        brique.objet3D.position.copy(depart);
        this.indiceEtape = indice;
        this.maquette.afficher(brique.description, this.places[indice]);
        this.#lancerGlissement(brique, this.#positionReserve(brique), this.reglages.dureeGlissement, () => {
          this.saisie.ajouterObjet(brique);
        });
      },
    };
  }

  /** Met en place l'étape courante : brique dans la réserve et emplacement visible. */
  #preparerEtape() {
    if (this.estTerminee) {
      this.maquette.masquer();
      this.surChangement();
      return;
    }
    const brique = this.briques[this.indiceEtape];
    this.scene.add(brique.objet3D);
    brique.objet3D.position.copy(this.#positionReserve(brique));
    this.saisie.ajouterObjet(brique);
    this.maquette.afficher(brique.description, this.places[this.indiceEtape]);
    this.surChangement();
  }

  /**
   * Démarre un mouvement doux.
   *
   * @param {import('./brique.js').Brique} brique - Brique à déplacer.
   * @param {Vector3} arrivee - Destination (repère de la scène).
   * @param {number} duree - Durée, en millisecondes.
   * @param {() => void} aLaFin - Action une fois arrivée.
   */
  #lancerGlissement(brique, arrivee, duree, aLaFin) {
    this.glissement = {
      brique,
      depart: brique.objet3D.position.clone(),
      arrivee,
      duree,
      debut: null,
      aLaFin,
    };
    this.surChangement();
  }

  /**
   * Surfaces sur lesquelles une brique lâchée peut se poser : surfaces fixes
   * et dessus des briques déjà posées.
   *
   * @returns {import('./supports.js').Support[]}
   */
  #supports() {
    // Toutes les pièces posées arrêtent la chute, même courbes : une pièce
    // lâchée ne doit jamais en traverser une autre.
    const supportsBriques = this.briques.slice(0, this.indiceEtape).map((brique, indice) => {
      const centre = this.#placeDansLaScene(indice);
      return { ...this.#emprise(brique, centre), dessus: centre.y + brique.hauteur / 2 };
    });
    return [...this.supportsFixes, ...supportsBriques];
  }

  /**
   * Position d'une pièce posée dans la réserve (centre, selon sa hauteur).
   *
   * @param {import('./brique.js').Brique} brique - Pièce à placer.
   * @returns {Vector3}
   */
  #positionReserve(brique) {
    return this.positionReserve.clone().setY(this.positionReserve.y + brique.hauteur / 2);
  }

  /**
   * Emprise horizontale d'une brique centrée en un point (repère de la scène).
   *
   * @param {import('./brique.js').Brique} brique - Brique concernée.
   * @param {Vector3} centre - Centre de la brique.
   * @returns {import('./supports.js').Emprise}
   */
  #emprise(brique, centre) {
    const demiLargeur = (brique.description.largeur * this.grille.pas) / 2;
    const demiProfondeur = (brique.description.profondeur * this.grille.pas) / 2;
    return {
      minX: centre.x - demiLargeur,
      maxX: centre.x + demiLargeur,
      minZ: centre.z - demiProfondeur,
      maxZ: centre.z + demiProfondeur,
    };
  }

  /**
   * Position d'une place dans le repère de la scène.
   *
   * @param {number} indice - Numéro de la brique.
   * @returns {Vector3}
   */
  #placeDansLaScene(indice) {
    this.conteneurModele.updateWorldMatrix(true, false);
    return this.conteneurModele.localToWorld(this.places[indice].clone());
  }
}
