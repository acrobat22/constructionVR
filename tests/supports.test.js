/**
 * @file Tests du calcul de l'endroit où se pose une brique lâchée.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculerRepos, RESULTAT_REPOS } from '../src/construction/supports.js';

/** Table de 1 m × 0,6 m, dessus à 0,72 m. */
const TABLE = { minX: -0.5, maxX: 0.5, minZ: -0.9, maxZ: -0.3, dessus: 0.72 };
/** Plaque posée sur la table, dessus à 0,736 m. */
const PLAQUE = { minX: -0.2, maxX: 0.2, minZ: -0.8, maxZ: -0.5, dessus: 0.736 };

/**
 * Emprise d'une brique de 8 cm centrée en (x, z).
 *
 * @param {number} x - Centre en x.
 * @param {number} z - Centre en z.
 * @returns {{ minX: number, maxX: number, minZ: number, maxZ: number }}
 */
function emprise(x, z) {
  return { minX: x - 0.04, maxX: x + 0.04, minZ: z - 0.04, maxZ: z + 0.04 };
}

test('au-dessus de la table seule, la brique se pose sur la table', () => {
  assert.deepEqual(calculerRepos(emprise(0.4, -0.35), [TABLE, PLAQUE], TABLE), {
    resultat: RESULTAT_REPOS.POSER,
    hauteur: 0.72,
  });
});

test('au-dessus de la plaque, la brique se pose sur la plaque', () => {
  assert.equal(calculerRepos(emprise(0, -0.6), [TABLE, PLAQUE], TABLE).hauteur, 0.736);
});

test('à cheval sur le bord de la plaque, la brique se pose sur le support le plus haut', () => {
  assert.equal(calculerRepos(emprise(0.22, -0.6), [TABLE, PLAQUE], TABLE).hauteur, 0.736);
});

test('une brique qui touche juste le bord d’un support ne s’y pose pas', () => {
  assert.equal(calculerRepos(emprise(0.24, -0.6), [TABLE, PLAQUE], TABLE).hauteur, 0.72);
});

test('une brique posée sur une autre brique se pose sur son dessus', () => {
  const briquePosee = { minX: -0.04, maxX: 0.04, minZ: -0.64, maxZ: -0.56, dessus: 0.784 };
  assert.equal(calculerRepos(emprise(0.02, -0.6), [TABLE, PLAQUE, briquePosee], TABLE).hauteur, 0.784);
});

test('lâchée hors de la table, la brique retourne à la réserve', () => {
  assert.deepEqual(calculerRepos(emprise(0.7, -0.6), [TABLE, PLAQUE], TABLE), {
    resultat: RESULTAT_REPOS.RESERVE,
    hauteur: null,
  });
});

test('centre au-delà du bord de la table : retour à la réserve', () => {
  assert.equal(calculerRepos(emprise(0.51, -0.6), [TABLE], TABLE).resultat, RESULTAT_REPOS.RESERVE);
});
