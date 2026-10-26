import { readFile, writeFile } from "node:fs/promises";

const data = new URL("../src/data/", import.meta.url);

function mulberry32(seed) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

async function main() {
  let players;
  try {
    players = JSON.parse(await readFile(new URL("players.json", data), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("players.json fehlt noch – keine Tagesrätsel ergänzt.");
      return;
    }
    throw error;
  }
  if (!Array.isArray(players)) throw new Error("players.json muss eine Liste sein.");
  if (!players.length) {
    console.log("players.json ist leer – keine Tagesrätsel ergänzt.");
    return;
  }
  let order;
  try {
    order = JSON.parse(await readFile(new URL("daily-order.json", data), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    order = [];
  }
  if (!Array.isArray(order) || !order.every(id => typeof id === "string")) {
    throw new Error("daily-order.json muss eine Liste von Spieler-IDs sein.");
  }
  const known = new Set(order);
  const additions = [];
  for (const p of players) {
    if (p.tier <= 2 && !known.has(p.id)) {
      additions.push(p.id);
      known.add(p.id);
    }
  }
  const rand = mulberry32(20261026 + order.length);
  for (let i = additions.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [additions[i], additions[j]] = [additions[j], additions[i]];
  }
  await writeFile(new URL("daily-order.json", data), JSON.stringify([...order, ...additions], null, 2) + "\n");
  console.log(additions.length + " Tagesrätsel hinten ergänzt.");
}

main().catch(error => {
  console.error("Tagesrätsel-Reihenfolge konnte nicht ergänzt werden:", error.message);
  process.exitCode = 1;
});
