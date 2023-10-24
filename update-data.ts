import fs from "fs";
import {
  loadClasses,
  loadEffects,
  loadFamiliars,
  loadItems,
  loadPaths,
  loadSkills,
} from "data-of-loathing";

async function getContents(url: string) {
  const response = await fetch(url);
  return response.text();
}

async function getMafiaData(path: string) {
  const text = await getContents(
    `https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/data/${path}`,
  );
  return text
    .split("\n")
    .slice(1)
    .filter((line) => line[0] !== "#")
    .map((line) => line.split("\t"));
}

function disambiguate(entities: { id: number; name: string }[]) {
  const nameIdsMap = new Map<string, number[]>();
  for (const { id, name } of entities) {
    if (!name || name.trim() === "") continue;
    let ids = nameIdsMap.get(name);
    if (!ids) {
      ids = [];
      nameIdsMap.set(name, ids);
    }
    ids.push(id);
  }

  return ([] as string[]).concat(
    ...Array.from(nameIdsMap).map(([name, ids]) =>
      ids.length === 1 ? [name] : ids.map((id) => `[${id}]${name}`),
    ),
  );
}

async function loadLocations() {
  const locationLines = await getMafiaData("adventures.txt");
  return locationLines.map((line) => line[3]).filter((name) => name);
}

async function loadMonsters() {
  return (await getMafiaData("monsters.txt")).map(([name, id]) => ({
    id: Number(id),
    name,
  }));
}

async function main() {
  if (!fs.existsSync("data")) fs.mkdirSync("data");

  const effects = (await loadEffects()).data.map((e) => e.name);
  fs.writeFileSync("data/effects.json", JSON.stringify(effects));

  const familiars = (await loadFamiliars()).data.map((f) => f.name);
  fs.writeFileSync("data/familiars.json", JSON.stringify(familiars));

  const items = disambiguate((await loadItems()).data);
  fs.writeFileSync("data/items.json", JSON.stringify(items));

  const locations = await loadLocations();
  fs.writeFileSync("data/locations.json", JSON.stringify(locations));

  const monsters = disambiguate(await loadMonsters());
  fs.writeFileSync("data/monsters.json", JSON.stringify(monsters));

  const skills = (await loadSkills()).data.map((s) => s.name);
  fs.writeFileSync("data/skills.json", JSON.stringify(skills));

  const classes = (await loadClasses()).data.map((c) => c.name);
  fs.writeFileSync("data/classes.json", JSON.stringify(classes));

  const paths = (await loadPaths()).data.map((p) => p.name);
  fs.writeFileSync("data/paths.json", JSON.stringify(paths));
}

main();
