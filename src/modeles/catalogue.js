/**
 * @file Catalogue des modèles proposés sur la page d'accueil.
 *
 * Format (`modeles/catalogue.json`) : des familles, affichées dans l'ordre du
 * fichier, chacune avec la liste de ses modèles. L'ordre des modèles dans une
 * famille n'a pas d'importance : le jeu les trie par nombre de pièces
 * (voir `trierParNombrePieces`). Ajouter un modèle = l'écrire dans sa famille.
 *
 * ```json
 * { "familles": [{ "nom": "Animaux", "modeles": ["lion.json", "baleine.json"] }] }
 * ```
 *
 * Logique pure (sans Three.js) : testable avec `node --test`.
 */

/**
 * @typedef {object} FamilleCatalogue
 * @property {string} nom - Nom affiché de la famille (« Animaux »).
 * @property {string[]} adresses - Adresses de ses modèles, dans l'ordre du fichier.
 */

/** Erreur levée quand le catalogue est mal écrit. */
export class ErreurCatalogue extends Error {
  /**
   * @param {string} message - Explication lisible du problème.
   */
  constructor(message) {
    super(message);
    this.name = 'ErreurCatalogue';
  }
}

/**
 * Nom de fichier accepté : lettres, chiffres et tirets, extension `.json`,
 * sans dossier (empêche d'aller lire un fichier ailleurs dans le site).
 */
const FORMAT_FICHIER = /^[a-z0-9-]+\.json$/i;

/**
 * Télécharge et valide le catalogue.
 *
 * @param {string} url - Adresse du catalogue (ex. « ./modeles/catalogue.json »).
 * @returns {Promise<FamilleCatalogue[]>} Familles et adresses de leurs modèles.
 * @throws {ErreurCatalogue} Si le catalogue est introuvable ou mal écrit.
 */
export async function chargerCatalogue(url) {
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new ErreurCatalogue(`Le catalogue « ${url} » est introuvable (code ${reponse.status}).`);
  }
  const dossier = url.slice(0, url.lastIndexOf('/') + 1);
  return validerCatalogue(await reponse.json(), dossier);
}

/**
 * Vérifie le catalogue et construit l'adresse de chaque modèle.
 *
 * @param {unknown} donnees - Contenu JSON lu.
 * @param {string} dossier - Dossier des modèles, terminé par « / ».
 * @returns {FamilleCatalogue[]} Familles, dans l'ordre du fichier.
 * @throws {ErreurCatalogue} Si le catalogue est vide, mal formé, contient un nom
 *   invalide ou un modèle présent deux fois (même dans deux familles).
 */
export function validerCatalogue(donnees, dossier) {
  if (typeof donnees !== 'object' || donnees === null || !Array.isArray(donnees.familles)
      || donnees.familles.length === 0) {
    throw new ErreurCatalogue('Le catalogue doit contenir « familles » : une liste d\'au moins une famille.');
  }
  const dejaVus = new Set();
  return donnees.familles.map((famille, indice) => {
    if (typeof famille !== 'object' || famille === null
        || typeof famille.nom !== 'string' || famille.nom.trim() === '') {
      throw new ErreurCatalogue(`La famille n° ${indice + 1} du catalogue doit avoir un « nom ».`);
    }
    if (!Array.isArray(famille.modeles) || famille.modeles.length === 0) {
      throw new ErreurCatalogue(`La famille « ${famille.nom} » doit contenir « modeles » : au moins un fichier.`);
    }
    const adresses = famille.modeles.map((fichier) => {
      if (typeof fichier !== 'string' || !FORMAT_FICHIER.test(fichier)) {
        throw new ErreurCatalogue(`Nom de modèle invalide dans le catalogue : « ${fichier} » (attendu : nom.json).`);
      }
      if (dejaVus.has(fichier)) {
        throw new ErreurCatalogue(`Le modèle « ${fichier} » apparaît deux fois dans le catalogue.`);
      }
      dejaVus.add(fichier);
      return `${dossier}${fichier}`;
    });
    return { nom: famille.nom, adresses };
  });
}

/**
 * Range des modèles du plus court au plus long à construire. À nombre de
 * pièces égal, l'ordre du catalogue est conservé (tri stable).
 *
 * @template {{ nombrePieces: number }} T
 * @param {readonly T[]} entrees - Modèles à ranger.
 * @returns {T[]} Nouvelle liste triée (l'originale n'est pas modifiée).
 */
export function trierParNombrePieces(entrees) {
  return [...entrees].sort((premier, second) => premier.nombrePieces - second.nombrePieces);
}
