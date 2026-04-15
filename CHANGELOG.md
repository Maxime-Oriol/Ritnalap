# Changelog

Toutes les modifications notables de Ritnalap sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
versioning [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- **Architecture adapter pour les agrégateurs de caméras** : `registerCameraAdapter({ id, label, desc, link, async fetch() })`. Chaque adapter est autonome (toggle on/off dans les réglages, aucune clé par défaut), renvoie une liste normalisée `{name, lat, lon, type, url, source, category, thumbnail}`. Ritnalap s'occupe du reste (injection dans SOURCES, chargement séquentiel dans `loadCameras`, rendu icône verte, statut, compteur). Ajouter un site = ~30 lignes self-contained.
- **ASFA (autoroutes FR)** : premier adapter registré. ~112 caméras agrégées par l'ASFA (APRR, Sanef, SAPN, Vinci, Cofiroute, Escota, AREA…) via `wt3.autoroutes-trafic.fr`. Streams MP4 live (CORS ouvert) + thumbnails JPG rafraîchis. Pipeline d'auth en 2 phases rejoué en fallback si le hash de profil tourne.
- **WorldCam** : second adapter, viewport-based. ~25 000+ webcams mondiales via `worldcam.eu`. API tile-based (JSON identique Leaflet slippy tiles), zoom 4-6 dots + zoom 7-15 markers individuels. Rechargement auto au pan/zoom via `camera.moveEnd`, debounce 400 ms, signature anti-refetch. Thumbnails 420×236 affichés dans le panneau info.
- **Support adapters viewport-based** : `registerCameraAdapter({ viewportBased: true, fetchViewport(N,S,E,W,zoom) })` — Ritnalap gère le debounce, la purge des anciennes entities, le cache par signature bbox+zoom. Ajouter un site viewport-based = ~30 lignes, même pattern que les one-shot.
- **Support `type: "video"` avec `thumbnail`** dans le panneau info : poster JPG affiché le temps que le MP4 charge. Thumbnails aussi pour les iframes (WorldCam, etc.).

### Modifié
- **Windy Webcams : chargement viewport-based** via l'endpoint `/webcams/api/v3/map/clusters` (au lieu de la pagination offset). Sur `camera.moveEnd` (debounce 400 ms), Ritnalap calcule la bbox visible et le zoom Windy compatible, envoie une seule requête, et Windy renvoie les caméras agrégées côté serveur (`clusterSize`). Les clusters serveur sont rendus comme des pastilles vertes avec compte ; clic = flyTo pour zoomer dessus. Cache par signature bbox+zoom pour éviter les refetch. Quand le viewport est trop large (vue globale), statut « zoom in pour charger » et aucune requête. Gain : 1 requête/viewport au lieu de ~100, charge fluide même à 25 000 webcams, pas de pile de 5 000+ entities à clusteriser localement. Champ `WINDY_MAX_WEBCAMS` retiré des réglages (plus pertinent).
- **Couleurs unifiées par type de point** : avions bleu (`#4fb3ff`), satellites orange (`#ffb347`), caméras vert unique (`#3ec45f`). Suppression de la palette par catégorie (trafic/ville/nature/port). Clusters caméras en dégradé de verts selon la densité (cohérence visuelle avec le type).
- **Caméras plus grandes** : canvas icône 32×32 → 40×40, scale 0.7 → 1.1 (points nettement plus repérables).
- **Caméras location-only** : même vert que les caméras actives, mais forme en losange au lieu de cercle pour les distinguer visuellement.
- **Trails avions** : le toggle `isEnabled("trails")` est maintenant réellement câblé dans le `show` des polylines. Trait épaissi (width 3, alpha 0.9).

### Ajouté
- **15 caméras françaises ajoutées à la liste curée** (Skyline Webcams, flux iframe stables) : Tour Eiffel, Montmartre, Arc de Triomphe, Chamonix, Nice, Cannes, Marseille, Saint-Tropez, Biarritz, La Rochelle, Étretat, Mont Saint-Michel, Lyon, Bordeaux, Val Thorens, Courchevel. Catégories : city / port / nature.

### Retiré
- Source « Caméras FR (positions) » et agrégation de portails OpenData : vérification faite sur 9+ portails OpenDataSoft (Paris, Toulouse, Nantes, Rennes, Strasbourg, Bordeaux, Montpellier, Nice, Lille), **aucun ne publie de dataset de positions de caméras** (ni vidéoprotection, ni trafic). La vidéoprotection étant sensible, les collectivités n'exposent pas ces données en OpenData. Feature retirée ; on s'appuie désormais sur Windy Webcams (~1500 points FR) + curated enrichi.
- **Clustering des caméras** selon le zoom (Cesium `EntityCluster`, pixelRange 45, seuil 3) : points agglomérés en pastilles colorées (bleu < 100, orange < 1000, rouge > 1000) pour éviter la saturation visuelle sur Paris et autres zones denses.

- Contours des pays / continents affichés en overlay (GeoJSON Natural Earth 110m, bleu Ritnalap), contours seuls, Antarctique filtré pour éviter les crashs de tessellation Cesium.
- Trails temps réel pour les avions : trajectoire récente (30 dernières positions) en polyline, segments droits, affichés uniquement quand ≥ 2 points.
- Bouton **⟳ Refresh** dans la topbar — relance à la main toutes les sources et recharge le catalogue de caméras.
- Bouton **⏸/▶ Auto** — active/désactive tout l'auto-refresh sans recharger la page.
- Import de `credentials.json` OpenSky (OAuth2) directement depuis les réglages.
- Support OAuth2 Client Credentials OpenSky (Bearer token, cache 30 min) en plus du Basic Auth legacy.
- Cache TLE CelesTrak en localStorage (TTL 12 h, fallback sur cache expiré en cas de 429).
- 511.org Bay Area désormais correctement marqué comme nécessitant une clé (leur API n'est pas ouverte).
- Rafraîchissement périodique auto calé sur les quotas réels : OpenSky 100 s (auth) / 15 min (anon), satellites propagés à 1 Hz, TLE 6 h, catalogues caméras 30 min.
- Menu Électron **Édition** natif (Couper/Copier/Coller) pour que les raccourcis Ctrl+C/V/X fonctionnent.

### Corrigé
- Crash `RangeError: Invalid array length` lors du rendu Cesium (tessellation GeoJSON + trails invalides).
- **Crash `Invalid array length` dans `createPotentiallyVisibleSet`** quand >4000 caméras chargées : causé par les labels avec `distanceDisplayCondition` qui saturaient le frustum culling de Cesium. Fix : labels permanents limités aux caméras curated (12 points) ; pour les autres sources (Windy/TfL/Caltrans), le nom s'affiche au clic dans le panneau latéral. Gain : zéro crash, démarrage fluide même avec ~5000 entities cumulées.
- Chargement des caméras séquentiel (était en `Promise.all`) avec layer caché + clustering désactivé pendant l'insertion, réactivation après `requestAnimationFrame` × 2, pour éviter les états intermédiaires du scene graph Cesium.
- Cache des `dataURL` des icônes caméras (`makeCameraIcon`, `makeLocationDot`) pour éviter 4000+ créations de canvas identiques.
- Handler `scene.renderError` en place pour empêcher le freeze total — affiche désormais un overlay rouge avec stack trace et bouton de téléchargement du log de debug.
- Flags URL de debug : `?safe=1` (désactive toutes les couches), `?nocluster=1` (désactive le clustering), `?nolabels=1` (désactive les labels), `?only=<source_id>` (ne charge qu'une source).
- Saisie de texte bloquée dans les réglages quand la source était désactivée (retrait de `pointer-events: none`).
- Positions avions/caméras invalides (NaN, hors bornes, Null Island) maintenant filtrées en amont.

## [0.1.0] — 2026-04-15

### Ajouté
- Globe 3D interactif Cesium (OpenStreetMap ou Cesium Ion HD).
- Flux avions temps réel via OpenSky Network.
- Flux satellites via TLE CelesTrak + propagation `satellite.js` (jusqu'à 2000 objets).
- Caméras publiques multi-sources :
  - Liste curée (Times Square, Tour Eiffel, Shibuya, volcans, ports…)
  - Windy Webcams API (opt-in, désactivé par défaut)
  - Transport for London (JamCams)
  - Caltrans (districts 3/4/7/8/11/12)
  - 511 NY, WSDOT, FL 511, 511.org Bay Area
- Écran de réglages avec toggles d'activation par source et liens vers les pages d'inscription.
- Stockage des clés API chiffré via `safeStorage` (Electron) ou `localStorage` (fallback navigateur).
- Bypass CORS + strip `X-Frame-Options`/CSP en mode Electron.
- Barre de statut bas : logo, version, compteurs, alerte agrégée des sources KO.
- Packaging Windows via `electron-builder` (NSIS + portable).
- Logo SVG dédié (palantír + anneaux orbitaux + satellites).

### Limites connues
- Les endpoints DOT US (Caltrans, NY511, etc.) nécessitent le mode Electron pour passer CORS.
- Certains flux YouTube embeddés dans la liste curée peuvent expirer et nécessiter une actualisation manuelle.
