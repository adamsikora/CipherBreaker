1. Download map in .osm.pbf format from: http://download.geofabrik.de/europe/czech-republic.html
2. Put it to data/map/input/
3. Run `uv run parse-osm data/map/input/czech-republic-latest.osm.pbf`, it creates in data/map/output/:
   - czech-republic-latest_raw.cbmap - parsed features before postprocessing, `name;lat;lon` lines
   - czech-republic-latest.cbmap - postprocessed map for the app
4. Copy czech-republic-latest.cbmap to app assets as Czechia.cbmap
