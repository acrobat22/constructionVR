/**
 * @file Lampe de bureau posée sur la table : interrupteur de l'aide à
 * l'emplacement (cadre fantôme).
 *
 * On la pince (ou on la clique) pour allumer ou éteindre l'aide. Quand l'aide
 * est visible, l'ampoule s'allume et éclaire doucement la table. Une plaque
 * « Aide : allumée / éteinte » à son pied dit l'état en toutes lettres :
 * l'information ne repose jamais sur la seule lumière.
 *
 * Même interface que les boutons 3D (`objet3D`, `estVise`, `appuyer`,
 * `mettreAJour`) : la boucle principale les traite de la même façon.
 */

import * as THREE from 'three';

/** Couleurs de la plaque (contrastes ≥ 7:1, voir styles/accueil.css). */
const COULEURS = Object.freeze({
  fond: '#111418',
  texte: '#ffffff',
  etatAllume: '#ffe98a',
  etatEteint: '#c8ccd4',
  bordureSurvol: '#ffe98a',
  bordureRepos: '#ffffff',
});

/** Dimensions de la lampe, en mètres. */
const DIMENSIONS = Object.freeze({
  rayonSocle: 0.045,
  hauteurSocle: 0.012,
  hauteurBras: 0.15,
  rayonBras: 0.006,
  rayonAbatJour: 0.055,
  rayonAmpoule: 0.016,
  largeurPlaque: 0.15,
  hauteurPlaque: 0.055,
});

/**
 * Interrupteur de l'aide, en forme de lampe de bureau.
 */
export class LampeAide {
  /**
   * @param {object} options
   * @param {() => void} options.surAppui - Appelé à chaque appui (bascule l'aide).
   * @param {number} options.margeVisee - Marge autour de la lampe dans laquelle un pincement l'active.
   */
  constructor({ surAppui, margeVisee }) {
    this.surAppui = surAppui;
    this.margeVisee = margeVisee;
    this.estAllumee = false;
    this.estSurvolee = false;

    /** Groupe à poser sur la table. */
    this.objet3D = new THREE.Group();
    this.objet3D.name = 'lampe-aide';

    this.materiauAmpoule = new THREE.MeshBasicMaterial({ color: 0x8a8578 });
    this.materiauAbatJour = new THREE.MeshStandardMaterial({
      color: 0xf2e6cc,
      roughness: 0.6,
      side: THREE.DoubleSide,
      emissive: 0xffd9a0,
      emissiveIntensity: 0,
    });
    // Petite lumière chaude, seulement quand l'aide est visible.
    this.lumiere = new THREE.PointLight(0xffe2b0, 0.6, 0.7, 2);
    this.lumiere.visible = false;

    this.#construireLampe();

    this.canevas = document.createElement('canvas');
    this.canevas.width = 512;
    this.canevas.height = Math.round(512 * DIMENSIONS.hauteurPlaque / DIMENSIONS.largeurPlaque);
    this.texture = new THREE.CanvasTexture(this.canevas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.#construirePlaque();

    this.zoneVisee = new THREE.Box3();
    this.#dessinerPlaque();
  }

  /**
   * Montre l'état de l'aide : ampoule allumée ou éteinte.
   *
   * @param {boolean} estAllumee - `true` si le cadre fantôme est visible.
   */
  definirAllumee(estAllumee) {
    if (estAllumee === this.estAllumee) {
      return;
    }
    this.estAllumee = estAllumee;
    this.materiauAmpoule.color.setHex(estAllumee ? 0xfff1c9 : 0x8a8578);
    this.materiauAbatJour.emissiveIntensity = estAllumee ? 0.35 : 0;
    this.lumiere.visible = estAllumee;
    this.#dessinerPlaque();
  }

  /**
   * Indique si un point de pincement vise la lampe (zone élargie par une marge).
   *
   * @param {THREE.Vector3} point - Point de pincement (coordonnées de la scène).
   * @returns {boolean}
   */
  estVise(point) {
    return this.zoneVisee.setFromObject(this.objet3D).expandByScalar(this.margeVisee).containsPoint(point);
  }

  /** Appui : bascule l'aide (l'état affiché suivra via {@link LampeAide#definirAllumee}). */
  appuyer() {
    this.surAppui();
  }

  /**
   * Met à jour le survol. À appeler une fois par image.
   *
   * @param {Map<XRHandedness, THREE.Vector3>} pointsDePincement - Points des mains suivies.
   */
  mettreAJour(pointsDePincement) {
    const estSurvolee = [...pointsDePincement.values()].some((point) => this.estVise(point));
    if (estSurvolee !== this.estSurvolee) {
      this.estSurvolee = estSurvolee;
      this.#dessinerPlaque();
    }
  }

  /** Construit la lampe : socle, bras, abat-jour orienté vers la planchette, ampoule. */
  #construireLampe() {
    const laiton = new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.35, metalness: 0.6 });

    const socle = new THREE.Mesh(
      new THREE.CylinderGeometry(DIMENSIONS.rayonSocle, DIMENSIONS.rayonSocle * 1.1, DIMENSIONS.hauteurSocle, 40),
      laiton,
    );
    socle.position.y = DIMENSIONS.hauteurSocle / 2;
    socle.castShadow = true;
    this.objet3D.add(socle);

    const bras = new THREE.Mesh(
      new THREE.CylinderGeometry(DIMENSIONS.rayonBras, DIMENSIONS.rayonBras, DIMENSIONS.hauteurBras, 16),
      laiton,
    );
    bras.position.y = DIMENSIONS.hauteurSocle + DIMENSIONS.hauteurBras / 2;
    bras.castShadow = true;
    this.objet3D.add(bras);

    // Tête de lampe, inclinée vers la planchette (+x) et vers le bas.
    const tete = new THREE.Group();
    tete.position.set(0, DIMENSIONS.hauteurSocle + DIMENSIONS.hauteurBras, 0);
    tete.rotation.z = -Math.PI / 3;
    this.objet3D.add(tete);

    const profil = [
      new THREE.Vector2(0.012, 0.03),
      new THREE.Vector2(0.02, 0.022),
      new THREE.Vector2(DIMENSIONS.rayonAbatJour, -0.035),
      new THREE.Vector2(DIMENSIONS.rayonAbatJour + 0.003, -0.04),
    ];
    const abatJour = new THREE.Mesh(new THREE.LatheGeometry(profil, 40), this.materiauAbatJour);
    abatJour.castShadow = true;
    tete.add(abatJour);

    const ampoule = new THREE.Mesh(new THREE.SphereGeometry(DIMENSIONS.rayonAmpoule, 24, 16), this.materiauAmpoule);
    ampoule.position.y = -0.012;
    tete.add(ampoule);

    this.lumiere.position.y = -0.03;
    tete.add(this.lumiere);
  }

  /** Construit la plaque d'état, inclinée vers le joueur, au pied de la lampe. */
  #construirePlaque() {
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(DIMENSIONS.largeurPlaque, DIMENSIONS.hauteurPlaque),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
    );
    plaque.rotation.x = -Math.PI / 2 + 0.6;
    plaque.position.set(0, 0.022, DIMENSIONS.rayonSocle + DIMENSIONS.hauteurPlaque / 2);
    plaque.name = 'plaque-aide';
    this.objet3D.add(plaque);
  }

  /** Redessine la plaque : « Aide », puis l'état en toutes lettres. */
  #dessinerPlaque() {
    const contexte = this.canevas.getContext('2d');
    const { width: largeur, height: hauteur } = this.canevas;
    contexte.clearRect(0, 0, largeur, hauteur);
    contexte.fillStyle = COULEURS.fond;
    contexte.beginPath();
    contexte.roundRect(8, 8, largeur - 16, hauteur - 16, 28);
    contexte.fill();
    contexte.lineWidth = this.estSurvolee ? 14 : 6;
    contexte.strokeStyle = this.estSurvolee ? COULEURS.bordureSurvol : COULEURS.bordureRepos;
    contexte.stroke();

    const police = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    contexte.textBaseline = 'middle';
    contexte.textAlign = 'center';
    contexte.fillStyle = COULEURS.texte;
    contexte.font = `bold 62px ${police}`;
    contexte.fillText('Aide :', largeur * 0.3, hauteur / 2);
    contexte.fillStyle = this.estAllumee ? COULEURS.etatAllume : COULEURS.etatEteint;
    contexte.fillText(this.estAllumee ? 'allumée' : 'éteinte', largeur * 0.67, hauteur / 2);
    this.texture.needsUpdate = true;
  }
}
