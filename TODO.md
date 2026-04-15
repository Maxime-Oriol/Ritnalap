# Ritnalap — TODO

Choses à faire pour parfaire l'app. Coche au fur et à mesure.

## Windy / performance caméras
- [x] Passer `loadWindy()` sur l'endpoint `/map/clusters` (viewport-based, 1 requête par pan/zoom au lieu de 100 pages)
- [x] Recharger les caméras Windy sur `camera.moveEnd` avec debounce (~400 ms)
- [x] Rendre les clusters serveur Windy (`clusterSize > 1`) comme des pastilles agrégées distinctes
- [x] Afficher "zoom in pour charger" quand le viewport dépasse les limites API Windy
- [x] Retirer le champ `WINDY_MAX_WEBCAMS` des réglages (plus pertinent)

## Agrégateurs de caméras (adapter pattern)
- [x] Architecture pluggable one-shot : `registerCameraAdapter({ id, label, desc, link, fetch })` — 1 bloc auto-registré dans les réglages
- [x] Architecture pluggable viewport-based : `registerCameraAdapter({ viewportBased: true, fetchViewport(N,S,E,W,zoom) })` — rechargement au pan/zoom avec debounce + purge
- [x] ASFA (autoroutes FR) : ~112 caméras autoroutes via pipeline d'auth `wt3.autoroutes-trafic.fr` (+ fallback dynamique)
- [x] WorldCam : ~25 000+ webcams mondiales viewport-based via tiles JSON (`worldcam.eu`)
- [ ] Sytadin / DIRIF (Île-de-France urbain)
- [ ] Bison Futé / tipi.bison-fute.gouv.fr
- [ ] EarthCam (si API accessible)
- [ ] Insecam (caméras publiques non sécurisées mondiales)
- [ ] Autres sites à me partager → je rajoute au fur et à mesure

## UX / visuel
- [ ] Filtres caméras par catégorie (trafic / ville / nature / port) via toggles dans la topbar
- [ ] Recherche par callsign avion ou nom de satellite
- [ ] Au clic sur un satellite : afficher l'orbite prédite (prochaine révolution)
- [ ] Panneau info : meilleur layout pour les caméras (preview + lien externe)
- [ ] Légende des couleurs/formes accessible depuis la topbar

## Sources de données
- [ ] Ajouter Texas DOT (https://its.txdot.gov/its/)
- [ ] Ajouter Ohio DOT et PennDOT (APIs ouvertes)
- [ ] Scraper Sytadin (Île-de-France) pour caméras autoroute FR
- [ ] Mode offline : cacher les TLE CelesTrak en local pour fonctionner sans réseau

## Packaging
- [ ] Générer `build/icon.ico` et `build/icon.png` depuis `build/logo.svg`
- [ ] Signature Authenticode du `.exe` Windows (évite warning SmartScreen)
- [ ] Auto-updater via GitHub Releases (`electron-updater`)
- [ ] Build macOS (.dmg) et Linux (.AppImage) en plus du Windows

## Dette / robustesse
- [ ] Bundler Cesium + satellite.js + hls.js en local (vs jsDelivr) pour 100 % offline
- [ ] Vérifier / remplacer les URLs YouTube Live mortes dans `CURATED`
- [ ] Tests de non-régression sur le crash `Invalid array length` (cas limite : 10k+ entities)
- [ ] Limiter le cap satellites depuis les réglages (au lieu de hardcodé à 2000)

## Idées à explorer
- [ ] Heatmap densité trafic aérien mondial
- [ ] Mode "replay" : rejouer les N dernières minutes d'avions depuis un buffer local
- [ ] Affichage ISS avec track au sol + position équipage live
- [ ] Support ADS-B local (brancher un SDR → OpenSky en local)
