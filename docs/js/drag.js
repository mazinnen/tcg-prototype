function enableDrag(el) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  });

  document.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;

    document.querySelectorAll(".zone").forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      if (
        e.clientX > rect.left &&
        e.clientX < rect.right &&
        e.clientY > rect.top &&
        e.clientY < rect.bottom
      ) {
        zone.appendChild(el);

        const x = e.clientX - rect.left - offsetX;
        const y = e.clientY - rect.top - offsetY;

        el.style.left = x + "px";
        el.style.top = y + "px";

        socket.emit("move_card", {
          id: el.id,
          zone: zone.id,
          x,
          y
        });

        layoutZone(zone.id);
      }
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    el.style.left = e.clientX - offsetX + "px";
    el.style.top = e.clientY - offsetY + "px";
  });
}
