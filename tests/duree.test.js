/**
 * @file Tests de la durée indicative affichée sur les cartes du menu.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculerPalierDuree, dessinerPoints } from '../src/modeles/duree.js';

test('les paliers suivent le nombre de pièces : court jusqu’à 6, moyen jusqu’à 9, long au-delà', () => {
  const attendus = [[1, 'Court'], [6, 'Court'], [7, 'Moyen'], [9, 'Moyen'], [10, 'Long'], [40, 'Long']];
  for (const [nombrePieces, libelle] of attendus) {
    assert.equal(calculerPalierDuree(nombrePieces).libelle, libelle, `${nombrePieces} pièces`);
  }
});

test('les points montrent le palier : pleins puis vides, toujours trois', () => {
  assert.equal(dessinerPoints(calculerPalierDuree(5)), '●○○');
  assert.equal(dessinerPoints(calculerPalierDuree(8)), '●●○');
  assert.equal(dessinerPoints(calculerPalierDuree(14)), '●●●');
});
