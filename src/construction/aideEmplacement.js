/**
 * @file Aide à l'emplacement : quand montrer le cadre fantôme ?
 *
 * - Éteinte par défaut : le joueur cherche la place en regardant le modèle.
 * - Interrupteur (la lampe) : allume ou éteint l'aide, pour toutes les étapes.
 * - Coup de pouce : si la pièce n'est pas posée au bout d'un délai, l'aide
 *   s'allume d'elle-même pour cette étape. Si le joueur l'éteint ensuite,
 *   elle ne revient pas avant l'étape suivante.
 * - Apparition en fondu : aucun changement brusque.
 *
 * Logique pure (sans Three.js), testable avec `node --test`.
 */

/**
 * Décide de la visibilité du cadre fantôme au fil du temps.
 */
export class AideEmplacement {
  /** Aide allumée à la main (reste allumée d'une étape à l'autre). */
  #allumeeParJoueur = false;
  /** Coup de pouce refusé pour l'étape en cours (le joueur a éteint). */
  #eteinteParJoueur = false;
  /** @type {number | null} Début de l'étape en cours, ou `null` hors étape. */
  #debutEtape = null;
  /** @type {number} Instant où l'aide est devenue visible à la main. */
  #allumageManuel = 0;

  /**
   * @param {object} reglages
   * @param {number} reglages.delaiCoupDePouce - Délai avant le coup de pouce, en ms.
   * @param {number} reglages.dureeApparition - Durée du fondu d'apparition, en ms.
   */
  constructor(reglages) {
    this.reglages = reglages;
  }

  /** @returns {boolean} `true` si l'aide est allumée à la main (lampe). */
  get estAllumeeParJoueur() {
    return this.#allumeeParJoueur;
  }

  /**
   * Une nouvelle pièce est à poser : le délai du coup de pouce repart.
   *
   * @param {number} temps - Instant présent, en ms.
   */
  nouvelleEtape(temps) {
    this.#debutEtape = temps;
    this.#eteinteParJoueur = false;
  }

  /** Plus de pièce à poser (présentation, modèle terminé) : aide masquée. */
  terminerEtape() {
    this.#debutEtape = null;
  }

  /**
   * Appui sur l'interrupteur : éteint l'aide si elle est visible, l'allume sinon.
   *
   * @param {number} temps - Instant de l'appui, en ms.
   */
  basculer(temps) {
    if (this.estVisible(temps)) {
      this.#allumeeParJoueur = false;
      this.#eteinteParJoueur = true;
    } else {
      this.#allumeeParJoueur = true;
      this.#eteinteParJoueur = false;
      this.#allumageManuel = temps;
    }
  }

  /**
   * Indique si le cadre fantôme doit être montré.
   *
   * @param {number} temps - Instant présent, en ms.
   * @returns {boolean}
   */
  estVisible(temps) {
    return this.#instantApparition(temps) !== null;
  }

  /**
   * Opacité relative du cadre (0 = invisible, 1 = pleinement visible),
   * croissant doucement pendant le fondu d'apparition.
   *
   * @param {number} temps - Instant présent, en ms.
   * @returns {number}
   */
  opacite(temps) {
    const apparition = this.#instantApparition(temps);
    if (apparition === null) {
      return 0;
    }
    return Math.min(1, Math.max(0, (temps - apparition) / this.reglages.dureeApparition));
  }

  /**
   * Instant à partir duquel l'aide est visible, ou `null` si elle ne l'est pas.
   *
   * @param {number} temps - Instant présent, en ms.
   * @returns {number | null}
   */
  #instantApparition(temps) {
    if (this.#debutEtape === null || this.#eteinteParJoueur) {
      return null;
    }
    if (this.#allumeeParJoueur) {
      // Allumée pendant l'étape : fondu depuis l'appui ; sinon dès le début de l'étape.
      return Math.max(this.#allumageManuel, this.#debutEtape);
    }
    const coupDePouce = this.#debutEtape + this.reglages.delaiCoupDePouce;
    return temps >= coupDePouce ? coupDePouce : null;
  }
}
