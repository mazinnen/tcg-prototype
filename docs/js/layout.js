function layoutZone(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;

  const cards = Array.from(zone.querySelectorAll(".card"));

  if (zone.classList.contains("hand")) {
    layoutHorizontal(cards, 90);
  } else if (zone.classList.contains("energy")) {
    layoutHorizontal(cards, 90);
  } else if (zone.classList.contains("life")) {
    layoutStack(cards, 20);
  } else if (
    zone.classList.contains("deck") ||
    zone.classList.contains("drop") ||
    zone.classList.contains("remove")
  ) {
    layoutStack(cards, 5);
  } else {
    layoutHorizontal(cards, 90);
  }
}

function layoutHorizontal(cards, gap) {
  cards.forEach((card, i) => {
    card.style.left = i * gap + "px";
    card.style.top = "0px";
  });
}

function layoutStack(cards, gap) {
  cards.forEach((card, i) => {
    card.style.left = i * gap + "px";
    card.style.top = i * gap + "px";
  });
}
