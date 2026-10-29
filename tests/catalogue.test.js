/**
 * @file Tests du catalogue des modèles proposés sur la page d'accueil.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validerCatalogue, ErreurCatalogue } from '../src/modeles/catalogue.js';
import { validerModele } from '../src/modeles/chargeurModele.js';

test('un catalogue valide donne les adresses des modèles, dans l’ordre', () => {
  const adresses = validerCatalogue({ modeles: ['voilier.json', 'lion.json'] }, './modeles/');
  assert.deepEqual(adresses, ['./modeles/voilier.json', './modeles/lion.json']);
});

test('un catalogue vide ou mal formé est refusé', () => {
  for (const donnees of [null, {}, { modeles: [] }, { modeles: 'voilier.json' }]) {
    assert.throws(() => validerCatalogue(donnees, './modeles/'), ErreurCatalogue, JSON.stringify(donnees));
  }
});

test('un nom de fichier dangereux ou mal écrit est refusé', () => {
  for (const fichier of ['../config.js', 'voilier', 'sous/dossier.json', 'https://exemple.fr/m.json', 42]) {
    assert.throws(() => validerCatalogue({ modeles: [fichier] }, './modeles/'), ErreurCatalogue, String(fichier));
  }
});

test('un modèle présent deux fois est refusé', () => {
  assert.throws(
    () => validerCatalogue({ modeles: ['lion.json', 'lion.json'] }, './modeles/'),
    /lion\.json.*deux fois/,
  );
});

test('le catalogue du jeu est valide et tous ses modèles aussi', async () => {
  const lire = (chemin) => readFile(new URL(chemin, import.meta.url), 'utf8');
  const adresses = validerCatalogue(JSON.parse(await lire('../modeles/catalogue.json')), '../modeles/');
  assert.ok(adresses.length >= 5, `${adresses.length} modèles`);
  for (const adresse of adresses) {
    const texte = await lire(adresse);
    assert.doesNotThrow(() => validerModele(JSON.parse(texte)), adresse);
  }
});
