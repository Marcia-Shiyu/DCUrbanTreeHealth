(function () {

  // Species list for the dropdown
  const SPECIES_OPTIONS = [
    "Accolade elm",
    "Alleghany serviceberry",
    "American Holly",
    "American beech",
    "American elm",
    "American hop hornbeam",
    "American hornbeam",
    "American linden",
    "American sycamore",
    "Amur maple",
    "Ash",
    "Augustine elm",
    "Bald cypress",
    "Birch",
    "Black Cherry",
    "Black locust",
    "Black oak",
    "Black walnut",
    "Blackgum",
    "Bloodgood london plane tree",
    "Bosque Elm",
    "Boxelder maple",
    "Bradford callery pear",
    "Bur oak",
    "Butterfly magnolia",
    "Cherry",
    "Cherry (Snowgoose)",
    "Chestnut oak",
    "Chinese Fringetree",
    "Chinese elm",
    "Chinese flame tree",
    "Chinese pistache",
    "Chokecherry",
    "Columnar English oak",
    "Crabapple",
    "Crape myrtle",
    "Dawn redwood",
    "Deodar cedar",
    "Dogwood",
    "Downy serviceberry",
    "Dura heat' river birch",
    "Eastern Cottonwood",
    "Eastern red-cedar",
    "Eastern redbud",
    "Elm",
    "Elm (Accolade)",
    "Espresso Kentucky coffeetree",
    "European beech",
    "Exclamation London planetree",
    "Forest Pansy redbud",
    "Fringetree",
    "Ginkgo",
    "Ginkgo (female)",
    "Ginkgo (male)",
    "Golden rain tree",
    "Green Pillar Oak",
    "Green Vase Japanese zelkova",
    "Green ash",
    "Hackberry",
    "Halka zelkova",
    "Hedge maple",
    "Honeylocust",
    "Hornbeam",
    "Horsechestnut",
    "Japanese zelkova",
    "Jefferson Elm",
    "Katsuratree",
    "Kentucky coffeetree",
    "Kwanzan cherry",
    "Lilac",
    "Linden",
    "Little volunteer Tuliptree",
    "Littleleaf linden",
    "London plane tree",
    "Magnolia",
    "Maple",
    "Moraine honeylocust",
    "New Harmony elm",
    "Norway Spruce",
    "Norway maple",
    "Nuttall oak",
    "Oak",
    "October Glory red maple",
    "Okame cherry",
    "Oklahoma Redbud",
    "Overcup oak",
    "Pin oak",
    "Poplar",
    "Post Oak",
    "Princeton elm",
    "Prunus x yedoensis",
    "Purple leaf plum",
    "Red Buckeye",
    "Red horsechestnut",
    "Red maple",
    "Red oak",
    "Redbud",
    "Redmond American Linden",
    "River birch",
    "Rock chestnut oak",
    "Rotundiloba sweetgum",
    "Saucer magnolia",
    "Sawtooth oak",
    "Scarlet oak",
    "Serviceberry",
    "Shademaster honeylocust",
    "Shantung maple",
    "Shingle oak",
    "Shumard oak",
    "Siberian elm",
    "Silver linden",
    "Silver maple",
    "Skyline honeylocust",
    "Slender Silhouette Sweetgum",
    "Smooth-leaf Elm",
    "Snowdrift crabapple",
    "Southern catalpa",
    "Southern magnolia",
    "Southern red oak",
    "Sugar maple",
    "Sugarberry",
    "Swamp white oak",
    "Sweetgum",
    "Sweetgum (Happidaze)",
    "Sweetgum (sterile)",
    "Thornless honeylocust",
    "Tree-of-heaven",
    "Tulip poplar",
    "Tuliptree",
    "Water oak",
    "White Mulberry",
    "White oak",
    "White pine",
    "Wildfire blackgum",
    "Willow oak",
    "Yellow buckeye",
    "Yellowwood",
    "Yoshino cherry",
  ];

  const DBH_MIN = 0;
  const DBH_MAX = 200;
  const DATE_MIN = 2020;
  const DATE_MAX = 2025;

  // Called by main.js on mode switch
  window.rebuildFilterPanel = function (mode) {
    if (mode === "disease") {
      renderDiseaseFilters();
    } else if (mode === "condition") {
      renderConditionFilters();
    }
  };

  // Render default filter on page load
  renderDiseaseFilters();

  // Called by main.js to update the tree count
  window.updateFilterCount = function (count) {
    const el = document.getElementById("filter-count");
    if (el) el.textContent = `${count.toLocaleString()} trees shown`;
  };

  function renderDiseaseFilters() {
    const container = document.getElementById("filter-panel");
    if (!container) {
      console.warn("[filter.js] #filter-panel not found");
      return;
    }

    container.innerHTML = `
      <div class="filter-title">Filter</div>

      <div class="filter-group">
        <label class="filter-label">Disease</label>
        <div id="chip-disease" class="filter-chips"></div>
      </div>

      <div class="filter-group">
        <label class="filter-label">Species</label>
        <select id="filter-species" class="filter-select">
          <option value="">All</option>
          ${SPECIES_OPTIONS.map((s) => `<option value="${s}">${s}</option>`).join("")}
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Trunk Diameter (in.): <span id="dbh-display">${DBH_MIN} – ${DBH_MAX}</span></label>
        <div class="slider-row">
          <input type="range" id="dbh-min" class="filter-slider"
            min="${DBH_MIN}" max="${DBH_MAX}" value="${DBH_MIN}" step="1">
          <input type="range" id="dbh-max" class="filter-slider"
            min="${DBH_MIN}" max="${DBH_MAX}" value="${DBH_MAX}" step="1">
        </div>
      </div>

      <div class="filter-divider"></div>
      <button id="btn-clear-filter" class="filter-clear-btn">Clear All Filters</button>
      <div id="filter-count" class="filter-count">— trees shown</div>
    `;

    buildChips(document.getElementById("chip-disease"), Object.keys(DISEASE_COLORS), DISEASE_COLORS,
      (val) => window.setFilterState({ disease: val }));
    bindSelect("filter-species", (val) => window.setFilterState({ species: val || null }));
    bindDualSlider("dbh-min", "dbh-max", "dbh-display", (range) =>
      window.setFilterState({ dbhRange: range })
    );
    document.getElementById("btn-clear-filter").addEventListener("click", () => {
      if (typeof window.clearFilters === "function") window.clearFilters();
    });
  }

  function renderConditionFilters() {
    const container = document.getElementById("filter-panel");
    if (!container) return;

    container.innerHTML = `
      <div class="filter-title">Filter</div>

      <div class="filter-group">
        <label class="filter-label">Condition</label>
        <div id="chip-condition" class="filter-chips"></div>
      </div>

      <div class="filter-group">
        <label class="filter-label">Species</label>
        <select id="filter-species" class="filter-select">
          <option value="">All</option>
          ${SPECIES_OPTIONS.map((s) => `<option value="${s}">${s}</option>`).join("")}
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Trunk Diameter (in.): <span id="dbh-display">${DBH_MIN} – ${DBH_MAX}</span></label>
        <div class="slider-row">
          <input type="range" id="dbh-min" class="filter-slider"
            min="${DBH_MIN}" max="${DBH_MAX}" value="${DBH_MIN}" step="1">
          <input type="range" id="dbh-max" class="filter-slider"
            min="${DBH_MIN}" max="${DBH_MAX}" value="${DBH_MAX}" step="1">
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">Last Observed: <span id="date-display">${DATE_MIN} – ${DATE_MAX}</span></label>
        <div class="slider-row">
          <input type="range" id="date-min" class="filter-slider"
            min="${DATE_MIN}" max="${DATE_MAX}" value="${DATE_MIN}" step="1">
          <input type="range" id="date-max" class="filter-slider"
            min="${DATE_MIN}" max="${DATE_MAX}" value="${DATE_MAX}" step="1">
        </div>
      </div>

      <div class="filter-divider"></div>
      <button id="btn-clear-filter" class="filter-clear-btn">Clear All Filters</button>
      <div id="filter-count" class="filter-count">— trees shown</div>
    `;

    buildChips(document.getElementById("chip-condition"), Object.keys(CONDITION_COLORS), CONDITION_COLORS,
      (val) => window.setFilterState({ condition: val }));
    bindSelect("filter-species", (val) => window.setFilterState({ species: val || null }));
    bindDualSlider("dbh-min", "dbh-max", "dbh-display", (range) =>
      window.setFilterState({ dbhRange: range })
    );
    bindDualSlider("date-min", "date-max", "date-display", (range) =>
      window.setFilterState({ obsDateRange: range })
    );
    document.getElementById("btn-clear-filter").addEventListener("click", () => {
      if (typeof window.clearFilters === "function") window.clearFilters();
    });
  }

  // Chip selector — "All" active by default; click again to deselect
  function buildChips(container, options, colorMap, onChange) {
    if (!container) return;
    let selected = null;

    function syncActive() {
      container.querySelectorAll(".filter-chip").forEach((c) => {
        c.classList.toggle("active", c.dataset.val === (selected ?? "__all__"));
      });
    }

    const allChip = document.createElement("button");
    allChip.className = "filter-chip active";
    allChip.dataset.val = "__all__";
    allChip.textContent = "All";
    allChip.addEventListener("click", () => {
      selected = null;
      syncActive();
      onChange(null);
    });
    container.appendChild(allChip);

    options.forEach((opt) => {
      const chip = document.createElement("button");
      chip.className = "filter-chip";
      chip.dataset.val = opt;
      chip.innerHTML =
        `<span class="chip-dot" style="background:${colorMap[opt] || "#888"}"></span>${opt}`;
      chip.addEventListener("click", () => {
        selected = selected === opt ? null : opt;
        syncActive();
        onChange(selected);
      });
      container.appendChild(chip);
    });
  }

  function bindSelect(id, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => onChange(el.value));
  }

  function bindDualSlider(minId, maxId, displayId, onChange) {
    const minEl = document.getElementById(minId);
    const maxEl = document.getElementById(maxId);
    const displayEl = document.getElementById(displayId);
    if (!minEl || !maxEl) return;

    function update() {
      let minVal = parseInt(minEl.value);
      let maxVal = parseInt(maxEl.value);

      // prevent min > max
      if (minVal > maxVal) {
        if (this === minEl) minEl.value = maxVal;
        else maxEl.value = minVal;
        minVal = parseInt(minEl.value);
        maxVal = parseInt(maxEl.value);
      }

      if (displayEl) displayEl.textContent = `${minVal} – ${maxVal}`;
      onChange([minVal, maxVal]);
    }

    minEl.addEventListener("input", update);
    maxEl.addEventListener("input", update);
  }

})();
