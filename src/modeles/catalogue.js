/**
 * @file Catalogue des modèles proposés sur la page d'accueil.
 *
 * Format (`modeles/catalogue.json`) : la liste des fichiers de modèles, dans
 * l'ordre d'affichage. Ajouter un modèle au jeu = ajouter une ligne.
 *
 * ```json
 * { "modeles": ["voilier.json", "baleine.json"] }
 * ```
 *
 * Logique pure (sans Three.js) : testable avec `node --test`.
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
 * @returns {Promise<string[]>} Adresses des modèles, dans l'ordre d'affichage.
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
 * @returns {string[]} Adresses des modèles, dans l'ordre.
 * @throws {ErreurCatalogue} Si le catalogue est vide, mal formé ou contient un nom invalide.
 */
export function validerCatalogue(donnees, dossier) {
  if (typeof donnees !== 'object' || donnees === null || !Array.isArray(donnees.modeles)
      || donnees.modeles.length === 0) {
    throw new ErreurCatalogue('Le catalogue doit contenir « modeles » : une liste d\'au moins un fichier.');
  }
  const dejaVus = new Set();
  return donnees.modeles.map((fichier) => {
    if (typeof fichier !== 'string' || !FORMAT_FICHIER.test(fichier)) {
      throw new ErreurCatalogue(`Nom de modèle invalide dans le catalogue : « ${fichier} » (attendu : nom.json).`);
    }
    if (dejaVus.has(fichier)) {
      throw new ErreurCatalogue(`Le modèle « ${fichier} » apparaît deux fois dans le catalogue.`);
    }
    dejaVus.add(fichier);
    return `${dossier}${fichier}`;
  });
}
