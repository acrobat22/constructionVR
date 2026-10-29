/**
 * @file Carte de progression : nom du modèle et avancement, sans chrono.
 *
 * Panneau sombre opaque (contraste ≥ 7:1) placé derrière la table, face au
 * joueur. L'avancement est indiqué par du texte ET par une rangée de pastilles
 * (pleines = posées, vides = restantes) : jamais par la couleur seule.
 */

import * as THREE from 'three';

/** Couleurs (contrastes vérifiés dans styles/accueil.css). */
const COULEURS = Object.freeze({
  fond: '#111418',
  bordure: '#ffe98a',
  titre: '#ffffff',
  texte: '#ffe98a',
});

/** Aide affichée pendant la construction (le geste, en une phrase). */
const TEXTE_AIDE = 'Pincez le bloc et posez-le dans le cadre.';

/** Message affiché une fois le modèle terminé (positif, sans pression). */
const TEXTE_FELICITATIONS = 'Votre modèle est complet. Admirez-le !';

/** Explication affichée pendant la présentation du modèle (une phrase par ligne). */
const LIGNES_PRESENTATION = Object.freeze([
  'Prenez une pièce en pinçant le pouce et l’index,',
  'puis posez-la dans le cadre. Prenez tout votre temps.',
  'Quand vous le souhaitez, appuyez sur « Commencer ».',
]);

/** Pixels du canevas par mètre de panneau (netteté du texte). */
const PIXELS_PAR_METRE = 1800;

/** Nombre maximal de pastilles affichées (au-delà, seul le texte compte). */
const PASTILLES_MAXIMALES = 24;

/**
 * Panneau 3D affichant la progression de la construction.
 */
export class CarteProgression {
  /**
   * @param {typeof import('../config.js').CONFIG.carte} reglages - Taille et position.
   */
  constructor(reglages) {
    this.canevas = document.createElement('canvas');
    this.canevas.width = Math.round(reglages.largeur * PIXELS_PAR_METRE);
    this.canevas.height = Math.round(reglages.hauteur * PIXELS_PAR_METRE);
    this.texture = new THREE.CanvasTexture(this.canevas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    /** Panneau à ajouter à la scène. Non éclairé : couleurs exactes. */
    this.objet3D = new THREE.Mesh(
      new THREE.PlaneGeometry(reglages.largeur, reglages.hauteur),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false, transparent: true }),
    );
    this.objet3D.name = 'carte-progression';
    this.objet3D.position.set(reglages.position.x, reglages.position.y, reglages.position.z);
  }

  /**
   * Met à jour le contenu de la carte.
   *
   * @param {string} nomModele - Nom du modèle construit.
   * @param {number} briquesPosees - Nombre de briques déjà posées.
   * @param {number} totalBriques - Nombre total de briques.
   */
  afficher(nomModele, briquesPosees, totalBriques) {
    const contexte = this.#dessinerFond();
    const { width: largeur, height: hauteur } = this.canevas;
    const police = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    const gauche = 60;

    contexte.fillStyle = COULEURS.titre;
    contexte.font = `bold 84px ${police}`;
    contexte.fillText(nomModele, gauche, hauteur * 0.2);

    const estTermine = briquesPosees >= totalBriques;
    const texte = estTermine
      ? 'Bravo, c’est terminé !'
      : `Bloc ${briquesPosees + 1} sur ${totalBriques}`;
    contexte.fillStyle = COULEURS.texte;
    contexte.font = `bold 64px ${police}`;
    contexte.fillText(texte, gauche, hauteur * 0.4);

    // Aide permanente : le geste à faire, ou la suite une fois terminé.
    contexte.fillStyle = COULEURS.titre;
    contexte.font = `50px ${police}`;
    contexte.fillText(estTermine ? TEXTE_FELICITATIONS : TEXTE_AIDE, gauche, hauteur * 0.6, largeur - 2 * gauche);

    this.#dessinerPastilles(contexte, gauche, hauteur * 0.8, largeur - 2 * gauche, briquesPosees, totalBriques);
    this.texture.needsUpdate = true;
  }

  /**
   * Affiche la présentation du modèle à construire, avec l'explication du jeu.
   *
   * @param {string} nomModele - Nom du modèle (« Le voilier »).
   */
  afficherPresentation(nomModele) {
    const contexte = this.#dessinerFond();
    const { width: largeur, height: hauteur } = this.canevas;
    const police = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    const gauche = 60;
    // « Le voilier » → « Voici le voilier ! »
    const nomDansLaPhrase = nomModele.charAt(0).toLowerCase() + nomModele.slice(1);

    contexte.fillStyle = COULEURS.titre;
    contexte.font = `bold 80px ${police}`;
    contexte.fillText(`Voici ${nomDansLaPhrase} !`, gauche, hauteur * 0.2, largeur - 2 * gauche);

    contexte.fillStyle = COULEURS.texte;
    contexte.font = `43px ${police}`;
    LIGNES_PRESENTATION.forEach((ligne, indice) => {
      contexte.fillText(ligne, gauche, hauteur * (0.44 + indice * 0.19), largeur - 2 * gauche);
    });
    this.texture.needsUpdate = true;
  }

  /**
   * Efface la carte et dessine son fond (panneau sombre bordé).
   *
   * @returns {CanvasRenderingContext2D}
   */
  #dessinerFond() {
    const contexte = this.canevas.getContext('2d');
    const { width: largeur, height: hauteur } = this.canevas;
    const marge = 16;
    contexte.clearRect(0, 0, largeur, hauteur);
    contexte.fillStyle = COULEURS.fond;
    contexte.strokeStyle = COULEURS.bordure;
    contexte.lineWidth = 8;
    contexte.beginPath();
    contexte.roundRect(marge, marge, largeur - 2 * marge, hauteur - 2 * marge, 40);
    contexte.fill();
    contexte.stroke();
    contexte.textBaseline = 'middle';
    contexte.textAlign = 'left';
    return contexte;
  }

  /**
   * Dessine une pastille par brique : pleine si posée, contour seul sinon.
   *
   * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
   * @param {number} gauche - Abscisse de départ.
   * @param {number} centreY - Ordonnée du centre des pastilles.
   * @param {number} largeurDisponible - Largeur maximale de la rangée.
   * @param {number} posees - Briques posées.
   * @param {number} total - Total des briques.
   */
  #dessinerPastilles(contexte, gauche, centreY, largeurDisponible, posees, total) {
    if (total > PASTILLES_MAXIMALES) {
      return;
    }
    const pas = Math.min(56, largeurDisponible / total);
    const rayon = pas * 0.32;
    contexte.lineWidth = 5;
    contexte.strokeStyle = COULEURS.titre;
    contexte.fillStyle = COULEURS.titre;
    for (let indice = 0; indice < total; indice++) {
      contexte.beginPath();
      contexte.arc(gauche + rayon + indice * pas, centreY, rayon, 0, Math.PI * 2);
      if (indice < posees) {
        contexte.fill();
      } else {
        contexte.stroke();
      }
    }
  }
}
