/**
 * @file Déroulé du mode guidé : une brique à la fois.
 *
 * À chaque étape :
 *   1. la brique suivante attend dans la réserve, sur la table ;
 *   2. la maquette fantôme montre sa place sur la plaque de base ;
 *   3. lâchée près de sa place, la brique y glisse doucement et s'y fixe ;
 *      lâchée ailleurs, elle reste simplement là où elle est.
 * « Annuler » ramène doucement la dernière brique posée dans la réserve.
 */

import { Vector3 } from 'three';

import { estAPortee, adoucir, interpoler } from './accrochage.js';

/**
 * @typedef {object} Glissement
 * @property {import('./brique.js').Brique} brique - Brique en mouvement.
 * @property {Vector3} depart - Position de départ (repère de la scène).
 * @property {Vector3} arrivee - Position d'arrivée (repère de la scène).
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
   * @param {Vector3} dependances.positionReserve - Où attend la brique suivante (repère de la scène).
   * @param {typeof import('../config.js').CONFIG.accrochage} dependances.reglages - Distance et durée.
   * @param {() => void} dependances.surChangement - Appelé quand l'état change (ex. : bouton Annuler).
   */
  constructor({ conteneurModele, scene, saisie, historique, maquette, positionReserve, reglages, surChangement }) {
    this.conteneurModele = conteneurModele;
    this.scene = scene;
    this.saisie = saisie;
    this.historique = historique;
    this.maquette = maquette;
    this.positionReserve = positionReserve;
    this.reglages = reglages;
    this.surChangement = surChangement;

    /** @type {import('./brique.js').Brique[]} */
    this.briques = [];
    /** @type {Vector3[]} Places des briques, dans le repère du conteneur du modèle. */
    this.places = [];
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

  /**
   * Commence la construction d'un modèle.
   *
   * @param {import('./brique.js').Brique[]} briques - Briques dans l'ordre de construction.
   * @param {{ x: number, y: number, z: number }[]} places - Centre de chaque brique, repère du conteneur.
   */
  demarrer(briques, places) {
    this.briques = briques;
    this.places = places.map((place) => new Vector3(place.x, place.y, place.z));
    this.indiceEtape = 0;
    this.historique.vider();
    this.#preparerEtape();
  }

  /**
   * Appelé quand le joueur lâche un objet : accroche la brique si elle est
   * près de sa place, sinon la laisse où elle est.
   *
   * @param {object} objet - Objet lâché (renvoyé par la saisie).
   */
  surObjetRelache(objet) {
    const brique = this.briques[this.indiceEtape];
    if (objet !== brique || this.glissement) {
      return;
    }
    const place = this.#placeDansLaScene(this.indiceEtape);
    if (!estAPortee(brique.objet3D.position, place, this.reglages.distance)) {
      return;
    }

    const indice = this.indiceEtape;
    this.saisie.retirerObjet(brique);
    this.#lancerGlissement(brique, place, () => {
      this.historique.executer(this.#creerActionPoser(indice));
    });
  }

  /** Annule la dernière brique posée (si aucun mouvement n'est en cours). */
  annuler() {
    if (this.peutAnnuler) {
      this.historique.annuler();
    }
  }

  /**
   * Fait avancer le glissement en cours. À appeler une fois par image.
   *
   * @param {number} temps - Instant courant, en millisecondes.
   */
  mettreAJour(temps) {
    if (!this.glissement) {
      return;
    }
    const glissement = this.glissement;
    if (glissement.debut === null) {
      glissement.debut = temps;
    }
    const progression = adoucir((temps - glissement.debut) / this.reglages.dureeGlissement);
    const position = interpoler(glissement.depart, glissement.arrivee, progression);
    glissement.brique.objet3D.position.set(position.x, position.y, position.z);

    if (progression >= 1) {
      this.glissement = null;
      glissement.aLaFin();
      this.surChangement();
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
        this.#lancerGlissement(brique, this.positionReserve.clone(), () => {
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
    brique.objet3D.position.copy(this.positionReserve);
    this.saisie.ajouterObjet(brique);
    this.maquette.afficher(brique.description, this.places[this.indiceEtape]);
    this.surChangement();
  }

  /**
   * Démarre un glissement doux.
   *
   * @param {import('./brique.js').Brique} brique - Brique à déplacer.
   * @param {Vector3} arrivee - Destination (repère de la scène).
   * @param {() => void} aLaFin - Action une fois arrivée.
   */
  #lancerGlissement(brique, arrivee, aLaFin) {
    this.glissement = {
      brique,
      depart: brique.objet3D.position.clone(),
      arrivee,
      debut: null,
      aLaFin,
    };
    this.surChangement();
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
