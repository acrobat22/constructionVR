/**
 * @file Tests du catalogue des modèles proposés sur la page d'accueil.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validerCatalogue, trierParNombrePieces, ErreurCatalogue } from '../src/modeles/catalogue.js';
import { validerModele } from '../src/modeles/chargeurModele.js';

/** Fabrique un catalogue d'une seule famille. */
const uneFamille = (modeles) => ({ familles: [{ nom: 'Animaux', modeles }] });

test('un catalogue valide donne les familles et les adresses de leurs modèles, dans l’ordre', () => {
  const familles = validerCatalogue({
    familles: [
      { nom: 'Véhicules', modeles: ['voilier.json'] },
      { nom: 'Animaux', modeles: ['lion.json', 'baleine.json'] },
    ],
  }, './modeles/');
  assert.deepEqual(familles, [
    { nom: 'Véhicules', adresses: ['./modeles/voilier.json'] },
    { nom: 'Animaux', adresses: ['./modeles/lion.json', './modeles/baleine.json'] },
  ]);
});

test('un catalogue vide ou mal formé est refusé', () => {
  for (const donnees of [null, {}, { familles: [] }, { familles: 'animaux' }, { modeles: ['lion.json'] }]) {
    assert.throws(() => validerCatalogue(donnees, './modeles/'), ErreurCatalogue, JSON.stringify(donnees));
  }
});

test('une famille sans nom ou sans modèle est refusée', () => {
  for (const famille of [null, { modeles: ['lion.json'] }, { nom: '  ', modeles: ['lion.json'] },
    { nom: 'Animaux' }, { nom: 'Animaux', modeles: [] }]) {
    assert.throws(() => validerCatalogue({ familles: [famille] }, './modeles/'), ErreurCatalogue, JSON.stringify(famille));
  }
});

test('un nom de fichier dangereux ou mal écrit est refusé', () => {
  for (const fichier of ['../config.js', 'voilier', 'sous/dossier.json', 'https://exemple.fr/m.json', 42]) {
    assert.throws(() => validerCatalogue(uneFamille([fichier]), './modeles/'), ErreurCatalogue, String(fichier));
  }
});

test('un modèle présent deux fois est refusé, même dans deux familles', () => {
  assert.throws(() => validerCatalogue(uneFamille(['lion.json', 'lion.json']), './modeles/'), /lion\.json.*deux fois/);
  assert.throws(() => validerCatalogue({
    familles: [{ nom: 'Animaux', modeles: ['lion.json'] }, { nom: 'Fauves', modeles: ['lion.json'] }],
  }, './modeles/'), /lion\.json.*deux fois/);
});

test('les modèles sont rangés du plus court au plus long, l’ordre du catalogue départageant', () => {
  const entrees = [
    { url: 'voilier', nombrePieces: 14 },
    { url: 'maisonnette', nombrePieces: 5 },
    { url: 'chateau', nombrePieces: 7 },
    { url: 'maison', nombrePieces: 5 },
  ];
  assert.deepEqual(trierParNombrePieces(entrees).map((entree) => entree.url), ['maisonnette', 'maison', 'chateau', 'voilier']);
  // La liste d'origine n'est pas modifiée.
  assert.equal(entrees[0].url, 'voilier');
});

test('le catalogue du jeu est valide et tous ses modèles aussi', async () => {
  const lire = (chemin) => readFile(new URL(chemin, import.meta.url), 'utf8');
  const familles = validerCatalogue(JSON.parse(await lire('../modeles/catalogue.json')), '../modeles/');
  const adresses = familles.flatMap((famille) => famille.adresses);
  assert.ok(familles.length >= 2, `${familles.length} familles`);
  assert.ok(adresses.length >= 5, `${adresses.length} modèles`);
  for (const adresse of adresses) {
    const texte = await lire(adresse);
    assert.doesNotThrow(() => validerModele(JSON.parse(texte)), adresse);
  }
});
