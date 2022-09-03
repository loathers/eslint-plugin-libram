import fs from "fs";
import fetch from "node-fetch";

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

async function getMafiaEnumData(filename: string) {
  const text = await getContents(
    `https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/net/sourceforge/kolmafia/${filename}.java`
  );
  const enumStart = text.indexOf("public enum");
  const enumEnd = text.indexOf(";", enumStart);
  return text.slice(enumStart, enumEnd);
}

const ENUM_NAME_PATTERN = /\(\n*\s*"([^"]+)",/g;

function matchAll(text: string, pattern: RegExp) {
  const matches: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1]);
  }

  return matches;
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

  const classEnum = await getMafiaEnumData("AscensionClass");
  const classes = matchAll(classEnum, ENUM_NAME_PATTERN);
  fs.writeFileSync("data/classes.json", JSON.stringify(classes));

  const pathEnum = await getMafiaEnumData("AscensionPath");
  const paths = matchAll(pathEnum, ENUM_NAME_PATTERN);
  fs.writeFileSync("data/paths.json", JSON.stringify(paths));
}

main();
