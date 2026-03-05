(function () {

  window.closeSidebar = function () {
    document.getElementById("sidebar").classList.add("sidebar-hidden");
    document.getElementById("btn-sidebar-overlay").style.display = "flex";
    document.getElementById("about-panel").style.left = "24px";
  };

  window.openSidebar = function () {
    document.getElementById("sidebar").classList.remove("sidebar-hidden");
    document.getElementById("btn-sidebar-overlay").style.display = "none";
    document.getElementById("about-panel").style.left = "calc(var(--sidebar-w) + 24px)";
  };

  document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("sidebar-close").addEventListener("click", window.closeSidebar);
    document.getElementById("btn-sidebar").addEventListener("click", window.openSidebar);

    const btnFull = document.getElementById("btn-fullscreen");
    btnFull.addEventListener("click", function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener("fullscreenchange", function () {
      btnFull.textContent = document.fullscreenElement ? "⊠ Exit Full" : "⛶ Full Screen";
    });

  });

})();
