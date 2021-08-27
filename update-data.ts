import fs from "fs";
import fetch from "node-fetch";

async function getContents(url: string) {
  const response = await fetch(url);
  return response.text();
}

async function getMafiaData(path: string): Promise<string[]> {
  const text = await getContents(
    `https://sourceforge.net/p/kolmafia/code/HEAD/tree/src/data/${path}?format=raw`
  );
  return text
    .split("\n")
    .slice(1)
    .filter((line: string) => line[0] !== "#");
}

type parser = (components: string[]) => [string, string];
function disambiguate(lines: string[], componentsToIdName: parser) {
  const nameIdsMap = new Map<string, string[]>();
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

  return ([] as [number | string, string][]).concat(
    ...Array.from(nameIdsMap).map(([name, ids]) =>
      ids.map((id): [number | string, string] => {
        const numeric = parseInt(id);
        const tag = ids.length > 1 ? `[${id}]` : ``;
        return [isNaN(numeric) ? id : numeric, `${tag}${name}`];
      })
    )
  );
}

async function write(source: string, destination: string, parser: parser) {
  const data = await getMafiaData(source);
  const parsed = disambiguate(data, parser);
  fs.writeFileSync(destination, JSON.stringify(parsed));
}

async function main() {
  const defaultParse = ([id, name]: [string, string]) => [id, name];
  (
    [
      ["statuseffects.txt", "data/effects.json", defaultParse],
      ["familiars.txt", "data/familiars.json", defaultParse],
      ["items.txt", "data/items.json", defaultParse],
      [
        "adventures.txt",
        "data/locations.json",
        (components) => {
          if (components.length < 4) return [];
          const container = components[1].split("=");
          // Want an id if prefixed by adventure, else just store the container
          const id = container[0] === "adventure" ? container[1] : container[0];
          return [id, components[3]];
        },
      ],
      [
        "monsters.txt",
        "data/monsters.json",
        ([name, id]) => [parseInt(id), name],
      ],
      ["classskills.txt", "data/skills.json", defaultParse],
    ] as [string, string, parser][]
  ).forEach(([source, dest, parse]) => write(source, dest, parse));
}

main();
