# Les Chroniques des Mers — dépôt de diffusion

Ce dépôt public est réservé aux **versions web validées** de *Les Chroniques des Mers*. Le dépôt de développement principal est privé.

## État
Une **page d'attente uniquement** (`index.html`) est publiée dans `main`. **Le jeu n'a pas été transféré dans ce dépôt**. Pour publier réellement le jeu, il faudra valider explicitement la diffusion publique de ses fichiers JavaScript, CSS, données et images.

## Activer GitHub Pages
Dans [Settings → Pages](https://github.com/lanadaime-arch/les-chroniques-des-mers-updates/settings/pages), sélectionner **Deploy from a branch**, puis **main** / **/(root)** et enregistrer.

Adresse prévue après activation : https://lanadaime-arch.github.io/les-chroniques-des-mers-updates/

## Publication du jeu après validation
Le dépôt privé [les-chroniques-des-mers](https://github.com/lanadaime-arch/les-chroniques-des-mers) contient un workflow « Publier le jeu web (GitHub Pages, sans Netlify) ». Pour l'utiliser, il faudra un jeton GitHub fine-grained avec accès **Contents: Read and write** sur **ce seul dépôt public**, stocké **uniquement** dans le secret `CHRONIQUES_DISTRIBUTION_TOKEN` du dépôt privé. Ne jamais envoyer ce jeton dans une conversation ni le publier dans un commit.

Une version web publique **n'est pas une mise à jour Android signée**. Le futur canal APK demandera une clé distincte, une signature cryptographique et un mécanisme de rollback.

**Sauvegardes :** aucune synchronisation automatique entre Netlify et GitHub Pages ; exporter/importer avant de changer de site. Chaque installation web possède son propre stockage local.
