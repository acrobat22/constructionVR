/**
 * @file Menu de choix du modèle sur la page d'accueil.
 *
 * Chaque modèle est une grande carte cliquable (image, nom, nombre de
 * pièces). Ce sont de vrais boutons radio, regroupés dans un `fieldset` :
 * utilisables au clavier (flèches) et annoncés par les lecteurs d'écran.
 * Le choix est signalé par une bordure épaisse ET une coche, jamais par la
 * couleur seule (voir styles/accueil.css).
 *
 * Les cartes sont rangées par famille (un titre par famille, précédé d'une
 * rangée de liens « Aller à »). Toutes restent dans un seul groupe de boutons
 * radio : les flèches du clavier passent d'une famille à l'autre.
 */

import { calculerPalierDuree, dessinerPoints } from '../modeles/duree.js';

/**
 * @typedef {object} EntreeMenu
 * @property {string} url - Adresse du fichier du modèle.
 * @property {string} nom - Nom affiché (« Le voilier »).
 * @property {number} nombrePieces - Nombre de pièces.
 * @property {string} [description] - Phrase de présentation (bulle d'aide).
 */

/**
 * @typedef {object} FamilleMenu
 * @property {string} nom - Nom de la famille (« Animaux »).
 * @property {EntreeMenu[]} entrees - Ses modèles, dans l'ordre d'affichage.
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
   * Affiche les liens « Aller à », puis une section par famille ; la toute
   * première carte est choisie par défaut.
   *
   * @param {FamilleMenu[]} familles - Familles de modèles, dans l'ordre d'affichage.
   */
  afficher(familles) {
    const sections = familles.map((famille, indice) => this.#creerSection(famille, `famille-modeles-${indice + 1}`, indice === 0));
    this.conteneur.replaceChildren(this.#creerLiensAllerA(familles), ...sections);
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
   * Crée la rangée de liens vers chaque famille (évite de faire défiler).
   *
   * @param {FamilleMenu[]} familles - Familles affichées.
   * @returns {HTMLElement}
   */
  #creerLiensAllerA(familles) {
    const navigation = document.createElement('nav');
    navigation.className = 'aller-a';
    navigation.setAttribute('aria-label', 'Aller à une famille de modèles');

    const intitule = document.createElement('span');
    intitule.className = 'aller-a-intitule';
    intitule.textContent = 'Aller à :';

    const liste = document.createElement('ul');
    familles.forEach((famille, indice) => {
      const lien = document.createElement('a');
      lien.href = `#famille-modeles-${indice + 1}`;
      lien.textContent = famille.nom;
      const element = document.createElement('li');
      element.append(lien);
      liste.append(element);
    });

    navigation.append(intitule, liste);
    return navigation;
  }

  /**
   * Crée la section d'une famille : son titre puis la grille de ses cartes.
   *
   * @param {FamilleMenu} famille - Famille à présenter.
   * @param {string} identifiant - Identifiant de la section (cible des liens).
   * @param {boolean} premiereFamille - La première carte de cette famille est cochée.
   * @returns {HTMLElement}
   */
  #creerSection(famille, identifiant, premiereFamille) {
    const section = document.createElement('section');
    section.className = 'famille-modeles';
    section.id = identifiant;
    section.setAttribute('aria-labelledby', `${identifiant}-titre`);

    const titre = document.createElement('h3');
    titre.id = `${identifiant}-titre`;
    titre.className = 'famille-modeles-titre';
    const compte = document.createElement('span');
    compte.className = 'famille-modeles-compte';
    const nombre = famille.entrees.length;
    compte.textContent = `${nombre} modèle${nombre > 1 ? 's' : ''}`;
    titre.append(`${famille.nom} `, compte);

    const grille = document.createElement('div');
    grille.className = 'grille-modeles';
    grille.append(...famille.entrees.map((entree, indice) => this.#creerCarte(entree, premiereFamille && indice === 0)));

    section.append(titre, grille);
    return section;
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

    // Durée en mots ; les points ne sont qu'un repère visuel (non lus).
    const palier = calculerPalierDuree(entree.nombrePieces);
    const duree = document.createElement('span');
    duree.className = 'carte-modele-duree';
    const points = document.createElement('span');
    points.className = 'carte-modele-points';
    points.setAttribute('aria-hidden', 'true');
    points.textContent = dessinerPoints(palier);
    duree.append(points, ` ${palier.libelle}`);

    carte.append(choix, image, nom, pieces, duree);
    return carte;
  }
}
