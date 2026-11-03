/**
 * @file Icônes dessinées au canevas pour les boutons 3D.
 *
 * Tracées à la main plutôt qu'avec des caractères spéciaux, qui peuvent
 * manquer dans la police du casque.
 *
 * Chaque icône a la même signature : (contexte, centreX, centreY, couleur).
 */

/**
 * Flèche courbe « retour en arrière » (annulation).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {number} centreX - Centre horizontal de l'icône.
 * @param {number} centreY - Centre vertical de l'icône.
 * @param {string} couleur - Couleur du trait.
 */
export function dessinerFlecheRetour(contexte, centreX, centreY, couleur) {
  const rayon = 42;
  contexte.strokeStyle = couleur;
  contexte.fillStyle = couleur;
  contexte.lineWidth = 16;
  contexte.lineCap = 'round';

  // Arc ouvert vers la gauche, du haut vers le bas en passant par la droite.
  contexte.beginPath();
  contexte.arc(centreX, centreY, rayon, -Math.PI * 0.75, Math.PI * 0.6);
  contexte.stroke();

  // Pointe de flèche au départ de l'arc (en haut à gauche).
  const angle = -Math.PI * 0.75;
  const pointeX = centreX + rayon * Math.cos(angle);
  const pointeY = centreY + rayon * Math.sin(angle);
  contexte.beginPath();
  contexte.moveTo(pointeX - 30, pointeY - 2);
  contexte.lineTo(pointeX + 10, pointeY - 26);
  contexte.lineTo(pointeX + 6, pointeY + 22);
  contexte.closePath();
  contexte.fill();
}

/**
 * Œil (voir le modèle terminé).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {number} centreX - Centre horizontal de l'icône.
 * @param {number} centreY - Centre vertical de l'icône.
 * @param {string} couleur - Couleur du trait.
 */
export function dessinerOeil(contexte, centreX, centreY, couleur) {
  const demiLargeur = 52;
  const demiHauteur = 32;
  contexte.strokeStyle = couleur;
  contexte.fillStyle = couleur;
  contexte.lineWidth = 12;

  // Contour en amande : deux courbes symétriques.
  contexte.beginPath();
  contexte.moveTo(centreX - demiLargeur, centreY);
  contexte.quadraticCurveTo(centreX, centreY - demiHauteur * 2, centreX + demiLargeur, centreY);
  contexte.quadraticCurveTo(centreX, centreY + demiHauteur * 2, centreX - demiLargeur, centreY);
  contexte.closePath();
  contexte.stroke();

  // Pupille pleine.
  contexte.beginPath();
  contexte.arc(centreX, centreY, 17, 0, Math.PI * 2);
  contexte.fill();
}

/**
 * Triangle « lecture » (commencer).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {number} centreX - Centre horizontal de l'icône.
 * @param {number} centreY - Centre vertical de l'icône.
 * @param {string} couleur - Couleur de remplissage.
 */
export function dessinerLecture(contexte, centreX, centreY, couleur) {
  const demiHauteur = 42;
  contexte.fillStyle = couleur;
  contexte.lineJoin = 'round';
  contexte.lineWidth = 10;
  contexte.strokeStyle = couleur;
  contexte.beginPath();
  contexte.moveTo(centreX - demiHauteur * 0.7, centreY - demiHauteur);
  contexte.lineTo(centreX + demiHauteur * 0.9, centreY);
  contexte.lineTo(centreX - demiHauteur * 0.7, centreY + demiHauteur);
  contexte.closePath();
  contexte.fill();
  contexte.stroke();
}

/**
 * Maison (revenir au menu des modèles).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {number} centreX - Centre horizontal de l'icône.
 * @param {number} centreY - Centre vertical de l'icône.
 * @param {string} couleur - Couleur du trait et du toit.
 */
export function dessinerMaison(contexte, centreX, centreY, couleur) {
  const demiLargeur = 34;
  contexte.strokeStyle = couleur;
  contexte.fillStyle = couleur;
  contexte.lineWidth = 12;
  contexte.lineJoin = 'round';

  // Toit plein en triangle.
  contexte.beginPath();
  contexte.moveTo(centreX - demiLargeur - 16, centreY - 4);
  contexte.lineTo(centreX, centreY - 46);
  contexte.lineTo(centreX + demiLargeur + 16, centreY - 4);
  contexte.closePath();
  contexte.fill();
  contexte.stroke();

  // Murs en contour, avec une porte pleine au milieu.
  contexte.strokeRect(centreX - demiLargeur, centreY - 4, demiLargeur * 2, 46);
  contexte.fillRect(centreX - 10, centreY + 14, 20, 28);
}

/**
 * Deux flèches courbes formant un cercle (tourner la miniature).
 *
 * @param {CanvasRenderingContext2D} contexte - Contexte de dessin.
 * @param {number} centreX - Centre horizontal de l'icône.
 * @param {number} centreY - Centre vertical de l'icône.
 * @param {string} couleur - Couleur du trait et des pointes.
 */
export function dessinerTourner(contexte, centreX, centreY, couleur) {
  const rayon = 38;
  contexte.strokeStyle = couleur;
  contexte.fillStyle = couleur;
  contexte.lineWidth = 12;
  contexte.lineCap = 'round';

  for (const angleDepart of [Math.PI * 0.1, Math.PI * 1.1]) {
    const angleFin = angleDepart + Math.PI * 0.72;
    contexte.beginPath();
    contexte.arc(centreX, centreY, rayon, angleDepart, angleFin);
    contexte.stroke();

    // Pointe au bout de l'arc : sommet dans le sens de la rotation (tangente),
    // base perpendiculaire à l'arc (normale).
    const boutX = centreX + rayon * Math.cos(angleFin);
    const boutY = centreY + rayon * Math.sin(angleFin);
    const tangenteX = -Math.sin(angleFin);
    const tangenteY = Math.cos(angleFin);
    const normaleX = Math.cos(angleFin);
    const normaleY = Math.sin(angleFin);
    contexte.beginPath();
    contexte.moveTo(boutX + tangenteX * 22, boutY + tangenteY * 22);
    contexte.lineTo(boutX + normaleX * 18 - tangenteX * 4, boutY + normaleY * 18 - tangenteY * 4);
    contexte.lineTo(boutX - normaleX * 18 - tangenteX * 4, boutY - normaleY * 18 - tangenteY * 4);
    contexte.closePath();
    contexte.fill();
  }
}
