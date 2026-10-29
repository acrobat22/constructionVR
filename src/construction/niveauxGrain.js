/**
 * @file Étirement des niveaux de gris du grain de bois, pour que les nervures
 * restent bien visibles sous la peinture.
 *
 * Logique pure (sans Three.js ni navigateur), testable avec `node --test`.
 */

/**
 * Étire les niveaux de gris pour que les nervures ressortent : les valeurs
 * entre deux percentiles sont ramenées entre `plancher` et 1.
 *
 * @param {ArrayLike<number>} luminances - Luminances entre 0 et 1.
 * @param {number} plancher - Valeur la plus sombre après étirement (0 à 1).
 * @param {number} [percentileBas=0.02] - Part des pixels les plus sombres ignorés.
 * @param {number} [percentileHaut=0.98] - Part des pixels en dessous du plus clair retenu.
 * @returns {Float32Array} Luminances étirées.
 */
export function etirerNiveaux(luminances, plancher, percentileBas = 0.02, percentileHaut = 0.98) {
  const triees = Float32Array.from(luminances).sort();
  const indice = (part) => Math.min(triees.length - 1, Math.max(0, Math.round(part * (triees.length - 1))));
  const bas = triees[indice(percentileBas)];
  const haut = triees[indice(percentileHaut)];
  const etendue = haut - bas;

  return Float32Array.from(luminances, (luminance) => {
    // Image uniforme : rien à étirer, on garde la peinture intacte.
    if (etendue <= 0) {
      return 1;
    }
    const normalisee = Math.min(1, Math.max(0, (luminance - bas) / etendue));
    return plancher + normalisee * (1 - plancher);
  });
}
