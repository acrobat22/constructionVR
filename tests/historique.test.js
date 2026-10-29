/**
 * @file Tests de l'historique des actions (bouton « Annuler »).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Historique } from '../src/construction/historique.js';

/**
 * Crée une action factice qui note ses appels dans un journal.
 *
 * @param {string} nom - Nom de l'action.
 * @param {string[]} journal - Tableau où noter les appels.
 * @returns {{ executer(): void, annuler(): void }}
 */
function creerAction(nom, journal) {
  return {
    executer: () => journal.push(`executer ${nom}`),
    annuler: () => journal.push(`annuler ${nom}`),
  };
}

test('un historique neuf ne peut rien annuler', () => {
  const historique = new Historique();
  assert.equal(historique.peutAnnuler, false);
  assert.equal(historique.annuler(), false);
});

test('exécuter une action l’applique et permet de l’annuler', () => {
  const journal = [];
  const historique = new Historique();
  historique.executer(creerAction('A', journal));
  assert.deepEqual(journal, ['executer A']);
  assert.equal(historique.peutAnnuler, true);
});

test('les actions sont annulées dans l’ordre inverse', () => {
  const journal = [];
  const historique = new Historique();
  historique.executer(creerAction('A', journal));
  historique.executer(creerAction('B', journal));
  assert.equal(historique.annuler(), true);
  assert.equal(historique.annuler(), true);
  assert.deepEqual(journal, ['executer A', 'executer B', 'annuler B', 'annuler A']);
  assert.equal(historique.peutAnnuler, false);
});

test('vider l’historique empêche toute annulation', () => {
  const historique = new Historique();
  historique.executer(creerAction('A', []));
  historique.vider();
  assert.equal(historique.peutAnnuler, false);
});
