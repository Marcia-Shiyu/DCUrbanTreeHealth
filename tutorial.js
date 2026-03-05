(function () {

  if (localStorage.getItem("dc-tree-tutorial")) return;

  const STEPS = [
    {
      target: null,
      title: "Welcome",
      text: "This map shows DC street trees that have been recorded with a disease, along with their most recently observed health condition from field inspections.",
    },
    {
      target: "#modebar",
      cardPos: "below",
      title: "Two Ways to Explore",
      text: "Use <b>Disease Mode</b> to explore trees by specific diagnosis type.<br><br>Use <b>Condition Mode</b> to explore trees by health condition from their last inspection.",
    },
    {
      target: "#sidebar",
      cardPos: "right",
      title: "Filter by Region",
      text: "Select <b>DC</b> for city-wide data, or pick a <b>Ward</b> to zoom into a specific area and see local stats.",
    },
    {
      target: "#filter-panel",
      cardPos: "left",
      title: "Filter the Data",
      text: "Use the <b>filter panel</b> to narrow results by disease type or health condition, species, trunk diameter, and observation year.",
    },
    {
      target: null,
      title: "Ready to Explore",
      text: "Click any <span style=\"color:#b03a2e\">●</span><span style=\"color:#6c3483\">●</span><span style=\"color:#1a7a38\">●</span> on the map to see <b>detailed info</b>: species, disease, health condition, trunk size, and more.",
    },
  ];

  const overlay = document.createElement("div");
  overlay.id = "tut-overlay";

  const spot = document.createElement("div");
  spot.id = "tut-spot";

  const card = document.createElement("div");
  card.id = "tut-card";

  overlay.appendChild(spot);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function show(i) {
    const s = STEPS[i];
    const isLast = i === STEPS.length - 1;

    card.innerHTML = `
      <div class="tut-num">${i + 1} / ${STEPS.length}</div>
      <div class="tut-title">${s.title}</div>
      <div class="tut-text">${s.text}</div>
      <div class="tut-btns">
        <button id="tut-skip">Skip tour</button>
        <div style="display:flex;gap:8px;">
          ${i > 0 ? '<button id="tut-back">← Back</button>' : ""}
          <button id="tut-next" class="tut-primary">${isLast ? "Start exploring" : "Next →"}</button>
        </div>
      </div>
    `;

    document.getElementById("tut-skip").onclick = done;
    document.getElementById("tut-next").onclick = () => (isLast ? done() : show(i + 1));
    if (i > 0) document.getElementById("tut-back").onclick = () => show(i - 1);

    if (s.target) {
      const el = document.querySelector(s.target);
      if (!el) { show(i + 1); return; }

      const r = el.getBoundingClientRect();
      const pad = 10;

      overlay.classList.add("has-target");
      spot.style.display = "";
      spot.style.top    = (r.top    - pad) + "px";
      spot.style.left   = (r.left   - pad) + "px";
      spot.style.width  = (r.width  + pad * 2) + "px";
      spot.style.height = (r.height + pad * 2) + "px";

      placeCard(r, s.cardPos);
    } else {
      overlay.classList.remove("has-target");
      spot.style.display = "none";
      card.style.cssText = "top:50%;left:50%;transform:translate(-50%,-50%)";
    }
  }

  function placeCard(r, pos) {
    const W = 300, GAP = 16;
    const vw = window.innerWidth, vh = window.innerHeight;
    card.style.transform = "";
    card.style.width = W + "px";

    if (pos === "right") {
      card.style.top  = Math.max(8, Math.min(r.top, vh - 220)) + "px";
      card.style.left = Math.min(r.right + GAP, vw - W - 8) + "px";
    } else if (pos === "left") {
      card.style.top  = Math.max(8, Math.min(r.top, vh - 220)) + "px";
      card.style.left = Math.max(8, r.left - W - GAP) + "px";
    } else if (pos === "below") {
      card.style.top  = (r.bottom + GAP) + "px";
      card.style.left = Math.min(Math.max(8, r.right - W), vw - W - 8) + "px";
    }
  }

  function done() {
    localStorage.setItem("dc-tree-tutorial", "1");
    overlay.remove();
  }

  setTimeout(() => show(0), 500);

})();
