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
  const parsedEffects = effectLines
    .map((line) => {
      const split = line.split("\t");
      return { id: split[0], name: split[1], edited: false };
    })
    .filter((line) => line.name);
  const effectsReadOnly = { ...parsedEffects };
  const count = Object.keys(effectsReadOnly).length;
  for (let i = 0; i < count - 1; ++i) {
    for (let j = i + 1; j < count; ++j) {
      if (effectsReadOnly[i].name === effectsReadOnly[j].name) {
        const disambiguate = (e) => {
          if (e.edited) return;
          e.name = `[${e.id}]${e.name}`;
          e.edited = true;
        };
        disambiguate(parsedEffects[i]);
        disambiguate(parsedEffects[j]);
      }
    }
  }
  const effects = parsedEffects.map((line) => line.name);
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
