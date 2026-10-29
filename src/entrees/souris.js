/**
 * @file Souris en remplacement des mains, pour essayer le jeu sans casque.
 *
 * Fournit la même interface que `Mains` (début / fin de pincement, points de
 * pincement), le reste du jeu n'a donc pas besoin de savoir d'où vient le geste :
 *   - clic gauche enfoncé = pincer ;
 *   - glisser = déplacer ;
 *   - relâcher = lâcher.
 *
 * Le point suit la surface visée sous le curseur (table, plaque, brique…).
 * Pendant une prise, il est légèrement surélevé pour que la brique tenue
 * survole la surface au lieu de la traverser.
 */

import { Raycaster, Vector2, Vector3 } from 'three';

/** Côté attribué à la souris (une seule « main »). */
const COTE_SOURIS = 'right';

/** Noms des objets que le curseur traverse (décor, aides visuelles). */
const NOMS_IGNORES = new Set(['piece', 'maquette-fantome', 'carte-progression', 'ombre-contact', 'lampe']);

/**
 * Pilote le pincement à la souris sur le canevas.
 */
export class Souris {
  /**
   * @param {object} dependances
   * @param {HTMLCanvasElement} dependances.canevas - Canevas du rendu.
   * @param {import('three').Camera} dependances.camera - Caméra de l'aperçu.
   * @param {import('three').Scene} dependances.scene - Scène visée par le curseur.
   * @param {() => import('three').Object3D[]} dependances.objetsTenus - Objets à ignorer (tenus).
   * @param {import('./mains.js').EcouteursPincement} dependances.ecouteurs - Fonctions appelées lors des pincements.
   * @param {{ hauteurLevee: number }} dependances.reglages - Surélévation pendant une prise.
   */
  constructor({ canevas, camera, scene, objetsTenus, ecouteurs, reglages }) {
    this.canevas = canevas;
    this.camera = camera;
    this.scene = scene;
    this.objetsTenus = objetsTenus;
    this.ecouteurs = ecouteurs;
    this.reglages = reglages;

    this.estActive = false;
    this.estEnfoncee = false;
    /** Position du curseur en coordonnées normalisées (-1 à 1), ou `null` hors du canevas. */
    this.positionCurseur = null;
    this.point = new Vector3();
    this.pointEstValide = false;
    this.lanceurDeRayon = new Raycaster();

    // Fonctions liées une fois pour pouvoir retirer les écouteurs.
    this.surDeplacement = this.#surDeplacement.bind(this);
    this.surAppui = this.#surAppui.bind(this);
    this.surRelachement = this.#surRelachement.bind(this);
    this.surSortie = this.#surSortie.bind(this);
  }

  /**
   * Points de pincement à cette image (au plus un : celui de la souris).
   *
   * @returns {Map<XRHandedness, Vector3>}
   */
  get pointsDePincement() {
    return this.estActive && this.pointEstValide
      ? new Map([[COTE_SOURIS, this.point]])
      : new Map();
  }

  /** Commence à écouter la souris. */
  activer() {
    if (this.estActive) {
      return;
    }
    this.estActive = true;
    this.canevas.style.cursor = 'grab';
    this.canevas.addEventListener('pointermove', this.surDeplacement);
    this.canevas.addEventListener('pointerdown', this.surAppui);
    this.canevas.addEventListener('pointerup', this.surRelachement);
    this.canevas.addEventListener('pointercancel', this.surRelachement);
    this.canevas.addEventListener('pointerleave', this.surSortie);
  }

  /** Arrête d'écouter la souris (en relâchant une éventuelle prise). */
  desactiver() {
    if (!this.estActive) {
      return;
    }
    this.#terminerPincement();
    this.estActive = false;
    this.positionCurseur = null;
    this.pointEstValide = false;
    this.canevas.style.cursor = '';
    this.canevas.removeEventListener('pointermove', this.surDeplacement);
    this.canevas.removeEventListener('pointerdown', this.surAppui);
    this.canevas.removeEventListener('pointerup', this.surRelachement);
    this.canevas.removeEventListener('pointercancel', this.surRelachement);
    this.canevas.removeEventListener('pointerleave', this.surSortie);
  }

  /**
   * Recalcule le point visé (les objets bougent même si la souris est immobile).
   * À appeler une fois par image, avant la logique de saisie.
   */
  mettreAJour() {
    this.pointEstValide = false;
    if (!this.estActive || this.positionCurseur === null) {
      return;
    }
    this.lanceurDeRayon.setFromCamera(this.positionCurseur, this.camera);
    const ignores = new Set(this.objetsTenus());
    const impact = this.lanceurDeRayon
      .intersectObject(this.scene, true)
      .find((intersection) => !this.#estIgnore(intersection.object, ignores));
    if (!impact) {
      return;
    }
    this.point.copy(impact.point);
    if (this.estEnfoncee) {
      this.point.y += this.reglages.hauteurLevee;
    }
    this.pointEstValide = true;
  }

  /**
   * Indique si un objet (ou l'un de ses parents) doit être traversé par le curseur.
   *
   * @param {import('three').Object3D} objet - Objet touché.
   * @param {Set<import('three').Object3D>} ignores - Objets tenus.
   * @returns {boolean}
   */
  #estIgnore(objet, ignores) {
    for (let courant = objet; courant; courant = courant.parent) {
      if (ignores.has(courant) || NOMS_IGNORES.has(courant.name) || !courant.visible) {
        return true;
      }
    }
    return false;
  }

  /**
   * Mémorise la position du curseur en coordonnées normalisées.
   *
   * @param {PointerEvent} evenement - Événement de pointeur.
   */
  #surDeplacement(evenement) {
    const rectangle = this.canevas.getBoundingClientRect();
    this.positionCurseur = new Vector2(
      ((evenement.clientX - rectangle.left) / rectangle.width) * 2 - 1,
      -((evenement.clientY - rectangle.top) / rectangle.height) * 2 + 1,
    );
  }

  /**
   * Clic gauche enfoncé : début de pincement au point visé.
   *
   * @param {PointerEvent} evenement - Événement de pointeur.
   */
  #surAppui(evenement) {
    if (evenement.button !== 0) {
      return;
    }
    this.#surDeplacement(evenement);
    this.mettreAJour();
    if (!this.pointEstValide) {
      return;
    }
    // Garde le relâchement même si le curseur sort du canevas.
    this.canevas.setPointerCapture(evenement.pointerId);
    this.estEnfoncee = true;
    this.canevas.style.cursor = 'grabbing';
    this.ecouteurs.surDebutPincement(COTE_SOURIS, this.point);
  }

  /**
   * Clic relâché : fin de pincement.
   *
   * @param {PointerEvent} evenement - Événement de pointeur.
   */
  #surRelachement(evenement) {
    if (this.canevas.hasPointerCapture(evenement.pointerId)) {
      this.canevas.releasePointerCapture(evenement.pointerId);
    }
    this.#terminerPincement();
  }

  /** Curseur sorti du canevas : plus de point visé (sauf pendant une prise). */
  #surSortie() {
    if (!this.estEnfoncee) {
      this.positionCurseur = null;
    }
  }

  /** Signale la fin d'un pincement en cours, s'il y en a un. */
  #terminerPincement() {
    if (!this.estEnfoncee) {
      return;
    }
    this.estEnfoncee = false;
    this.canevas.style.cursor = 'grab';
    this.ecouteurs.surFinPincement(COTE_SOURIS);
  }
}
