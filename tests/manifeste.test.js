/**
 * @file Tests du manifeste de l'application web (PWA), lu par le casque Meta
 * Quest et par Bubblewrap pour fabriquer l'APK.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/** Adresse fictive du jeu en ligne, pour résoudre les chemins relatifs. */
const ADRESSE_MANIFESTE = new URL('https://exemple.github.io/constructionVR/manifest.webmanifest');

const manifeste = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));

/**
 * Lit la largeur et la hauteur d'une image PNG (en-tête IHDR).
 *
 * @param {Buffer} octets - Contenu du fichier.
 * @returns {{ largeur: number, hauteur: number }}
 */
function lireTaillePng(octets) {
  assert.equal(octets.subarray(1, 4).toString('ascii'), 'PNG', 'fichier PNG attendu');
  return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20) };
}

test('le manifeste donne le nom, l’affichage et les couleurs attendus', () => {
  assert.equal(manifeste.name, 'Construction en blocs');
  assert.ok(manifeste.short_name.length <= 12, 'nom court lisible sous l’icône');
  assert.equal(manifeste.display, 'standalone');
  for (const couleur of [manifeste.background_color, manifeste.theme_color]) {
    assert.match(couleur, /^#[0-9a-f]{6}$/i);
  }
});

test('la page de départ reste dans le périmètre de l’application', () => {
  const depart = new URL(manifeste.start_url, ADRESSE_MANIFESTE).href;
  const perimetre = new URL(manifeste.scope, ADRESSE_MANIFESTE).href;
  assert.ok(depart.startsWith(perimetre), `${depart} hors de ${perimetre}`);
});

test('chaque icône existe, en PNG, à la taille annoncée, dont une de 512 px et une « maskable »', async () => {
  for (const icone of manifeste.icons) {
    const octets = await readFile(new URL(`../${icone.src}`, import.meta.url));
    const { largeur, hauteur } = lireTaillePng(octets);
    assert.equal(`${largeur}x${hauteur}`, icone.sizes, icone.src);
  }
  assert.ok(manifeste.icons.some((icone) => icone.sizes === '512x512' && icone.purpose === 'any'));
  assert.ok(manifeste.icons.some((icone) => icone.purpose === 'maskable'));
});
