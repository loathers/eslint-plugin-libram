import fs from "fs";
import fetch from "node-fetch";

const classes = [
  "Seal Clubber",
  "Turtle Tamer",
  "Pastamancer",
  "Sauceror",
  "Disco Bandit",
  "Accordion Thief",
  "Helpful Bird",
  "Astral Spirit",
  "Inscrutable Force",
  "Hope Crusher",
  "Avatar of Boris",
  "Zombie Master",
  "None",
  "Avatar of Jarlsberg",
  "Avatar of Sneaky Pete",
  "None",
  "Ed",
  "Cow Puncher",
  "Beanslinger",
  "Snake Oiler",
  "Gelatinous Noob",
  "Vampyre",
  "Plumber",
];

async function getContents(url: string) {
  const response = await fetch(url);
  return response.text();
}

async function getMafiaData(path: string) {
  const text = await getContents(
    `https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/data/${path}`
  );
  return text
    .split("\n")
    .slice(1)
    .filter((line) => line[0] !== "#");
}

function disambiguate(
  lines: string[],
  componentsToIdName: (components: string[]) => [number, string]
) {
  const nameIdsMap = new Map<string, number[]>();
  for (const line of lines) {
    const [id, name] = componentsToIdName(line.split("\t"));
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
      ids.length === 1 ? [name] : ids.map((id) => `[${id}]${name}`)
    )
  );
}

async function main() {
  if (!fs.existsSync("data")) fs.mkdirSync("data");

  const effectLines = await getMafiaData("statuseffects.txt");
  const effects = disambiguate(effectLines, ([id, name]) => [
    parseInt(id),
    name,
  ]);
  fs.writeFileSync("data/effects.json", JSON.stringify(effects));

  const familiarLines = await getMafiaData("familiars.txt");
  const familiars = familiarLines
    .map((line) => line.split("\t")[1])
    .filter((name) => name);
  fs.writeFileSync("data/familiars.json", JSON.stringify(familiars));

  const itemLines = await getMafiaData("items.txt");
  const items = disambiguate(itemLines, ([id, name]) => [parseInt(id), name]);
  fs.writeFileSync("data/items.json", JSON.stringify(items));

  const locationLines = await getMafiaData("adventures.txt");
  const locations = locationLines
    .map((line) => line.split("\t")[3])
    .filter((name) => name);
  fs.writeFileSync("data/locations.json", JSON.stringify(locations));

  const monsterLines = await getMafiaData("monsters.txt");
  const monsters = disambiguate(monsterLines, ([name, id]) => [
    parseInt(id),
    name,
  ]);
  fs.writeFileSync("data/monsters.json", JSON.stringify(monsters));

  const skillLines = await getMafiaData("classskills.txt");
  const skills = skillLines
    .map((line) => line.split("\t")[1])
    .filter((name) => name);
  fs.writeFileSync("data/skills.json", JSON.stringify(skills));

  fs.writeFileSync("data/classes.json", JSON.stringify(classes));
}

main();
