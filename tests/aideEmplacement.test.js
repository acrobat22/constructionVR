/**
 * @file Tests de l'aide à l'emplacement (cadre fantôme) : éteinte par défaut,
 * interrupteur, coup de pouce automatique et apparition en fondu.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AideEmplacement } from '../src/construction/aideEmplacement.js';

/** Réglages courts pour des tests lisibles. */
const REGLAGES = { delaiCoupDePouce: 30000, dureeApparition: 1000 };

test('l’aide est éteinte par défaut', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.nouvelleEtape(0);
  assert.equal(aide.estVisible(1000), false);
  assert.equal(aide.opacite(1000), 0);
});

test('le coup de pouce allume l’aide au bout du délai', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.nouvelleEtape(0);
  assert.equal(aide.estVisible(29999), false);
  assert.equal(aide.estVisible(30000), true);
});

test('l’aide apparaît en fondu, sans à-coup', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.nouvelleEtape(0);
  assert.equal(aide.opacite(30000), 0);
  assert.equal(aide.opacite(30500), 0.5);
  assert.equal(aide.opacite(31000), 1);
  assert.equal(aide.opacite(40000), 1);
});

test('une nouvelle étape relance le délai et éteint le coup de pouce', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.nouvelleEtape(0);
  assert.equal(aide.estVisible(35000), true);
  aide.nouvelleEtape(36000);
  assert.equal(aide.estVisible(37000), false);
  assert.equal(aide.estVisible(66000), true);
});

test('l’interrupteur allume l’aide tout de suite, pour toutes les étapes', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.nouvelleEtape(0);
  aide.basculer(1000);
  assert.equal(aide.estVisible(1000), true);
  assert.equal(aide.opacite(1500), 0.5);
  aide.nouvelleEtape(5000);
  assert.equal(aide.estVisible(5000), true);
});

test('éteindre après un coup de pouce : l’aide ne revient pas pendant cette étape', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.nouvelleEtape(0);
  assert.equal(aide.estVisible(31000), true);
  aide.basculer(32000);
  assert.equal(aide.estVisible(32000), false);
  assert.equal(aide.estVisible(90000), false);
  // À l'étape suivante, le coup de pouce est de nouveau possible.
  aide.nouvelleEtape(100000);
  assert.equal(aide.estVisible(130000), true);
});

test('éteindre l’aide allumée à la main la coupe immédiatement', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.nouvelleEtape(0);
  aide.basculer(1000);
  aide.basculer(2000);
  assert.equal(aide.estVisible(2000), false);
  assert.equal(aide.opacite(2000), 0);
});

test('en dehors d’une étape (présentation, fin), l’aide reste éteinte', () => {
  const aide = new AideEmplacement(REGLAGES);
  aide.basculer(0);
  aide.terminerEtape();
  assert.equal(aide.estVisible(1000), false);
  assert.equal(aide.estVisible(100000), false);
});
