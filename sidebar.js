(function () {

  // Called by main.js after ward_stats.json loads
  window.initSidebar = function (wardStats) {
    renderRegionSelector(wardStats.wardList);
    window.updateSidebarCharts(null, "disease", wardStats);
  };

  function renderRegionSelector(wardList) {
    const container = document.getElementById("region-selector");
    if (!container) {
      console.warn("[sidebar.js] #region-selector not found");
      return;
    }

    container.innerHTML = "";

    const dcBtn = document.createElement("button");
    dcBtn.className = "region-btn active";
    dcBtn.dataset.ward = "dc";
    dcBtn.textContent = "DC";
    dcBtn.addEventListener("click", () => {
      setActiveRegion(container, dcBtn);
      window.setRegion(null);
    });
    container.appendChild(dcBtn);

    wardList.forEach((ward) => {
      const btn = document.createElement("button");
      btn.className = "region-btn";
      btn.dataset.ward = ward;
      btn.textContent = `Ward ${ward}`;
      btn.addEventListener("click", () => {
        setActiveRegion(container, btn);
        window.setRegion(ward);
      });
      container.appendChild(btn);
    });
  }

  function setActiveRegion(container, activeBtn) {
    container.querySelectorAll(".region-btn").forEach((b) => b.classList.remove("active"));
    activeBtn.classList.add("active");
  }

  // Called by main.js on region/mode change
  window.updateSidebarCharts = function (ward, mode, wardStats) {
    if (!wardStats) return;

    const data = ward === null ? wardStats.DC : wardStats.wards[ward];
    if (!data) return;

    if (mode === "disease") {
      renderDiseaseCharts(data);
    } else if (mode === "condition") {
      renderConditionCharts(data);
    }
  };

  function renderDiseaseCharts(data) {
    const container = document.getElementById("sidebar-charts");
    if (!container) return;

    container.innerHTML = `
      <div class="stat-total">
        <span class="stat-number">${data.total.toLocaleString()}</span>
        <span class="stat-label">Trees with Disease Records</span>
      </div>
      <div class="chart-section">
        <div class="chart-title">Disease Distribution</div>
        ${renderDiseaseDist(data.diseaseDist)}
      </div>
      <div class="chart-section">
        <div class="chart-title">Top 5 Species</div>
        ${renderBarChart(data.topSpecies)}
      </div>
    `;
  }

  function renderConditionCharts(data) {
    const container = document.getElementById("sidebar-charts");
    if (!container) return;

    container.innerHTML = `
      <div class="stat-total">
        <span class="stat-number">${data.total.toLocaleString()}</span>
        <span class="stat-label">Trees with Health Records</span>
      </div>
      <div class="chart-section">
        <div class="chart-title">Condition Distribution</div>
        ${renderConditionDist(data.conditionDist)}
      </div>
      <div class="chart-section">
        <div class="chart-title">Top 5 Best Condition Species</div>
        ${renderBarChart(data.top5BestSpecies, "best")}
      </div>
      <div class="chart-section">
        <div class="chart-title">Top 5 Worst Condition Species</div>
        ${renderBarChart(data.top5WorstSpecies, "worst")}
      </div>
    `;
  }

  function renderBarChart(items, type = "default") {
    if (!items || items.length === 0) return "<div class='no-data'>No data</div>";

    const max = Math.max(...items.map((d) => d.count));

    return items.map(({ name, count }) => {
      const pct = max > 0 ? (count / max) * 100 : 0;
      const colorClass = type === "best" ? "bar-best" : type === "worst" ? "bar-worst" : "bar-default";
      return `
        <div class="bar-row">
          <div class="bar-label" title="${name}">${name}</div>
          <div class="bar-track">
            <div class="bar-fill ${colorClass}" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <div class="bar-count"><span style="color:var(--text);">${count}</span> <span class="bar-pct">trees</span></div>
        </div>
      `;
    }).join("");
  }

  function renderDiseaseDist(diseaseDist) {
    if (!diseaseDist || diseaseDist.length === 0) return "<div class='no-data'>No data</div>";

    const total = diseaseDist.reduce((sum, d) => sum + d.count, 0);

    return diseaseDist.map(({ disease, count }) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      const color = DISEASE_COLORS[disease] || "#888";
      return `
        <div class="bar-row">
          <div class="bar-label" style="color:${color};font-weight:700;">${disease}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%; background:${color};"></div>
          </div>
          <div class="bar-count" style="line-height:1.3;"><span style="color:${color};">${pct}%</span><br><span class="bar-pct">(${count} trees)</span></div>
        </div>
      `;
    }).join("");
  }

  function renderConditionDist(conditionDist) {
    if (!conditionDist || conditionDist.length === 0) return "<div class='no-data'>No data</div>";

    const total = conditionDist.reduce((sum, d) => sum + d.count, 0);

    const order = Object.keys(CONDITION_COLORS);

    const sorted = [...conditionDist].sort(
      (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
    );

    return sorted.map(({ status, count }) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      const color = CONDITION_COLORS[status] || "#adb5bd";
      return `
        <div class="bar-row">
          <div class="bar-label" style="color:${color};font-weight:700;">${status}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%; background:${color};"></div>
          </div>
          <div class="bar-count" style="line-height:1.3;"><span style="color:${color};">${pct}%</span><br><span class="bar-pct">(${count} trees)</span></div>
        </div>
      `;
    }).join("");
  }

})();
