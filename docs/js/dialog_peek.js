// dialog_peek.js
// 山札の上から確認ダイアログ（本物カード移動・並び替え対応）

function setupDeckPeekDialog() {
  const dialog = document.getElementById("deck-peek-dialog");
  const listEl = document.getElementById("deck-peek-list");
  const btnTop = document.getElementById("deck-peek-top");
  const btnBottom = document.getElementById("deck-peek-bottom");
  const btnClose = document.getElementById("deck-peek-close");

  // ダイアログ内にあるカードIDの順番
  let peekIds = [];

  // -------------------------
  // ▼ ダイアログを閉じる（戻さない）
  // -------------------------
  btnClose.addEventListener("click", () => {
    returnPeekCardsToDeck({ changeOrder: false });
  });

  // -------------------------
  // ▼ 上に戻す（山札の上＝deckOrder末尾）
  // -------------------------
  btnTop.addEventListener("click", () => {
    returnPeekCardsToDeck({ changeOrder: true, to: "top", order: peekIds });
  });

  // -------------------------
  // ▼ 下に戻す（山札の下＝deckOrder先頭）
  // -------------------------
  btnBottom.addEventListener("click", () => {
    returnPeekCardsToDeck({ changeOrder: true, to: "bottom", order: peekIds });
  });

  // -------------------------
  // ▼ 山札右クリック → ダイアログ表示
  // -------------------------
  document.getElementById("my-deck").addEventListener("contextmenu", (e) => {
    e.preventDefault();

    const input = prompt("上から何枚見る？", "3");
    const n = parseInt(input, 10);
    if (!n || n <= 0) return;

    listEl.innerHTML = "";
    peekIds = [];

    // 山札の上から n 枚（deckOrder の末尾が上）
    const deckIds = deckOrder.filter(id => cards[id].zone === "my-deck");
    const target = deckIds.slice(-n);

    // 本物カードをダイアログに移動
    target.forEach((id) => {
      const el = document.getElementById(id);

      // ★ 表向きにする（追加）
      cards[id].face = "front";
      el.dataset.face = "front";
      applyFaceClass(el);
      
      // 一時ゾーン "peek"
      cards[id].zone = "peek";
      el.dataset.inDialog = "1";

      // ダイアログ内の見た目
      el.style.position = "relative";
      el.style.left = "0";
      el.style.top = "0";

      listEl.appendChild(el);
      enableDialogReorder(el, listEl, peekIds);

      peekIds.push(id);
    });

    // 山札側の見た目更新
    layoutZone("my-deck");
    updateZoneCount("my-deck");

    dialog.classList.remove("hidden");
  });

  // ============================================================
  // ▼ ダイアログ内ドラッグ（並び替え専用）
  // ============================================================
  function enableDialogReorder(el, container, orderArray) {
    let isDragging = false;
    let startX = 0;
    let originalIndex = 0;

    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      originalIndex = orderArray.indexOf(el.id);
      el.style.opacity = "0.6";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const rect = container.getBoundingClientRect();

      // ▼ ダイアログ外に出たら通常ドラッグに切り替え
      if (e.clientY < rect.top || e.clientY > rect.bottom) {
        isDragging = false;
        el.style.opacity = "1";
        el.style.transform = "none";
        el.dataset.inDialog = "0";

        const id = el.id;

        // ダイアログ管理配列から除外
        const idx = orderArray.indexOf(id);
        if (idx !== -1) orderArray.splice(idx, 1);

        // 山札から抜く
        const deckIdx = deckOrder.indexOf(id);
        if (deckIdx !== -1) deckOrder.splice(deckIdx, 1);

        // 一旦手札に移動（ユーザーが好きなゾーンに移動できるように）
        cards[id].zone = "my-hand";
        document.getElementById("my-hand").appendChild(el);
        layoutZone("my-hand");
        updateZoneCount("my-hand");

        // 通常ドラッグを有効化して、今のイベントを引き継ぐ
        enableDrag(el);
        const evt = new MouseEvent("mousedown", e);
        el.dispatchEvent(evt);
        return;
      }

      // ▼ ダイアログ内の並び替え
      el.style.transform = `translateX(${dx}px)`;

      const siblings = Array.from(container.children);
      siblings.forEach((sib) => {
        if (sib === el) return;
        const sibRect = sib.getBoundingClientRect();
        if (e.clientX > sibRect.left && e.clientX < sibRect.right) {
          const newIndex = siblings.indexOf(sib);
          container.insertBefore(el, newIndex > originalIndex ? sib.nextSibling : sib);
          orderArray.splice(originalIndex, 1);
          orderArray.splice(newIndex, 0, el.id);
          originalIndex = newIndex;
        }
      });
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  // ============================================================
  // ▼ ダイアログを閉じるときの共通処理
  // ============================================================
  function returnPeekCardsToDeck(options) {
    const { changeOrder, to, order } = options || {};

    // まだ "peek" にいるカードだけ対象
    const stillPeek = peekIds.filter(id => cards[id].zone === "peek");

    // ▼ 並び順を deckOrder に反映
    if (changeOrder && stillPeek.length > 0) {
      // まず deckOrder から対象を抜く
      stillPeek.forEach(id => {
        const idx = deckOrder.indexOf(id);
        if (idx !== -1) deckOrder.splice(idx, 1);
      });

      // 並び替え済みの順番で戻す
      const ordered = order.filter(id => stillPeek.includes(id));

      if (to === "top") {
        ordered.forEach(id => deckOrder.push(id));      // 山札の上
      } else if (to === "bottom") {
        ordered.forEach(id => deckOrder.unshift(id));   // 山札の下
      }
    }

    // ▼ DOM と zone を山札に戻す
    stillPeek.forEach(id => {
      const el = document.getElementById(id);
      cards[id].zone = "my-deck";
      el.dataset.inDialog = "0";
      document.getElementById("my-deck").appendChild(el);
      el.style.position = "absolute";
    });

    // ▼ 山札の見た目更新
    layoutZone("my-deck");
    updateZoneCount("my-deck");

    // ▼ 全部裏向きに戻す
    restoreDeckFaces();

    // ▼ ダイアログ閉じる
    dialog.classList.add("hidden");
    listEl.innerHTML = "";
    peekIds = [];
  }
}
