// dialog_stack.js

function setupStackDialog() {
  const dialog = document.getElementById("stack-dialog");
  const listEl = document.getElementById("stack-list");
  const closeBtn = document.getElementById("stack-close");

  closeBtn.addEventListener("click", () => {
    dialog.classList.add("hidden");
    listEl.innerHTML = "";
  });

  ["my-drop", "my-remove"].forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    zone.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      listEl.innerHTML = "";
      const cardsInZone = Array.from(zone.querySelectorAll(".card"));

      cardsInZone.forEach((cardEl) => {
        const clone = cardEl.cloneNode(false);
        clone.id = cardEl.id;
        clone.style.position = "relative";
        clone.style.left = "0";
        clone.style.top = "0";

        enableDrag(clone);
        enableRotate(clone);
        enableFlip(clone);
        enablePreview(clone);

        listEl.appendChild(clone);
      });

      dialog.classList.remove("hidden");
    });
  });
}
