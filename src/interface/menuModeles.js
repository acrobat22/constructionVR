/**
 * @file Menu de choix du modèle sur la page d'accueil.
 *
 * Chaque modèle est une grande carte cliquable (image, nom, nombre de
 * pièces). Ce sont de vrais boutons radio, regroupés dans un `fieldset` :
 * utilisables au clavier (flèches) et annoncés par les lecteurs d'écran.
 * Le choix est signalé par une bordure épaisse ET une coche, jamais par la
 * couleur seule (voir styles/accueil.css).
 */

/**
 * @typedef {object} EntreeMenu
 * @property {string} url - Adresse du fichier du modèle.
 * @property {string} nom - Nom affiché (« Le voilier »).
 * @property {number} nombrePieces - Nombre de pièces.
 * @property {string} [description] - Phrase de présentation (bulle d'aide).
 */

/** Nom du groupe de boutons radio. */
const NOM_GROUPE = 'modele';

/**
 * Construit et gère la liste des cartes de modèles.
 */
export class MenuModeles {
  /**
   * @param {HTMLElement} conteneur - Élément qui reçoit les cartes.
   * @param {(url: string) => void} surChoix - Appelé quand le joueur choisit un modèle.
   */
  constructor(conteneur, surChoix) {
    this.conteneur = conteneur;
    this.surChoix = surChoix;
    /** @type {Map<string, HTMLImageElement>} Images des cartes, par adresse de modèle. */
    this.images = new Map();
  }

  /** @returns {string | null} Adresse du modèle choisi. */
  get urlChoisie() {
    return this.conteneur.querySelector(`input[name="${NOM_GROUPE}"]:checked`)?.value ?? null;
  }

  /**
   * Affiche les cartes ; la première est choisie par défaut.
   *
   * @param {EntreeMenu[]} entrees - Modèles proposés, dans l'ordre.
   */
  afficher(entrees) {
    this.conteneur.replaceChildren(...entrees.map((entree, indice) => this.#creerCarte(entree, indice === 0)));
  }

  /**
   * Remplace l'image d'attente d'une carte par la vignette du modèle.
   *
   * @param {string} url - Adresse du modèle.
   * @param {string} image - Image (adresse ou `data:`).
   */
  definirVignette(url, image) {
    const element = this.images.get(url);
    if (element) {
      element.src = image;
      element.hidden = false;
    }
  }

  /**
   * Crée la carte d'un modèle.
   *
   * @param {EntreeMenu} entree - Modèle à présenter.
   * @param {boolean} estChoisie - Carte cochée au départ.
   * @returns {HTMLLabelElement}
   */
  #creerCarte(entree, estChoisie) {
    const carte = document.createElement('label');
    carte.className = 'carte-modele';
    if (entree.description) {
      carte.title = entree.description;
    }

    const choix = document.createElement('input');
    choix.type = 'radio';
    choix.name = NOM_GROUPE;
    choix.value = entree.url;
    choix.checked = estChoisie;
    choix.className = 'visuellement-cache';
    choix.addEventListener('change', () => {
      if (choix.checked) {
        this.surChoix(entree.url);
      }
    });

    // Image décorative : le nom du modèle est donné juste en dessous.
    const image = document.createElement('img');
    image.alt = '';
    image.hidden = true;
    image.width = 320;
    image.height = 240;
    this.images.set(entree.url, image);

    const nom = document.createElement('span');
    nom.className = 'carte-modele-nom';
    nom.textContent = entree.nom;

    const pieces = document.createElement('span');
    pieces.className = 'carte-modele-pieces';
    pieces.textContent = `${entree.nombrePieces} pièces`;

    carte.append(choix, image, nom, pieces);
    return carte;
  }
}
