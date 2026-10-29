/**
 * @file Bouton « Annuler » en 3D, posé sur la table et toujours visible.
 *
 * On l'active en pinçant à proximité. Retours visuels :
 *   - survol : bordure épaisse jaune pâle (en plus d'un changement de couleur) ;
 *   - appui : le bouton s'enfonce brièvement ;
 *   - inactif (rien à annuler) : texte gris et bordure pointillée, mais toujours affiché.
 *
 * Le libellé est dessiné sur un canevas : aucune police ni image externe.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Couleurs du libellé (contrastes ≥ 7:1 sur le fond sombre, voir styles/accueil.css). */
const COULEURS = Object.freeze({
  fond: '#111418',
  texteActif: '#ffffff',
  texteInactif: '#c8ccd4',
  bordureSurvol: '#ffe98a',
  bordureRepos: '#ffffff',
});

/** Résolution du canevas du libellé (rapport 2:1, comme le bouton). */
const LARGEUR_CANEVAS = 512;
const HAUTEUR_CANEVAS = 256;

/**
 * Bouton 3D « Annuler ».
 */
export class BoutonAnnuler {
  /**
   * @param {typeof import('../config.js').CONFIG.boutonAnnuler} reglages - Dimensions et réglages.
   * @param {() => void} surAppui - Action déclenchée par un appui sur le bouton actif.
   */
  constructor(reglages, surAppui) {
    this.reglages = reglages;
    this.surAppui = surAppui;

    this.estActif = false;
    this.estSurvole = false;
    /** Instant du dernier appui (pour l'animation d'enfoncement), ou `null`. */
    this.debutAppui = null;

    this.canevas = document.createElement('canvas');
    this.canevas.width = LARGEUR_CANEVAS;
    this.canevas.height = HAUTEUR_CANEVAS;
    this.texture = new THREE.CanvasTexture(this.canevas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    /** Groupe incliné vers le joueur, à placer sur la table. */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'bouton-annuler';
    this.objet3D.rotation.x = reglages.inclinaison;

    /** Partie mobile (socle + libellé), enfoncée lors de l'appui. */
    this.partieMobile = new THREE.Group();
    this.objet3D.add(this.partieMobile);

    const socle = new THREE.Mesh(
      new RoundedBoxGeometry(reglages.largeur, reglages.hauteur, reglages.profondeur, 3, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x1b1f26, roughness: 0.5 }),
    );
    socle.castShadow = true;
    this.partieMobile.add(socle);

    // Libellé non éclairé : ses couleurs restent exactes (contraste garanti).
    const libelle = new THREE.Mesh(
      new THREE.PlaneGeometry(reglages.largeur * 0.94, reglages.profondeur * 0.9),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
    );
    libelle.rotation.x = -Math.PI / 2;
    libelle.position.y = reglages.hauteur / 2 + 0.0005;
    this.partieMobile.add(libelle);

    /** Boîte de visée réutilisée à chaque test. */
    this.zoneVisee = new THREE.Box3();

    this.#dessinerLibelle();
  }

  /**
   * Active ou désactive le bouton (il reste toujours visible).
   *
   * @param {boolean} estActif - `true` s'il y a quelque chose à annuler.
   */
  definirActif(estActif) {
    if (estActif !== this.estActif) {
      this.estActif = estActif;
      this.#dessinerLibelle();
    }
  }

  /**
   * Indique si un point de pincement vise le bouton (zone élargie par une marge).
   *
   * @param {THREE.Vector3} point - Point de pincement (coordonnées de la scène).
   * @returns {boolean}
   */
  estVise(point) {
    return this.zoneVisee
      .setFromObject(this.objet3D)
      .expandByScalar(this.reglages.margeVisee)
      .containsPoint(point);
  }

  /**
   * Appui sur le bouton : animation d'enfoncement et action, si le bouton est actif.
   *
   * @param {number} temps - Instant de l'appui, en millisecondes.
   */
  appuyer(temps) {
    if (!this.estActif) {
      return;
    }
    this.debutAppui = temps;
    this.surAppui();
  }

  /**
   * Met à jour le survol et l'animation d'appui. À appeler une fois par image.
   *
   * @param {Map<XRHandedness, THREE.Vector3>} pointsDePincement - Points des mains suivies.
   * @param {number} temps - Instant courant, en millisecondes.
   */
  mettreAJour(pointsDePincement, temps) {
    const estSurvole = [...pointsDePincement.values()].some((point) => this.estVise(point));
    if (estSurvole !== this.estSurvole) {
      this.estSurvole = estSurvole;
      this.#dessinerLibelle();
    }

    // Enfoncement bref : descend puis remonte (forme en cloche, sans à-coup).
    let enfoncement = 0;
    if (this.debutAppui !== null) {
      const progression = (temps - this.debutAppui) / this.reglages.dureeAppui;
      if (progression >= 1 || progression < 0) {
        this.debutAppui = null;
      } else {
        enfoncement = Math.sin(progression * Math.PI) * this.reglages.enfoncement;
      }
    }
    this.partieMobile.position.y = -enfoncement;
  }

  /** Redessine le libellé selon l'état (actif, survolé). */
  #dessinerLibelle() {
    const contexte = this.canevas.getContext('2d');
    const marge = 14;
    const rayon = 36;

    contexte.clearRect(0, 0, LARGEUR_CANEVAS, HAUTEUR_CANEVAS);
    contexte.fillStyle = COULEURS.fond;
    contexte.beginPath();
    contexte.roundRect(marge, marge, LARGEUR_CANEVAS - 2 * marge, HAUTEUR_CANEVAS - 2 * marge, rayon);
    contexte.fill();

    // Bordure : épaisse au survol, fine au repos, pointillée si inactif.
    const survolActif = this.estSurvole && this.estActif;
    contexte.lineWidth = survolActif ? 18 : 8;
    contexte.strokeStyle = survolActif ? COULEURS.bordureSurvol : COULEURS.bordureRepos;
    contexte.setLineDash(this.estActif ? [] : [24, 18]);
    if (!this.estActif) {
      contexte.strokeStyle = COULEURS.texteInactif;
    }
    contexte.stroke();
    contexte.setLineDash([]);

    const couleurTexte = this.estActif ? COULEURS.texteActif : COULEURS.texteInactif;
    this.#dessinerFlecheRetour(contexte, 110, HAUTEUR_CANEVAS / 2, couleurTexte);

    contexte.fillStyle = couleurTexte;
    contexte.font = 'bold 78px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    contexte.textBaseline = 'middle';
    contexte.textAlign = 'left';
    contexte.fillText('Annuler', 172, HAUTEUR_CANEVAS / 2 + 4);

    this.texture.needsUpdate = true;
  }

  /**
   * Dessine une flèche courbe « retour en arrière » (icône d'annulation).
   *
   * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
   * @param {number} centreX - Centre horizontal de l'icône.
   * @param {number} centreY - Centre vertical de l'icône.
   * @param {string} couleur - Couleur du trait.
   */
  #dessinerFlecheRetour(contexte, centreX, centreY, couleur) {
    const rayon = 42;
    contexte.strokeStyle = couleur;
    contexte.fillStyle = couleur;
    contexte.lineWidth = 16;
    contexte.lineCap = 'round';

    // Arc ouvert vers la gauche, du haut vers le bas en passant par la droite.
    contexte.beginPath();
    contexte.arc(centreX, centreY, rayon, -Math.PI * 0.75, Math.PI * 0.6);
    contexte.stroke();

    // Pointe de flèche au départ de l'arc (en haut à gauche).
    const angle = -Math.PI * 0.75;
    const pointeX = centreX + rayon * Math.cos(angle);
    const pointeY = centreY + rayon * Math.sin(angle);
    contexte.beginPath();
    contexte.moveTo(pointeX - 30, pointeY - 2);
    contexte.lineTo(pointeX + 10, pointeY - 26);
    contexte.lineTo(pointeX + 6, pointeY + 22);
    contexte.closePath();
    contexte.fill();
  }
}
