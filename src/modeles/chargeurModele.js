/**
 * @file Chargement et validation des modèles décrits en JSON.
 *
 * Format attendu (positions et tailles en cases de la grille, couches en hauteur) :
 *
 * ```json
 * {
 *   "nom": "Voilier",
 *   "briques": [
 *     { "position": [x, couche, z], "taille": [largeur, profondeur], "couleur": "#rrggbb" }
 *   ]
 * }
 * ```
 *
 * L'ordre des briques est l'ordre de construction. `position` désigne le
 * coin de la brique ayant les plus petits x et z.
 *
 * Champs facultatifs d'une brique :
 *   - `forme` : « pave » (par défaut), « pente », « quartRond », « cylindre », « pointe » ;
 *   - `sens` : « x+ », « x- », « z+ », « z- » : direction vers laquelle une
 *     pente ou un quart de rond descend (obligatoire pour ces deux formes) ;
 *   - `axe` : « x » ou « z » pour un cylindre couché (debout par défaut) ;
 *   - `hauteur` : hauteur en couches (1 par défaut, par exemple 0.5 ou 3) ;
 *   - `decor` : `{ "face": "z+", "motif": "visage" }`, motif peint sur une face.
 *
 * Logique pure (sans Three.js) : testable avec `node --test`.
 */

/** Erreur levée quand un fichier de modèle est mal écrit. */
export class ErreurModele extends Error {
  /**
   * @param {string} message - Explication lisible du problème.
   */
  constructor(message) {
    super(message);
    this.name = 'ErreurModele';
  }
}

/** Formes de pièces disponibles. */
export const FORMES = Object.freeze(['pave', 'pente', 'quartRond', 'cylindre', 'pointe']);

/** Formes qui exigent un sens (direction de la descente). */
const FORMES_ORIENTEES = Object.freeze(['pente', 'quartRond']);

/** Directions horizontales possibles. */
export const SENS = Object.freeze(['x+', 'x-', 'z+', 'z-']);

/** Axes d'un cylindre couché. */
const AXES = Object.freeze(['x', 'z']);

/** Faces sur lesquelles un décor peut être peint (« y+ » = dessus). */
export const FACES_DECOR = Object.freeze(['x+', 'x-', 'z+', 'z-', 'y+']);

/** Motifs de décor disponibles (dessinés par le jeu, sans image externe). */
export const MOTIFS = Object.freeze(['oeil-sourire', 'oeil-rond', 'profil', 'visage', 'taches', 'ecailles']);

/** Hauteur maximale d'une pièce, en couches. */
const HAUTEUR_MAXIMALE = 8;

/**
 * @typedef {object} DescriptionBrique
 * @property {{ x: number, couche: number, z: number }} position - Position sur la grille.
 * @property {number} largeur - Largeur en cases (axe x).
 * @property {number} profondeur - Profondeur en cases (axe z).
 * @property {number} couleur - Couleur au format hexadécimal Three.js.
 * @property {string} forme - Une des {@link FORMES}.
 * @property {string | null} sens - Direction de la descente (pente, quart de rond), sinon `null`.
 * @property {string | null} axe - Axe d'un cylindre couché, sinon `null`.
 * @property {number} hauteur - Hauteur en couches.
 * @property {{ face: string, motif: string } | null} decor - Motif peint, ou `null`.
 */

/**
 * @typedef {object} Modele
 * @property {string} nom - Nom affiché du modèle.
 * @property {string} description - Phrase de présentation (facultative, vide sinon).
 * @property {DescriptionBrique[]} briques - Briques dans l'ordre de construction.
 */

/** Format accepté pour les couleurs : « #rrggbb ». */
const FORMAT_COULEUR = /^#[0-9a-f]{6}$/i;

/**
 * Télécharge et valide un modèle.
 *
 * @param {string} url - Adresse du fichier JSON.
 * @returns {Promise<Modele>}
 * @throws {ErreurModele} Si le fichier est introuvable ou mal écrit.
 */
export async function chargerModele(url) {
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new ErreurModele(`Le modèle « ${url} » est introuvable (code ${reponse.status}).`);
  }
  let donnees;
  try {
    donnees = await reponse.json();
  } catch (erreur) {
    throw new ErreurModele(`Le modèle « ${url} » n'est pas un JSON valide : ${erreur.message}`);
  }
  return validerModele(donnees);
}

/**
 * Vérifie un modèle brut et le convertit en structure prête à l'emploi.
 *
 * @param {unknown} donnees - Contenu JSON lu.
 * @returns {Modele}
 * @throws {ErreurModele} Avec la liste de tous les problèmes trouvés.
 */
export function validerModele(donnees) {
  if (typeof donnees !== 'object' || donnees === null) {
    throw new ErreurModele('Le modèle doit être un objet JSON.');
  }
  const problemes = [];

  if (typeof donnees.nom !== 'string' || donnees.nom.trim() === '') {
    problemes.push('« nom » doit être un texte non vide.');
  }
  if (!Array.isArray(donnees.briques) || donnees.briques.length === 0) {
    problemes.push('« briques » doit être une liste d\'au moins une brique.');
  }
  if (problemes.length > 0) {
    throw new ErreurModele(problemes.join(' '));
  }

  const briques = donnees.briques.map((brique, indice) => {
    const problemesBrique = listerProblemesBrique(brique);
    if (problemesBrique.length > 0) {
      problemes.push(`brique ${indice + 1} : ${problemesBrique.join(', ')}.`);
      return null;
    }
    const [x, couche, z] = brique.position;
    const [largeur, profondeur] = brique.taille;
    return {
      position: { x, couche, z },
      largeur,
      profondeur,
      couleur: Number.parseInt(brique.couleur.slice(1), 16),
      forme: brique.forme ?? 'pave',
      sens: brique.sens ?? null,
      axe: brique.axe ?? null,
      hauteur: brique.hauteur ?? 1,
      decor: brique.decor ? { face: brique.decor.face, motif: brique.decor.motif } : null,
    };
  });

  if (problemes.length === 0) {
    problemes.push(...listerProblemesConstruction(briques));
  }
  if (problemes.length > 0) {
    throw new ErreurModele(`Modèle « ${donnees.nom} » invalide — ${problemes.join(' ')}`);
  }
  const description = typeof donnees.description === 'string' ? donnees.description : '';
  return { nom: donnees.nom, description, briques };
}

/**
 * Indique si une pièce a un dessus plat sur lequel on peut en poser une autre
 * (pavé, ou cylindre debout).
 *
 * @param {DescriptionBrique} brique - Pièce validée.
 * @returns {boolean}
 */
export function estPorteuse(brique) {
  return brique.forme === 'pave' || (brique.forme === 'cylindre' && brique.axe === null);
}

/** Tolérance de comparaison des hauteurs (en couches). */
const TOLERANCE_COUCHE = 1e-6;

/**
 * Indique si deux briques se recouvrent vue de dessus (un bord commun ne compte pas).
 *
 * @param {DescriptionBrique} a - Première brique.
 * @param {DescriptionBrique} b - Seconde brique.
 * @returns {boolean}
 */
function seRecouvrentDeDessus(a, b) {
  return a.position.x < b.position.x + b.largeur && b.position.x < a.position.x + a.largeur
    && a.position.z < b.position.z + b.profondeur && b.position.z < a.position.z + a.profondeur;
}

/**
 * Vérifie que le modèle peut réellement être construit dans l'ordre donné :
 * chaque brique au-dessus du sol repose sur le dessus plat d'une brique posée
 * avant elle, et deux briques n'occupent jamais le même espace.
 *
 * @param {DescriptionBrique[]} briques - Briques dans l'ordre de construction.
 * @returns {string[]} Problèmes trouvés (liste vide si le modèle est constructible).
 */
function listerProblemesConstruction(briques) {
  const problemes = [];
  briques.forEach((brique, indice) => {
    const precedentes = briques.slice(0, indice);

    const bas = brique.position.couche;
    const haut = bas + brique.hauteur;

    // Chevauchement : mêmes cases vues de dessus ET hauteurs qui se croisent.
    const briqueChevauchee = precedentes.findIndex((autre) => seRecouvrentDeDessus(brique, autre)
      && bas < autre.position.couche + autre.hauteur - TOLERANCE_COUCHE
      && autre.position.couche < haut - TOLERANCE_COUCHE);
    if (briqueChevauchee !== -1) {
      problemes.push(`brique ${indice + 1} : elle chevauche la brique ${briqueChevauchee + 1}.`);
    }

    if (bas < TOLERANCE_COUCHE) {
      return;
    }
    const supports = precedentes.filter((autre) => seRecouvrentDeDessus(brique, autre)
      && Math.abs(autre.position.couche + autre.hauteur - bas) < TOLERANCE_COUCHE);
    if (supports.length === 0) {
      problemes.push(`brique ${indice + 1} : elle repose sur rien (aucune brique posée avant elle juste en dessous).`);
    } else if (!supports.some(estPorteuse)) {
      problemes.push(`brique ${indice + 1} : elle est posée sur une surface courbe ou en pente.`);
    }
  });
  return problemes;
}

/**
 * Calcule l'emprise au sol du modèle, en cases.
 *
 * @param {Modele} modele - Modèle validé.
 * @returns {{ minX: number, maxX: number, minZ: number, maxZ: number }}
 */
export function calculerEmprise(modele) {
  return modele.briques.reduce(
    (emprise, brique) => ({
      minX: Math.min(emprise.minX, brique.position.x),
      maxX: Math.max(emprise.maxX, brique.position.x + brique.largeur),
      minZ: Math.min(emprise.minZ, brique.position.z),
      maxZ: Math.max(emprise.maxZ, brique.position.z + brique.profondeur),
    }),
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
  );
}

/**
 * Convertit la position de chaque brique en mètres : centre de la brique,
 * l'emprise du modèle étant centrée sur l'origine et posée sur y = 0.
 *
 * @param {Modele} modele - Modèle validé.
 * @param {{ pas: number, hauteurCouche: number }} grille - Dimensions de la grille, en mètres.
 * @returns {{ x: number, y: number, z: number }[]} Centres des briques, dans l'ordre.
 */
export function calculerPositionsEnMetres(modele, grille) {
  const emprise = calculerEmprise(modele);
  const centreX = (emprise.minX + emprise.maxX) / 2;
  const centreZ = (emprise.minZ + emprise.maxZ) / 2;

  return modele.briques.map((brique) => ({
    x: (brique.position.x + brique.largeur / 2 - centreX) * grille.pas,
    y: (brique.position.couche + brique.hauteur / 2) * grille.hauteurCouche,
    z: (brique.position.z + brique.profondeur / 2 - centreZ) * grille.pas,
  }));
}

/**
 * Liste les problèmes d'une brique brute.
 *
 * @param {unknown} brique - Brique telle que lue dans le JSON.
 * @returns {string[]} Problèmes trouvés (liste vide si la brique est correcte).
 */
function listerProblemesBrique(brique) {
  if (typeof brique !== 'object' || brique === null) {
    return ['doit être un objet'];
  }
  const problemes = [];
  const estEntier = (valeur) => Number.isInteger(valeur);
  // La couche peut tomber sur une demi-couche (au-dessus d'une pièce de hauteur 0,5).
  const estDemiEntier = (valeur) => Number.isInteger(valeur * 2);

  const position = brique.position;
  if (!Array.isArray(position) || position.length !== 3
      || !estEntier(position[0]) || !estDemiEntier(position[1]) || !estEntier(position[2])) {
    problemes.push('« position » doit contenir [x, couche, z] (x et z entiers, couche entière ou demi-entière)');
  } else if (position[1] < 0) {
    problemes.push('la couche ne peut pas être négative');
  }

  if (!Array.isArray(brique.taille) || brique.taille.length !== 2
      || !brique.taille.every((valeur) => estEntier(valeur) && valeur >= 1)) {
    problemes.push('« taille » doit contenir deux entiers ≥ 1 [largeur, profondeur]');
  }

  if (typeof brique.couleur !== 'string' || !FORMAT_COULEUR.test(brique.couleur)) {
    problemes.push('« couleur » doit être au format « #rrggbb »');
  }

  const forme = brique.forme ?? 'pave';
  if (!FORMES.includes(forme)) {
    problemes.push(`« forme » doit être l'une de : ${FORMES.join(', ')}`);
  }
  if (FORMES_ORIENTEES.includes(forme) && !SENS.includes(brique.sens)) {
    problemes.push(`« sens » est obligatoire pour cette forme : ${SENS.join(', ')}`);
  } else if (brique.sens !== undefined && !SENS.includes(brique.sens)) {
    problemes.push(`« sens » doit être l'un de : ${SENS.join(', ')}`);
  }
  if (brique.axe !== undefined && (forme !== 'cylindre' || !AXES.includes(brique.axe))) {
    problemes.push('« axe » (« x » ou « z ») n\'est permis que pour un cylindre couché');
  }

  const hauteur = brique.hauteur ?? 1;
  if (typeof hauteur !== 'number' || !Number.isFinite(hauteur) || hauteur <= 0 || hauteur > HAUTEUR_MAXIMALE) {
    problemes.push(`« hauteur » doit être un nombre entre 0 (exclu) et ${HAUTEUR_MAXIMALE}`);
  }

  if (brique.decor !== undefined) {
    const decor = brique.decor;
    if (typeof decor !== 'object' || decor === null
        || !FACES_DECOR.includes(decor.face) || !MOTIFS.includes(decor.motif)) {
      problemes.push(`« decor » doit être { face: ${FACES_DECOR.join('/')}, motif: ${MOTIFS.join('/')} }`);
    }
  }
  return problemes;
}
