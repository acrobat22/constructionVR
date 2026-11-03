/**
 * @file Tests de la rotation douce de la miniature (bouton « Tourner »).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RotationDouce } from '../src/construction/rotationDouce.js';

const DUREE = 500;
const QUART = Math.PI / 2;

test('sans appui, l’angle reste celui de départ', () => {
  const rotation = new RotationDouce(-0.6, DUREE);
  assert.equal(rotation.angle(0), -0.6);
  assert.equal(rotation.angle(10_000), -0.6);
});

test('un appui fait un quart de tour dans le sens des aiguilles d’une montre, en douceur', () => {
  const rotation = new RotationDouce(0, DUREE);
  rotation.tourner(1000);
  assert.equal(rotation.angle(1000), 0);
  assert.ok(Math.abs(rotation.angle(1000 + DUREE / 2) + QUART / 2) < 1e-9, 'à mi-course : un huitième de tour');
  assert.ok(Math.abs(rotation.angle(1000 + DUREE) + QUART) < 1e-9);
  assert.equal(rotation.estEnMouvement(1000 + DUREE), false);
});

test('un appui pendant le mouvement est ignoré', () => {
  const rotation = new RotationDouce(0, DUREE);
  rotation.tourner(0);
  rotation.tourner(DUREE / 2);
  assert.ok(Math.abs(rotation.angle(5 * DUREE) + QUART) < 1e-9);
});

test('quatre appuis ramènent la vue de départ', () => {
  const rotation = new RotationDouce(-0.6, DUREE);
  for (let appui = 0; appui < 4; appui++) {
    rotation.tourner(appui * DUREE);
  }
  const angle = rotation.angle(4 * DUREE);
  // Même orientation à un tour complet près.
  assert.ok(Math.abs(Math.cos(angle) - Math.cos(-0.6)) < 1e-9 && Math.abs(Math.sin(angle) - Math.sin(-0.6)) < 1e-9);
});

test('une nouvelle partie remet l’angle de départ, sans animation', () => {
  const rotation = new RotationDouce(-0.6, DUREE);
  rotation.tourner(0);
  rotation.reinitialiser(-0.6);
  assert.equal(rotation.angle(DUREE / 2), -0.6);
  assert.equal(rotation.estEnMouvement(DUREE / 2), false);
});
