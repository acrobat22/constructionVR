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
    forme: 'pave',
    sens: null,
    axe: null,
    hauteur: 1,
    decor: null,
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

test('les champs facultatifs prennent leurs valeurs par défaut', () => {
  const modele = validerModele(MODELE_VALIDE);
  assert.equal(modele.briques[0].forme, 'pave');
  assert.equal(modele.briques[0].hauteur, 1);
  assert.equal(modele.briques[0].decor, null);
});

test('les nouvelles formes, hauteurs et décors sont acceptés', () => {
  const modele = validerModele({
    nom: 'Formes',
    briques: [
      { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000', hauteur: 2, decor: { face: 'z+', motif: 'visage' } },
      { position: [0, 2, 0], taille: [2, 2], couleur: '#00ff00', forme: 'quartRond', sens: 'x+' },
      { position: [2, 0, 0], taille: [1, 2], couleur: '#0000ff', forme: 'cylindre', axe: 'z', hauteur: 0.5 },
      { position: [3, 0, 0], taille: [1, 1], couleur: '#0000ff', forme: 'pointe', hauteur: 0.7 },
      { position: [4, 0, 0], taille: [1, 2], couleur: '#0000ff', forme: 'pente', sens: 'x-' },
    ],
  });
  assert.deepEqual(
    modele.briques.map((brique) => [brique.forme, brique.sens, brique.axe, brique.hauteur]),
    [['pave', null, null, 2], ['quartRond', 'x+', null, 1], ['cylindre', null, 'z', 0.5], ['pointe', null, null, 0.7], ['pente', 'x-', null, 1]],
  );
  assert.deepEqual(modele.briques[0].decor, { face: 'z+', motif: 'visage' });
});

test('une forme, un sens, un axe, une hauteur ou un décor inconnus sont refusés', () => {
  const base = { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000' };
  const variantes = [
    { ...base, forme: 'etoile' },
    { ...base, forme: 'pente' },
    { ...base, forme: 'quartRond', sens: 'haut' },
    { ...base, forme: 'cylindre', axe: 'y' },
    { ...base, hauteur: 0 },
    { ...base, hauteur: 'grand' },
    { ...base, decor: { face: 'z+', motif: 'licorne' } },
    { ...base, decor: { face: 'dessous', motif: 'visage' } },
  ];
  for (const brique of variantes) {
    assert.throws(() => validerModele({ nom: 'X', briques: [brique] }), ErreurModele, JSON.stringify(brique));
  }
});

test('une pièce haute porte une pièce posée sur son dessus', () => {
  const modele = {
    nom: 'Hauteur',
    briques: [
      { position: [0, 0, 0], taille: [1, 2], couleur: '#ff0000', hauteur: 3 },
      { position: [0, 3, 0], taille: [2, 2], couleur: '#00ff00' },
    ],
  };
  assert.doesNotThrow(() => validerModele(modele));
});

test('une pièce qui traverse une pièce haute est refusée', () => {
  const modele = {
    nom: 'Traversée',
    briques: [
      { position: [0, 0, 0], taille: [1, 2], couleur: '#ff0000', hauteur: 3 },
      { position: [0, 1, 0], taille: [1, 2], couleur: '#00ff00' },
    ],
  };
  assert.throws(() => validerModele(modele), /brique 2 .*chevauche la brique 1/);
});

test('rien ne peut être posé sur une surface courbe ou en pente', () => {
  for (const support of [
    { forme: 'quartRond', sens: 'x+' },
    { forme: 'pente', sens: 'x-' },
    { forme: 'pointe' },
    { forme: 'cylindre', axe: 'z' },
  ]) {
    const modele = {
      nom: 'Courbe',
      briques: [
        { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000', ...support },
        { position: [0, 1, 0], taille: [2, 2], couleur: '#00ff00' },
      ],
    };
    assert.throws(() => validerModele(modele), /brique 2 .*surface courbe/, JSON.stringify(support));
  }
});

test('un cylindre debout a un dessus plat et peut porter une pièce', () => {
  const modele = {
    nom: 'Tronc',
    briques: [
      { position: [0, 0, 0], taille: [1, 1], couleur: '#ff0000', forme: 'cylindre', hauteur: 2 },
      { position: [0, 2, 0], taille: [1, 1], couleur: '#00ff00', forme: 'pointe' },
    ],
  };
  assert.doesNotThrow(() => validerModele(modele));
});

test('la hauteur des pièces est prise en compte pour leur centre en mètres', () => {
  const modele = validerModele({
    nom: 'Centres',
    briques: [
      { position: [0, 0, 0], taille: [2, 2], couleur: '#ff0000', hauteur: 2 },
      { position: [0, 2, 0], taille: [2, 2], couleur: '#00ff00', hauteur: 0.5 },
    ],
  });
  const [bas, haut] = calculerPositionsEnMetres(modele, GRILLE);
  assert.equal(Number(bas.y.toFixed(6)), 0.05);
  assert.equal(Number(haut.y.toFixed(6)), 0.1125);
});

test('les quatre animaux fournis avec le jeu sont valides', async () => {
  for (const nom of ['baleine', 'girafe', 'lion', 'dragon']) {
    const texte = await readFile(new URL(`../modeles/${nom}.json`, import.meta.url), 'utf8');
    assert.doesNotThrow(() => validerModele(JSON.parse(texte)), nom);
  }
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
  // Emprise 4 × 2 cases : centre en (2, 1). Brique 1 centrée en (1, 1) → x = -1 pas.
  assert.deepEqual(arrondir(positions[0]), { x: -0.04, y: 0.025, z: 0 });
  assert.deepEqual(arrondir(positions[1]), { x: 0.04, y: 0.025, z: 0 });
  assert.deepEqual(arrondir(positions[2]), { x: 0, y: 0.075, z: 0 });
});
