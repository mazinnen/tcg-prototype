export function createCard(id, face = "back") {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.id = id;
  card.dataset.face = face;
  card.draggable = true; // ← これ必須

  updateCardImage(card);
  return card;
}

export function updateCardImage(card) {
  const id = card.dataset.id;
  const face = card.dataset.face;

  if (face === "back") {
    card.style.backgroundImage = "url('../data/img/UA/back.png')";
  } else {
    card.style.backgroundImage = `url('../data/img/UA/${id}.png')`;
  }
}

export function flipCard(card) {
  card.dataset.face = card.dataset.face === "back" ? "front" : "back";
  updateCardImage(card);
}

export function renderStack(zoneId, ids, options = {}) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  const face = options.face || "back";

  ids.forEach(id => {
    const card = createCard(id, face);
    zone.appendChild(card);
  });
}

export function renderRow(zoneId, ids, options = {}) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  const face = options.face || "front";

  ids.forEach(id => {
    const card = createCard(id, face);
    zone.appendChild(card);
  });
}

export function getCardId(el) {
  const card = el.closest(".card");
  return card ? card.dataset.id : null;
}
