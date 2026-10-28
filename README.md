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
| 2 | Saisie par pincement | à faire |
| 3 | Accrochage, maquette fantôme, annulation | à faire |
| 4 | Téléportation par pastilles | à faire |
| 5 | Premier modèle : voilier | à faire |
| 6 | Déploiement GitHub Pages | à faire |

## Structure

```
index.html                 Page d'accueil et bouton « Entrer en réalité virtuelle »
styles/accueil.css         Styles de la page (contraste ≥ 7:1)
vendor/three/              Three.js 0.186.1 (copie locale, licence MIT)
src/
  main.js                  Crée les modules et les relie (seul point d'assemblage)
  config.js                Tous les réglages ajustables
  coeur/scene.js           Scène, caméra, lumières, sol, table, moteur de rendu
  coeur/sessionXR.js       Démarrage et fin de la session WebXR
  entrees/mains.js         Suivi et affichage des mains
```

Les modules suivants (pincement, briques, téléportation, interface, modèles
JSON) seront ajoutés au fil des étapes.

## Lancer le projet en local

Les modules JavaScript ne se chargent pas en ouvrant le fichier directement
(`file://`) : il faut un petit serveur local. Python 3 suffit :

```sh
python3 -m http.server 8000
```

Ouvrir ensuite <http://localhost:8000>. WebXR exige une adresse sécurisée :
`localhost` est accepté, mais une adresse IP en `http://` ne l'est pas.

### Tester sur ordinateur (sans casque)

1. Installer l'extension **Immersive Web Emulator** (Meta) dans Chrome ou Edge :
   [Chrome Web Store](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik).
2. Ouvrir <http://localhost:8000>, puis activer l'émulateur pour ce site avec
   le bouton de l'extension. La page se recharge.
3. Dans l'émulateur, passer en mode **mains** (hand tracking).
4. Cliquer sur « Entrer en réalité virtuelle » : les deux mains s'affichent en
   sphères au-dessus de la table.

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
