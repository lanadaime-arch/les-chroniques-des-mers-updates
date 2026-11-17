# Correction du flash de l'ancien menu à l'ouverture — 18 novembre 2026

## Constat sur la vidéo Windows

Au lancement de l'application Windows actuelle, l'ancien écran d'accueil « Ton aventure t'attend » apparaît pendant une fraction de seconde avant le véritable menu illustré. Le problème n'est pas un effet graphique : c'est l'ordre de chargement de la page racine et de la redirection vers la version sélectionnée.

## Cause identifiée

L'EXE actuel ouvre la racine du site. Celle-ci charge l'ancien `game.js` immédiatement. Le gestionnaire de versions ne vérifie la version active qu'au `DOMContentLoaded` et réalise un appel HTTP `HEAD` avant la redirection. Pendant ce délai, la page ancienne peut se rendre. Le problème est donc reproductible après installation des nouvelles versions.

## Correction dans la racine, sans reconstruire l'EXE

- La racine lit **dès le `head`** la version installée en local, avant le premier rendu.
- Si une version moderne est sélectionnée, l'ancien `game.js` **n'est même plus chargé**, et la racine reste invisible pendant la vérification. Aucune nouvelle interface ni nouveau launcher ne s'intercale.
- Le gestionnaire confirme ensuite la version cible et effectue `location.replace`, sans polluer l'historique.
- En cas de connexion indisponible, le système vérifie la version déjà téléchargée dans Cache Storage et tente de l'ouvrir normalement.
- En cas de version supprimée (HTTP 404/410), la racine restaure son ancien fonctionnement comme solution de secours. L'ancienne sauvegarde n'est pas modifiée.
- Le cache du service worker de la racine change de version pour faciliter la livraison de la page corrigée sans supprimer les caches `versions/v...`.

## Version de jeu

Il s'agit d'un **correctif du lancement partagé**, pas d'une modification de gameplay. Le catalogue reste en V1.4.6 et toutes les 18 versions restent présentes ; aucune V1.4.7 de façade n'est créée.

## Contrôle réel

Les tests automatisés vérifient que l'ancien jeu n'est pas injecté pendant la redirection, que le repli reste possible et que les sauvegardes n'y sont pas touchées. La preuve finale sera un nouveau lancement dans l'application Windows habituelle, idéalement filmé en cas de problème. Un écran de chargement artistique reste un projet ultérieur distinct.
