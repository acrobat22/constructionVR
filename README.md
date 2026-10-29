# Construction en briques (WebXR)

Jeu de construction en briques en réalité virtuelle, pensé pour les
**personnes âgées**, qui fonctionne directement dans le navigateur du
**Meta Quest 3**, sans installation.

- On joue **assis**, avec un seul geste : le **pincement** (pouce + index).
- On suit un **mode guidé** : une maquette fantôme montre où poser chaque brique.
- Il n'y a ni chrono ni échec possible, et le texte est affiché en grand.

Le contexte complet et les décisions de conception se trouvent dans
[CONTEXTE.md](CONTEXTE.md).

## État d'avancement

| Étape | Contenu | État |
|---|---|---|
| 1 | Socle : scène, entrée en VR, affichage des mains | ✅ |
| 2 | Saisie par pincement | ✅ |
| 3 | Accrochage, maquette fantôme, annulation | ✅ |
| 3 bis | Rendu réaliste, carte de progression, bouton « œil », chute douce | en test |
| 4 | Téléportation par pastilles | à faire |
| 5 | Premier modèle : voilier | à faire |
| 6 | Déploiement GitHub Pages | à faire |

## Structure

```
index.html                 Page d'accueil et bouton « Entrer en réalité virtuelle »
styles/accueil.css         Styles de la page (contraste ≥ 7:1)
vendor/three/              Three.js 0.186.1 (copie locale, licence MIT)
vendor/webxr-input-profiles/  Modèles 3D des mains (licence MIT)
ressources/environnements/ Pièce photographiée « Lebombo » (photo + HDR, Poly Haven, CC0)
ressources/textures/chene/ Bois du plateau (Poly Haven, CC0)
modeles/essai.json         Modèle d'essai de 3 briques
src/
  main.js                  Crée les modules et les relie (seul point d'assemblage)
  config.js                Tous les réglages ajustables
  coeur/scene.js           Scène, caméra, rendu « appareil photo », table en chêne
  coeur/ambiance.js        Pièce réelle (photo projetée au sol + éclairage HDR)
  coeur/lampe.js           Lampe suspendue : lumière chaude et ombres douces
  coeur/qualiteAdaptative.js       Logique pure : baisse la qualité si l'affichage ralentit
  coeur/sessionXR.js       Démarrage et fin de la session WebXR
  entrees/mains.js         Suivi et affichage des mains, signalement des pincements
  entrees/detecteurPincement.js  Logique pure du pincement (deux seuils anti-tremblement)
  construction/brique.js   Briques à tenons, halo de survol, plaque de base
  construction/saisie.js   Saisie, déplacement et relâchement des objets
  construction/maquetteFantome.js  Emplacement visé : volume translucide + contour net
  construction/accrochage.js       Logique pure : accrochage magnétique et glissement doux
  construction/historique.js       Pile d'actions pour « Annuler »
  construction/partie.js   Déroulé du mode guidé (une brique à la fois)
  construction/supports.js         Logique pure : où se pose une brique lâchée (chute douce)
  construction/ombreContact.js     Ombre douce au pied des objets posés
  construction/miniature.js        Modèle terminé en miniature (bouton « œil »)
  interface/bouton3D.js    Bouton 3D générique (« Annuler », « Voir le modèle »)
  interface/icones.js      Icônes dessinées (flèche retour, œil)
  interface/carteProgression.js    Nom du modèle et avancement, sans chrono
  modeles/chargeurModele.js        Lecture, validation et conversion des modèles JSON
tests/                     Tests des fonctions pures (node --test)
```

Les modules suivants (téléportation, texte d'aide) seront ajoutés au fil
des étapes.

## Ajouter un modèle

Un modèle est un fichier JSON dans `modeles/`. Les positions et tailles sont
en **tenons** (une brique 2 × 2 = 2 tenons de côté), la hauteur en **couches**.
L'ordre des briques est l'ordre de construction.

```json
{
  "nom": "Essai",
  "briques": [
    { "position": [0, 0, 0], "taille": [2, 2], "couleur": "#d93a2b" },
    { "position": [1, 1, 0], "taille": [2, 2], "couleur": "#f2c230" }
  ]
}
```

- `position` : `[x, couche, z]`, coin de la brique (plus petits x et z), entiers.
- `taille` : `[largeur, profondeur]` en tenons, entiers ≥ 1.
- `couleur` : format `#rrggbb`.

Un fichier mal écrit est refusé avec un message qui indique la brique fautive.

## Tests

Les fonctions pures se testent sans casque, avec le lanceur intégré à
Node.js (aucune installation de paquet nécessaire) :

```sh
node --test
```

## Lancer le projet en local

Les modules JavaScript ne se chargent pas en ouvrant le fichier directement
(`file://`) : il faut un petit serveur local. Python 3 suffit, sans rien
installer :

```sh
python3 serveur.py          # port 8000 (ou : python3 serveur.py 8080)
```

`serveur.py` fonctionne comme `python3 -m http.server`, mais demande au
navigateur de toujours revérifier les fichiers : un simple rechargement de la
page suffit pour voir les modifications (avec `http.server`, Chrome peut
garder d'anciens fichiers en cache). Il n'écoute que sur `localhost`.

Ouvrir ensuite <http://localhost:8000>. WebXR exige une adresse sécurisée :
`localhost` est accepté, mais une adresse IP en `http://` ne l'est pas.

### Tester sur ordinateur (sans casque)

1. Installer l'extension **Immersive Web Emulator** (Meta) dans Chrome ou Edge :
   [Chrome Web Store](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik).
2. Ouvrir <http://localhost:8000>, puis activer l'émulateur pour ce site avec
   le bouton de l'extension. La page se recharge.
3. Dans l'émulateur, passer en mode **mains** (hand tracking).
4. Cliquer sur « Entrer en réalité virtuelle » : les mains réalistes, la
   plaque verte, l'emplacement fantôme (contour blanc) et une brique dans la
   réserve apparaissent.
5. Approcher une main de la brique : un halo doux l'éclaire. Pincer pour
   l'attraper, l'amener sur l'emplacement fantôme et lâcher : elle glisse
   doucement à sa place, la brique suivante apparaît et la carte de
   progression avance.
6. Lâcher une brique ailleurs : elle descend doucement se poser (sur la
   table, la plaque ou une brique). Lâchée hors de la table, elle revient
   dans la réserve.
7. Pincer sur « Annuler » (à gauche) : la dernière brique posée revient dans
   la réserve. Pincer sur « Voir le modèle » (à droite) : la miniature du
   modèle terminé apparaît au fond de la table.

### Tester sur le Meta Quest 3 (câble USB)

D'après la [documentation de Meta](https://developers.meta.com/vr/documentation/web/browser-remote-debugging/) :

1. Activer le mode développeur du casque et installer les *Android Platform Tools* (`adb`).
2. Brancher le casque, vérifier qu'il apparaît avec `adb devices`.
3. Rediriger le port : `adb reverse tcp:8000 tcp:8000`.
4. Dans le navigateur du casque, ouvrir <http://localhost:8000>.

Le **suivi des mains** doit être activé dans les réglages du Quest.

## Licences

- Projet : [MIT](LICENSE).
- Three.js : MIT, voir [vendor/three/LICENSE](vendor/three/LICENSE).
- Modèles des mains (`@webxr-input-profiles/assets` 1.0.20) : MIT, voir
  [vendor/webxr-input-profiles/LICENSE.md](vendor/webxr-input-profiles/LICENSE.md).
- Pièce « Lebombo » (Greg Zaal) et texture « Oak Veneer 01 » :
  [Poly Haven](https://polyhaven.com/license), CC0 (domaine public). La photo
  a été réduite en 4096 × 2048 pour la mémoire du casque.
- Ambiance inspirée d'un puzzle CodePen (MIT, Cliff Pyles) : idées reprises,
  code non copié.
