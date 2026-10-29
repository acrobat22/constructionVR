/**
 * @file Tests de l'étirement des niveaux du grain de bois (nervures visibles).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { etirerNiveaux } from '../src/construction/niveauxGrain.js';

/**
 * Arrondit une liste de nombres pour comparer sans erreurs d'arrondi.
 *
 * @param {number[]} valeurs - Valeurs à arrondir.
 * @returns {number[]}
 */
const arrondir = (valeurs) => Array.from(valeurs, (valeur) => Number(valeur.toFixed(3)));

test('le plus sombre devient le plancher, le plus clair devient 1', () => {
  const resultat = etirerNiveaux([0.2, 0.3, 0.4], 0.5, 0, 1);
  assert.deepEqual(arrondir(resultat), [0.5, 0.75, 1]);
});

test('un grain peu contrasté est étiré sur toute la plage', () => {
  // Un bois pâle (niveaux entre 0,60 et 0,64) doit quand même montrer ses nervures.
  const resultat = etirerNiveaux([0.6, 0.62, 0.64], 0.4, 0, 1);
  assert.deepEqual(arrondir(resultat), [0.4, 0.7, 1]);
});

test('les valeurs extrêmes isolées sont écrêtées (percentiles)', () => {
  // Grain entre 0,40 et 0,60, plus deux pixels aberrants (0 et 1).
  const grain = Array.from({ length: 98 }, (_, indice) => 0.4 + (0.2 * indice) / 97);
  const resultat = etirerNiveaux([0, ...grain, 1], 0.5, 0.02, 0.98);
  // Les pixels aberrants sont ramenés aux bornes…
  assert.equal(resultat[0], 0.5);
  assert.equal(resultat[99], 1);
  // … et le grain utilise presque toute la plage (sans eux, il serait écrasé au milieu).
  const grainEtire = Array.from(resultat.slice(1, 99));
  assert.ok(Math.min(...grainEtire) < 0.52, `minimum ${Math.min(...grainEtire)}`);
  assert.ok(Math.max(...grainEtire) > 0.98, `maximum ${Math.max(...grainEtire)}`);
});

test('une image uniforme reste claire (pas de division par zéro)', () => {
  const resultat = etirerNiveaux([0.3, 0.3, 0.3], 0.5, 0, 1);
  assert.deepEqual(arrondir(resultat), [1, 1, 1]);
});
