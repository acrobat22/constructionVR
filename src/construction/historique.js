/**
 * @file Historique des actions, pour le bouton « Annuler ».
 *
 * Toute action annulable respecte la même forme : `executer()` et
 * `annuler()`. L'historique les traite donc toutes de la même façon.
 */

/**
 * @typedef {object} ActionAnnulable
 * @property {() => void} executer - Applique l'action.
 * @property {() => void} annuler - Défait l'action.
 */

/**
 * Pile des actions effectuées, la plus récente en dernier.
 */
export class Historique {
  /** @type {ActionAnnulable[]} */
  #actions = [];

  /** @returns {boolean} `true` s'il reste au moins une action à annuler. */
  get peutAnnuler() {
    return this.#actions.length > 0;
  }

  /**
   * Applique une action et la mémorise.
   *
   * @param {ActionAnnulable} action - Action à exécuter.
   */
  executer(action) {
    action.executer();
    this.#actions.push(action);
  }

  /**
   * Défait la dernière action.
   *
   * @returns {boolean} `true` si une action a été annulée.
   */
  annuler() {
    const derniereAction = this.#actions.pop();
    if (!derniereAction) {
      return false;
    }
    derniereAction.annuler();
    return true;
  }

  /** Oublie toutes les actions (par exemple au début d'un nouveau modèle). */
  vider() {
    this.#actions = [];
  }
}
