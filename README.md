# Construction en blocs (WebXR)

Jeu de construction en blocs de bois peints en réalité virtuelle, pensé pour les
**personnes âgées**, qui fonctionne directement dans le navigateur du
**Meta Quest 3**, sans installation.

- On joue **assis**, avec un seul geste : le **pincement** (pouce + index).
- On suit un **mode guidé** : les cases de la première pièce sont colorées ;
  ensuite, on cherche la place en regardant le modèle. Une **lampe** sur la
  table allume un cadre qui montre l'emplacement ; il s'allume aussi de
  lui-même si une pièce n'est pas posée au bout de 30 secondes.
- Il n'y a ni chrono ni échec possible, et le texte est affiché en grand.
- Des sons doux et courts accompagnent les gestes (aucune voix) ; on peut les
  couper avec la case « Sons doux » de la page d'accueil.

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
| 5 | Premier modèle : voilier (14 briques), texte d'aide | en test |
| 6 | Déploiement GitHub Pages | à faire |

## Structure

```
index.html                 Page d'accueil et bouton « Entrer en réalité virtuelle »
styles/accueil.css         Styles de la page (contraste ≥ 7:1)
vendor/three/              Three.js 0.186.1 (copie locale, licence MIT)
vendor/webxr-input-profiles/  Modèles 3D des mains (licence MIT)
ressources/environnements/ Pièce photographiée « Lebombo » (photo + HDR, Poly Haven, CC0)
ressources/textures/chene/ Bois du plateau (Poly Haven, CC0)
ressources/textures/pin/   Bois des blocs et de la planchette (Poly Haven, CC0)
ressources/textures/feutrine/  Fibres du tapis de jeu (Poly Haven, CC0)
manifest.webmanifest       Application web installable (nom, icônes, couleurs)
ressources/icones/         Icônes du jeu (192 et 512 px, « maskable »), rendues par le jeu
modeles/catalogue.json     Modèles proposés sur l'accueil, rangés par famille
modeles/voilier.json       Le voilier (14 pièces)
modeles/baleine.json, girafe.json, lion.json, dragon.json   Animaux en formes arrondies (7 à 10 pièces)
modeles/maisonnette.json … marin.json   19 constructions simples (maisons, château,
                           citrouille, arbre, véhicules, animaux, personnages ;
                           5 à 12 pièces)
modeles/essai.json         Modèle d'essai de 3 briques
src/
  main.js                  Crée les modules et les relie (seul point d'assemblage)
  config.js                Tous les réglages ajustables
  coeur/scene.js           Scène, caméra, rendu « appareil photo », table en chêne
  coeur/ambiance.js        Pièce réelle (photo projetée au sol + éclairage HDR)
  coeur/lampe.js           Lampe suspendue : lumière chaude et ombres douces
  coeur/tapis.js           Tapis de jeu en feutrine vert sapin (contraste des pièces)
  coeur/qualiteAdaptative.js       Logique pure : baisse la qualité si l'affichage ralentit
  coeur/sessionXR.js       Démarrage et fin de la session WebXR
  entrees/mains.js         Suivi et affichage des mains, signalement des pincements
  entrees/detecteurPincement.js  Logique pure du pincement (deux seuils anti-tremblement)
  entrees/souris.js        Souris à la place des mains (mode « Essayer sans casque »)
  construction/brique.js   Pièces de bois peint, halo de survol, planchette gravée
  construction/formes.js   Géométrie des formes (pavé, pente, quart de rond, cylindre, pointe)
  construction/decors.js   Décors peints (yeux, visage, taches, écailles)
  construction/boisPeint.js        Matériau « bois peint » (pastel + nervures visibles)
  construction/niveauxGrain.js     Logique pure : contraste du grain de bois
  construction/saisie.js   Saisie, déplacement et relâchement des objets
  construction/maquetteFantome.js  Emplacement visé : volume translucide + contour net
  construction/accrochage.js       Logique pure : accrochage magnétique et glissement doux
  construction/historique.js       Pile d'actions pour « Annuler »
  construction/partie.js   Déroulé du mode guidé : présentation, puis une pièce à la fois
  construction/atelier.js  Installe le modèle choisi sur la table (et en change)
  construction/supports.js         Logique pure : où se pose une brique lâchée (chute douce)
  construction/aideEmplacement.js  Logique pure : quand montrer le cadre (lampe, coup de pouce)
  construction/ombreContact.js     Ombre douce au pied des objets posés
  construction/miniature.js        Modèle terminé en miniature (bouton « œil »)
  interface/bouton3D.js    Bouton 3D générique (« Annuler », « Voir le modèle »)
  interface/icones.js      Icônes dessinées (flèche retour, œil)
  interface/carteProgression.js    Nom du modèle et avancement, sans chrono
  interface/modeSansCasque.js      Bascule accueil ↔ mode souris (Échap pour revenir)
  interface/menuModeles.js         Choix du modèle sur l'accueil (cartes à boutons radio)
  interface/lampeAide.js           Lampe de bureau : interrupteur de l'aide à l'emplacement
  interface/vignettes.js           Vignettes des modèles, générées par le jeu
  interface/sons.js        Sons doux (Web Audio, sans fichier) : saisie, accrochage, réussite
  modeles/chargeurModele.js        Lecture, validation et conversion des modèles JSON
  modeles/catalogue.js     Lecture et validation du catalogue, tri par nombre de pièces
  modeles/duree.js         Durée indicative d'un modèle (Court, Moyen, Long)
tests/                     Tests des fonctions pures (node --test)
```

Les modules suivants (téléportation, texte d'aide) seront ajoutés au fil
des étapes.

## Ajouter un modèle

Un modèle est un fichier JSON dans `modeles/`. Les positions et tailles sont
en **cases** de 4 cm (un bloc 2 × 2 = 8 cm de côté), la hauteur en **couches**.
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
- `taille` : `[largeur, profondeur]` en cases, entiers ≥ 1.
- `couleur` : format `#rrggbb`.

Champs facultatifs :

| Champ | Valeurs | Par défaut |
|---|---|---|
| `forme` | `pave`, `pente`, `quartRond`, `cylindre`, `pointe` | `pave` |
| `sens` | `x+`, `x-`, `z+`, `z-` : direction vers laquelle une pente ou un quart de rond **descend** (obligatoire pour ces deux formes) | — |
| `axe` | `x` ou `z` : cylindre couché (debout sinon) | — |
| `hauteur` | hauteur en couches, par exemple `0.5`, `2`, `3` | `1` |
| `decor` | `{ "face": "z+", "motif": "visage" }` ; faces `x+`, `x-`, `z+`, `z-`, `y+` (dessus) ; motifs `oeil-sourire`, `oeil-rond`, `profil`, `visage`, `taches`, `ecailles`, `porte`, `fenetre`, `rayures`, `helice`, `fruits`, `hublots`, `visage-humain`, `visage-clown`, `citrouille` | — |

La face `z+` est celle tournée vers le joueur. Les motifs d'œil sont dessinés
pour un animal tourné vers la droite (`x+`).

Le modèle doit être **constructible dans l'ordre donné** : chaque pièce
au-dessus de la planchette doit reposer sur le **dessus plat** d'une pièce
listée avant elle (un pavé ou un cylindre debout : rien ne tient sur une pente,
un quart de rond, une pointe ou un cylindre couché), et deux pièces ne doivent
jamais occuper le même espace.

Un fichier mal écrit est refusé avec un message qui indique la brique fautive.
Pour proposer un modèle sur la page d'accueil, ajouter son nom de fichier
dans sa famille, dans `modeles/catalogue.json` :

```json
{ "familles": [{ "nom": "Animaux", "modeles": ["chien.json", "lion.json"] }] }
```

Les familles s'affichent dans l'ordre du fichier, chacune sous son titre, avec
une rangée de liens « Aller à » au-dessus. Dans une famille, le jeu range les
modèles du plus court au plus long (nombre de pièces ; à égalité, l'ordre du
fichier). Chaque carte indique une durée : « Court » jusqu'à 6 pièces,
« Moyen » jusqu'à 9, « Long » au-delà. Le premier modèle de la première
famille est choisi par défaut. Sa vignette est générée automatiquement.

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

### Tester sur ordinateur, à la souris (le plus simple)

1. Ouvrir <http://localhost:8000> et cliquer sur **« Essayer sans casque »**.
2. La souris remplace la main : cliquer sur la brique, la glisser jusqu'à
   l'emplacement fantôme, relâcher. Cliquer sur « Annuler » ou « Voir le
   modèle » pour les utiliser.
3. `Échap` ou « Revenir à l'accueil » pour revenir.

Ce mode teste tout le déroulé du jeu, mais pas la détection du pincement des
vrais doigts (couverte par les tests `node --test`, puis à valider en casque).

### Tester sur ordinateur avec l'émulateur WebXR

L'émulateur de Meta ne permet pas (encore) de déplacer facilement les mains
émulées : sa documentation indique que l'émulation des mains est « en cours de
développement ». Il reste utile pour vérifier l'entrée en VR.

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

## Installer sur le casque (application web et APK)

Le jeu est une application web installable (PWA) : `manifest.webmanifest`
donne son nom, ses icônes (`ressources/icones/`) et ses couleurs. L'APK
fabriqué avec Bubblewrap est un **lanceur** : il ouvre le jeu publié en ligne
(HTTPS obligatoire), le jeu lui-même n'est pas dans l'APK. D'après la
[documentation de Meta](https://developers.meta.com/horizon/documentation/web/pwa-packaging/) :

1. **Publier le jeu** : dépôt public, puis *Settings → Pages* : branche
   `main`, dossier racine. Le jeu est alors à
   `https://acrobat22.github.io/constructionVR/`. Le fichier `.nojekyll` fait
   servir tous les fichiers tels quels.
2. **Préparer les outils** (une fois) : Node.js 18 ou plus, JDK 17, puis
   `npm install --global @meta-quest/bubblewrap-cli`.
3. **Créer le projet APK**, dans un dossier hors de ce dépôt :
   `bubblewrap init --manifest=https://acrobat22.github.io/constructionVR/manifest.webmanifest --metaquest`.
   Identifiant proposé : `io.github.acrobat22.constructionvr` (à ne plus
   changer ensuite). Mode : *immersive*. Pas de paiement intégré (Horizon
   Billing : non). Bubblewrap crée la clé de signature
   (`android.keystore`) : **la garder précieusement, hors du dépôt**.
4. **Vérification du site (Digital Asset Links)** : sans elle, Meta indique
   qu'une application immersive ne se lance pas. Lire l'empreinte de la clé
   (`keytool -list -v -keystore android.keystore -alias android`), puis
   `bubblewrap fingerprint add <empreinte>` : cela produit `assetlinks.json`.
   Ce fichier doit être servi à la **racine du domaine** :
   `https://acrobat22.github.io/.well-known/assetlinks.json`. Un site de
   projet (`/constructionVR/`) ne peut pas le servir à cette adresse : il
   faut un second dépôt public nommé `acrobat22.github.io`, contenant
   `.nojekyll` et `.well-known/assetlinks.json`.
5. **Fabriquer et installer** : `bubblewrap build` (produit
   `app-release-signed.apk`), casque en mode développeur branché, puis
   `adb install app-release-signed.apk`. Le jeu apparaît dans la
   bibliothèque du casque.

Sans APK, on peut aussi ouvrir l'adresse du jeu dans le navigateur du casque
et l'ajouter aux favoris.

## Licences

- Projet : [MIT](LICENSE).
- Three.js : MIT, voir [vendor/three/LICENSE](vendor/three/LICENSE).
- Modèles des mains (`@webxr-input-profiles/assets` 1.0.20) : MIT, voir
  [vendor/webxr-input-profiles/LICENSE.md](vendor/webxr-input-profiles/LICENSE.md).
- Pièce « Lebombo » (Greg Zaal), textures « Oak Veneer 01 », « Kitchen Wood » et « Caban » :
  [Poly Haven](https://polyhaven.com/license), CC0 (domaine public). La photo
  a été réduite en 4096 × 2048 pour la mémoire du casque.
- Ambiance inspirée d'un puzzle CodePen (MIT, Cliff Pyles) : idées reprises,
  code non copié.
