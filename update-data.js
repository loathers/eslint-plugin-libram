const fs = require("fs");
const fetch = require("node-fetch");

async function getContents(url) {
  const response = await fetch(url);
  return response.text();
}

async function getMafiaData(path) {
  const text = await getContents(
    `https://sourceforge.net/p/kolmafia/code/HEAD/tree/src/data/${path}?format=raw`
  );
  return text
    .split("\n")
    .slice(1)
    .filter((line) => line[0] !== "#");
}

async function main() {
  const effectLines = await getMafiaData("statuseffects.txt");
  const effects = effectLines
    .map((line) => line.split("\t")[1])
    .filter((name) => name);
  fs.writeFileSync("data/effects.json", JSON.stringify(effects));

  const familiarLines = await getMafiaData("familiars.txt");
  const familiars = familiarLines
    .map((line) => line.split("\t")[1])
    .filter((name) => name);
  fs.writeFileSync("data/familiars.json", JSON.stringify(familiars));

  const itemLines = await getMafiaData("items.txt");
  const items = itemLines
    .map((line) => line.split("\t")[1])
    .filter((name) => name);
  fs.writeFileSync("data/items.json", JSON.stringify(items));

  const locationLines = await getMafiaData("adventures.txt");
  const locations = locationLines
    .map((line) => line.split("\t")[3])
    .filter((name) => name);
  fs.writeFileSync("data/locations.json", JSON.stringify(locations));

  const monsterLines = await getMafiaData("monsters.txt");
  const monsters = monsterLines
    .map((line) => line.split("\t")[0])
    .filter((name) => name);
  fs.writeFileSync("data/monsters.json", JSON.stringify(monsters));

  const skillLines = await getMafiaData("classskills.txt");
  const skills = skillLines
    .map((line) => line.split("\t")[1])
    .filter((name) => name);
  fs.writeFileSync("data/skills.json", JSON.stringify(skills));
}

main();
