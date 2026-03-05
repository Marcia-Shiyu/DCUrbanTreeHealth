(function () {

  function toggleAbout() {
    const body  = document.getElementById("about-body");
    const arrow = document.getElementById("about-arrow");
    const open  = body.classList.toggle("open");
    arrow.style.transform = open ? "rotate(45deg)" : "rotate(-135deg)";
  }

  function replayTutorial() {
    localStorage.removeItem("dc-tree-tutorial");
    location.reload();
  }

  window.replayTutorial = replayTutorial;

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("about-toggle").addEventListener("click", toggleAbout);
    document.getElementById("btn-replay-tour").addEventListener("click", replayTutorial);
  });

})();
