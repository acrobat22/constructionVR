/**
 * @file Tests de la validation des modèles JSON et de leur conversion en mètres.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  validerModele,
  calculerPositionsEnMetres,
  calculerEmprise,
  ErreurModele,
} from '../src/modeles/chargeurModele.js';

/** Grille simplifiée pour des calculs faciles à vérifier. */
const GRILLE = { pas: 0.04, hauteurCouche: 0.05 };

/** Modèle minimal valide. */
const MODELE_VALIDE = {
  nom: 'Test',
  briques: [
    { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000' },
    { position: [2, 0, 0], taille: [2, 2], couleur: '#00ff00' },
    { position: [1, 1, 0], taille: [2, 2], couleur: '#0000ff' },
  ],
};

test('un modèle valide est accepté et ses couleurs converties', () => {
  const modele = validerModele(MODELE_VALIDE);
  assert.equal(modele.nom, 'Test');
  assert.equal(modele.briques.length, 3);
  assert.deepEqual(modele.briques[0], {
    position: { x: 0, couche: 0, z: 0 },
    largeur: 2,
    profondeur: 2,
    couleur: 0xff0000,
  });
});

test('le modèle d’essai fourni avec le jeu est valide', async () => {
  const texte = await readFile(new URL('../modeles/essai.json', import.meta.url), 'utf8');
  assert.doesNotThrow(() => validerModele(JSON.parse(texte)));
});

test('un modèle sans nom ou sans briques est refusé', () => {
  assert.throws(() => validerModele({ briques: MODELE_VALIDE.briques }), ErreurModele);
  assert.throws(() => validerModele({ nom: 'Vide', briques: [] }), ErreurModele);
  assert.throws(() => validerModele(null), ErreurModele);
});

test('une brique mal décrite est refusée avec son numéro dans le message', () => {
  const modele = {
    nom: 'Erreurs',
    briques: [
      MODELE_VALIDE.briques[0],
      { position: [0, -1, 0], taille: [2, 2], couleur: '#ff0000' },
    ],
  };
  assert.throws(() => validerModele(modele), /brique 2/);
});

test('les tailles, positions et couleurs invalides sont refusées', () => {
  const variantes = [
    { position: [0, 0], taille: [2, 2], couleur: '#ff0000' },
    { position: [0.5, 0, 0], taille: [2, 2], couleur: '#ff0000' },
    { position: [0, 0, 0], taille: [0, 2], couleur: '#ff0000' },
    { position: [0, 0, 0], taille: [2, 2], couleur: 'rouge' },
  ];
  for (const brique of variantes) {
    assert.throws(() => validerModele({ nom: 'X', briques: [brique] }), ErreurModele, JSON.stringify(brique));
  }
});

test('une brique qui flotte (rien en dessous) est refusée', () => {
  const modele = {
    nom: 'Flottant',
    briques: [
      { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000' },
      { position: [4, 1, 0], taille: [2, 2], couleur: '#00ff00' },
    ],
  };
  assert.throws(() => validerModele(modele), /brique 2 .*repose sur rien/);
});

test('une brique listée avant son support est refusée (ordre de construction)', () => {
  const modele = {
    nom: 'Ordre',
    briques: [
      { position: [0, 1, 0], taille: [2, 2], couleur: '#ff0000' },
      { position: [0, 0, 0], taille: [2, 2], couleur: '#00ff00' },
    ],
  };
  assert.throws(() => validerModele(modele), /brique 1 .*repose sur rien/);
});

test('deux briques qui se chevauchent sur une même couche sont refusées', () => {
  const modele = {
    nom: 'Chevauchement',
    briques: [
      { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000' },
      { position: [1, 0, 1], taille: [2, 2], couleur: '#00ff00' },
    ],
  };
  assert.throws(() => validerModele(modele), /brique 2 .*chevauche la brique 1/);
});

test('deux briques côte à côte (sans chevauchement) sont acceptées', () => {
  const modele = {
    nom: 'Côte à côte',
    briques: [
      { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000' },
      { position: [2, 0, 0], taille: [2, 2], couleur: '#00ff00' },
    ],
  };
  assert.doesNotThrow(() => validerModele(modele));
});

test('le voilier fourni avec le jeu est valide et compte 12 à 15 briques', async () => {
  const texte = await readFile(new URL('../modeles/voilier.json', import.meta.url), 'utf8');
  const modele = validerModele(JSON.parse(texte));
  assert.ok(modele.briques.length >= 12 && modele.briques.length <= 15, `${modele.briques.length} briques`);
});

test('l’emprise couvre toutes les briques', () => {
  const modele = validerModele(MODELE_VALIDE);
  assert.deepEqual(calculerEmprise(modele), { minX: 0, maxX: 4, minZ: 0, maxZ: 2 });
});

test('les positions sont centrées sur l’emprise, posées sur y = 0', () => {
  const modele = validerModele(MODELE_VALIDE);
  const positions = calculerPositionsEnMetres(modele, GRILLE);
  const arrondir = (point) => ({
    x: Number(point.x.toFixed(6)),
    y: Number(point.y.toFixed(6)),
    z: Number(point.z.toFixed(6)),
  });
  // Emprise 4 × 2 tenons : centre en (2, 1). Brique 1 centrée en (1, 1) → x = -1 pas.
  assert.deepEqual(arrondir(positions[0]), { x: -0.04, y: 0.025, z: 0 });
  assert.deepEqual(arrondir(positions[1]), { x: 0.04, y: 0.025, z: 0 });
  assert.deepEqual(arrondir(positions[2]), { x: 0, y: 0.075, z: 0 });
});
