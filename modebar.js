(function () {

  const MODES = [
    { id: "disease",   label: "Disease" },
    { id: "condition", label: "Condition" },
  ];

  const DEFAULT_MODE = "disease";

  function initModebar() {
    const container = document.getElementById("modebar");
    if (!container) {
      console.warn("[modebar.js] #modebar element not found");
      return;
    }

    container.innerHTML = "";

    const title = document.createElement("div");
    title.id = "modebar-title";
    title.textContent = "DC STREET TREE HEALTH";
    container.appendChild(title);

    MODES.forEach(({ id, label }) => {
      const btn = document.createElement("button");
      btn.className = "mode-btn";
      btn.dataset.mode = id;
      btn.textContent = label;

      if (id === DEFAULT_MODE) btn.classList.add("active");

      btn.addEventListener("click", () => {
        container.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (typeof window.setMode === "function") window.setMode(id);
      });

      container.appendChild(btn);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModebar);
  } else {
    initModebar();
  }

})();
