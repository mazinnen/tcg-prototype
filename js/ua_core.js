// カード画像パス
export function getCardImagePath(id) {
  return `../data/img/UA/${id}.png`;
}

// カード DOM
export function createCard(id) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.id = id;
  div.style.backgroundImage = `url('${getCardImagePath(id)}')`;
  return div;
}

// 重ねゾーン
export function renderStack(zoneId, arr) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  arr.forEach((id, i) => {
    const c = createCard(id);
    c.style.setProperty("--i", i);
    zone.appendChild(c);
  });
}

// 横並びゾーン
export function renderRow(zoneId, arr) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  arr.forEach(id => zone.appendChild(createCard(id)));
}

// カードID取得
export function getCardId(el) {
  if (!el.classList.contains("card")) return null;
  return el.dataset.id;
}
