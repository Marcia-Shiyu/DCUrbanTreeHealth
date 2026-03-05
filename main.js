mapboxgl.accessToken = MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

const LAYERS = {
  disease:        "trees_disease",
  condition:      "trees_condition",
  wardsHighlight: "wards_highlight",
};

const FIELDS = {
  disease:    "DISEASE",
  condition:  "CONDITION",
  commonName: "CMMN_NM",
  sciName:    "SCI_NM",
  ward:       "WARD",
  dbh:        "DBH",
  obsDate:    "CONDITIODT",
  vicinity:   "VICINITY",
  pests:      "PESTS",
  notes:      "TREE_NOTES",
  crownArea:  "CROWN_AREA",
  datePlant:  "DATE_PLANT",
};

const INITIAL_VIEW = {
  center: [-77.0369, 38.9072],
  zoom: 11,
  bearing: 0,
  pitch: 0,
  offset: [150, -80],
};

// Global state
const STATE = {
  mode:         "disease",
  ward:         null,
  disease:      null,
  condition:    null,
  species:      null,
  dbhRange:     [0, 200],
  obsDateRange: [2020, 2025],
};

// Load pre-computed ward stats
let WARD_STATS = null;

fetch("ward_stats.json")
  .then((res) => res.json())
  .then((data) => {
    WARD_STATS = data;
    if (typeof window.initSidebar === "function") {
      window.initSidebar(WARD_STATS);
    }
  })
  .catch((err) => console.error("Failed to load ward_stats.json", err));

// Map init
const map = new mapboxgl.Map({
  container: "map",
  style: MAP_STYLE,
  center: INITIAL_VIEW.center,
  zoom: INITIAL_VIEW.zoom,
  maxZoom: 18,
  maxBounds: [
    [-77.65, 38.60],
    [-76.55, 39.20],
  ],
});

window.resetView = function () {
  map.flyTo({ ...INITIAL_VIEW, duration: 700 });
};

map.addControl(new mapboxgl.NavigationControl(), "top-right");

class ResetViewControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

    const button = document.createElement("button");
    button.type = "button";
    button.title = "Reset View";
    button.innerHTML = "↺";
    button.onclick = () => window.resetView();

    this._container.appendChild(button);
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

map.addControl(new ResetViewControl(), "top-right");

// Build a Mapbox "match" expression from a color map object
function buildMatchExpression(field, colorMap, fallback = "#888") {
  return ["match", ["get", field], ...Object.entries(colorMap).flat(), fallback];
}

// Helpers
function layerExists(id) {
  return !!map.getLayer(id);
}

function setLayerVisibility(layerId, visible) {
  if (!layerExists(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

function hideAllDataLayers() {
  setLayerVisibility(LAYERS.disease,   false);
  setLayerVisibility(LAYERS.condition, false);
}

// Build a Mapbox filter expression for the given mode
function buildFilterForMode(mode) {
  const filters = ["all"];

  // ward filter
  if (STATE.ward !== null) {
    filters.push(["==", ["to-number", ["get", FIELDS.ward]], +STATE.ward]);
  }

  // species filter
  if (STATE.species !== null) {
    filters.push(["==", ["get", FIELDS.commonName], STATE.species]);
  }

  // DBH filter (only if narrowed)
  const [dbhLo, dbhHi] = STATE.dbhRange || [0, 200];
  if (dbhLo > 0 || dbhHi < 200) {
    filters.push([">=", ["to-number", ["coalesce", ["get", FIELDS.dbh], 0]], dbhLo]);
    filters.push(["<=", ["to-number", ["coalesce", ["get", FIELDS.dbh], 0]], dbhHi]);
  }

  // mode-specific filters
  if (mode === "disease") {
    if (STATE.disease !== null) {
      filters.push(["==", ["get", FIELDS.disease], STATE.disease]);
    }
  } else if (mode === "condition") {
    if (STATE.condition !== null) {
      filters.push(["==", ["get", FIELDS.condition], STATE.condition]);
    }

    // date filter (only if narrowed)
    const [dateMin, dateMax] = STATE.obsDateRange || [2020, 2025];
    if (dateMin > 2020 || dateMax < 2025) {
      const startMs = new Date(dateMin, 0, 1).getTime();
      const endMs   = new Date(dateMax, 11, 31, 23, 59, 59).getTime();
      filters.push([">=", ["get", FIELDS.obsDate], startMs]);
      filters.push(["<=", ["get", FIELDS.obsDate], endMs]);
    }
  }

  return filters.length > 1 ? filters : null;
}

// Apply filters to both layers simultaneously
function applyCombinedFilter() {
  if (!layerExists(LAYERS.disease) || !layerExists(LAYERS.condition)) return;

  const diseaseFilter   = buildFilterForMode("disease");
  const conditionFilter = buildFilterForMode("condition");

  map.setFilter(LAYERS.disease,   diseaseFilter);
  map.setFilter(LAYERS.condition, conditionFilter);

  const activeFilter = STATE.mode === "disease" ? diseaseFilter : conditionFilter;
  syncFilterCount(activeFilter);
}

function syncFilterCount(filter) {
  if (!map.getSource("trees-src")) return;
  const params = filter ? { filter } : {};
  try {
    const feats = map.querySourceFeatures("trees-src", params) || [];
    const count = new Set(feats.map((f) => f.id)).size;
    if (typeof window.updateFilterCount === "function") {
      window.updateFilterCount(count);
    }
  } catch (err) {
    console.error("[syncFilterCount] querySourceFeatures error:", err);
  }
}

// Called by modebar.js
window.setMode = function (mode) {
  if (mode !== "disease" && mode !== "condition") return;

  STATE.mode = mode;

  hideAllDataLayers();
  setLayerVisibility(LAYERS[mode], true);

  // reset filters, keep ward
  STATE.disease      = null;
  STATE.condition    = null;
  STATE.species      = null;
  STATE.dbhRange     = [0, 200];
  STATE.obsDateRange = [2020, 2025];

  applyCombinedFilter();

  if (typeof window.updateSidebarCharts === "function") {
    window.updateSidebarCharts(STATE.ward, mode, WARD_STATS);
  }

  if (typeof window.rebuildFilterPanel === "function") {
    window.rebuildFilterPanel(mode);
  }
};

// Called by sidebar.js
window.setRegion = function (ward) {
  STATE.ward = ward;

  if (layerExists(LAYERS.wardsHighlight)) {
    setLayerVisibility(LAYERS.wardsHighlight, ward !== null);
    if (ward === null) {
      map.setFilter(LAYERS.wardsHighlight, null);
    } else {
      map.setFilter(LAYERS.wardsHighlight, ["==", ["to-number", ["get", FIELDS.ward]], +ward]);
    }
  }

  applyCombinedFilter();

  if (typeof window.updateSidebarCharts === "function") {
    window.updateSidebarCharts(ward, STATE.mode, WARD_STATS);
  }
};

// Called by filter.js
window.setFilterState = function (filterUpdate) {
  Object.assign(STATE, filterUpdate);
  applyCombinedFilter();
};

window.clearFilters = function () {
  STATE.disease      = null;
  STATE.condition    = null;
  STATE.species      = null;
  STATE.dbhRange     = [0, 200];
  STATE.obsDateRange = [2020, 2025];

  if (typeof window.rebuildFilterPanel === "function") {
    window.rebuildFilterPanel(STATE.mode);
  }
  applyCombinedFilter();
};

// Map load
map.on("load", () => {

  // Sources
  map.addSource("trees-src", {
    type: "geojson",
    data: "./Urban_Forestry_Street_Trees_Disease.geojson",
    generateId: true,
  });

  map.addSource("wards-src", {
    type: "geojson",
    data: "./Ward_2022_Project.geojson",
  });

  // Ward outline
  map.addLayer({
    id: "wards_outline",
    type: "line",
    source: "wards-src",
    paint: {
      "line-color": "#2e5272",
      "line-width": 1.5,
      "line-opacity": 0.5,
    },
  });

  // Ward highlight (filtered by setRegion)
  map.addLayer({
    id: "wards_highlight",
    type: "fill",
    source: "wards-src",
    paint: {
      "fill-color": "#2e5272",
      "fill-opacity": 0.1,
    },
  });

  // Disease layer
  map.addLayer({
    id: "trees_disease",
    type: "circle",
    source: "trees-src",
    paint: {
      "circle-color": buildMatchExpression("DISEASE", DISEASE_COLORS),
      "circle-radius": 5,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "rgba(255,255,255,0.7)",
      "circle-opacity": 0.85,
    },
  });

  // Condition layer
  map.addLayer({
    id: "trees_condition",
    type: "circle",
    source: "trees-src",
    paint: {
      "circle-color": buildMatchExpression("CONDITION", CONDITION_COLORS),
      "circle-radius": 5,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "rgba(255,255,255,0.7)",
      "circle-opacity": 0.85,
    },
  });

  window.setMode("disease");
  map.resize();
  map.jumpTo(INITIAL_VIEW);

  // Popup
  const popup = new mapboxgl.Popup({
    closeButton:  true,
    closeOnClick: false,
    maxWidth:     "320px",
    offset:       12,
  });

  function formatDate(ts) {
    if (!ts) return "—";
    const d = new Date(Number(ts));
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }


  function buildPopupHTML(p) {
    const common    = p[FIELDS.commonName] || "Unknown tree";
    const sci       = p[FIELDS.sciName]    || "";
    const disease   = p[FIELDS.disease]    || "—";
    const cond      = p[FIELDS.condition]  || "—";
    const dbh       = p[FIELDS.dbh]       ? `${(+p[FIELDS.dbh]).toFixed(1)}"` : "—";
    const crown     = p[FIELDS.crownArea] ? `${Math.round(+p[FIELDS.crownArea])} ft²` : "—";
    const ward      = p[FIELDS.ward]      || "—";
    const observed  = formatDate(p[FIELDS.obsDate]);
    const planted   = formatDate(p[FIELDS.datePlant]);
    const vicinity  = (p[FIELDS.vicinity] || "").trim();
    const pests     = (p[FIELDS.pests]    || "").trim();
    const notes     = (p[FIELDS.notes]    || "").trim();
    const condColor = CONDITION_COLORS[cond] || "#adb5bd";

    const row = (label, val) =>
      `<div><div style="font-size:10px;letter-spacing:.12em;color:#666;font-family:var(--font-mono);">${label}</div>` +
      `<div style="font-size:13px;">${val}</div></div>`;

    const extra = [
      pests ? `<div style="margin-top:5px;font-size:12px;"><span style="color:#666;font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;">PESTS  </span>${pests}</div>` : "",
      notes ? `<div style="margin-top:4px;font-size:12px;"><span style="color:#666;font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;">NOTES  </span>${notes}</div>` : "",
    ].join("");

    return `
      <div style="min-width:200px;font-family:var(--font-display);">
        <div style="font-weight:700;font-size:14px;margin-bottom:2px;">${common}</div>
        ${sci ? `<div style="font-style:italic;font-size:12px;color:#666;margin-bottom:10px;">${sci}</div>` : ""}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div>${row("DISEASE", `<span style="color:#9a3a3a;">${disease}</span>`)}</div>
          <div>${row("CONDITION", `<span style="color:${condColor};">${cond}</span>`)}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.1);margin-bottom:8px;">
          ${row("TRUNK DIAM.", dbh)}
          ${row("CROWN AREA", crown)}
          ${row("WARD", ward)}
          ${row("OBSERVED", observed)}
          ${planted !== "—" ? row("PLANTED", planted) : ""}
        </div>
        ${vicinity ? `<div style="padding-top:7px;border-top:1px solid rgba(0,0,0,0.1);font-size:11px;color:#666;font-family:var(--font-mono);">${vicinity}</div>` : ""}
        ${extra}
      </div>`;
  }

  let layerClickFired = false;

  [LAYERS.disease, LAYERS.condition].forEach((layerId) => {
    map.on("mouseenter", layerId, () => {
      if (map.getLayoutProperty(layerId, "visibility") !== "none")
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("click", layerId, (e) => {
      if (!e.features?.length) return;
      if (map.getLayoutProperty(layerId, "visibility") === "none") return;
      layerClickFired = true;
      popup.setLngLat(e.lngLat).setHTML(buildPopupHTML(e.features[0].properties || {})).addTo(map);
    });
  });

  map.on("click", () => {
    if (layerClickFired) { layerClickFired = false; return; }
    popup.remove();
  });
});
