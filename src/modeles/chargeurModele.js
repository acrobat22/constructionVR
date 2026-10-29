/**
 * @file Chargement et validation des modèles décrits en JSON.
 *
 * Format attendu (positions et tailles en tenons, couches en hauteur) :
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

/**
 * @typedef {object} DescriptionBrique
 * @property {{ x: number, couche: number, z: number }} position - Position sur la grille.
 * @property {number} largeur - Largeur en tenons (axe x).
 * @property {number} profondeur - Profondeur en tenons (axe z).
 * @property {number} couleur - Couleur au format hexadécimal Three.js.
 */

/**
 * @typedef {object} Modele
 * @property {string} nom - Nom affiché du modèle.
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
    };
  });

  if (problemes.length > 0) {
    throw new ErreurModele(`Modèle « ${donnees.nom} » invalide — ${problemes.join(' ')}`);
  }
  return { nom: donnees.nom, briques };
}

/**
 * Calcule l'emprise au sol du modèle, en tenons.
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
    y: (brique.position.couche + 0.5) * grille.hauteurCouche,
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

  if (!Array.isArray(brique.position) || brique.position.length !== 3 || !brique.position.every(estEntier)) {
    problemes.push('« position » doit contenir trois entiers [x, couche, z]');
  } else if (brique.position[1] < 0) {
    problemes.push('la couche ne peut pas être négative');
  }

  if (!Array.isArray(brique.taille) || brique.taille.length !== 2
      || !brique.taille.every((valeur) => estEntier(valeur) && valeur >= 1)) {
    problemes.push('« taille » doit contenir deux entiers ≥ 1 [largeur, profondeur]');
  }

  if (typeof brique.couleur !== 'string' || !FORMAT_COULEUR.test(brique.couleur)) {
    problemes.push('« couleur » doit être au format « #rrggbb »');
  }
  return problemes;
}
