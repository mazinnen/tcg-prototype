import { loadWorks, loadCards } from "./loaders.js";

async function init() {
  const works = await loadWorks();
  const cards = await loadCards();

  console.log("works:", works);
  console.log("cards:", cards);
}

init();