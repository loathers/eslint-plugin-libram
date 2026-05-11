import {
  createClient,
  AscensionClass,
  Effect,
  Familiar,
  Item,
  Location,
  Monster,
  Meta,
  Path,
  Skill,
} from "data-of-loathing";
import fs from "fs/promises";
import { join } from "path";

const DATA_LOCATION = join(import.meta.dirname, "..", "data");

async function importData(requestedRevision?: number) {
  const client = createClient();
  await client.load();

  const em = client.query;

  if (requestedRevision !== undefined) {
    const localRevisionPath = `${DATA_LOCATION}/revision.json`;
    try {
      const localRevision = Number(await fs.readFile(localRevisionPath, "utf-8")) || 0;
      if (localRevision >= requestedRevision) return;
    } catch {
      // no local revision file yet
    }
  }

  const [classes, effects, familiars, items, locations, monsters, paths, skills, meta] =
    await Promise.all([
      em.findAll(AscensionClass, { orderBy: { id: "ASC" } }),
      em.findAll(Effect, { orderBy: { id: "ASC" } }),
      em.findAll(Familiar, { orderBy: { id: "ASC" } }),
      em.findAll(Item, { orderBy: { id: "ASC" } }),
      em.findAll(Location, { orderBy: { name: "ASC" } }),
      em.findAll(Monster, { orderBy: { id: "ASC" } }),
      em.findAll(Path, { orderBy: { id: "ASC" } }),
      em.findAll(Skill, { orderBy: { id: "ASC" } }),
      em.findOne(Meta, { id: 1 }),
    ]);

  const named = (records: Array<{ name: string }>) => records.map((r) => r.name);
  const namedWithAmbiguous = (records: Array<{ id: number; name: string; ambiguous: boolean }>) =>
    records.map((r) => (r.ambiguous ? `[${r.id}]${r.name}` : r.name));

  await fs.mkdir(DATA_LOCATION, { recursive: true });

  await Promise.all([
    fs.writeFile(`${DATA_LOCATION}/classes.json`, JSON.stringify(named(classes))),
    fs.writeFile(`${DATA_LOCATION}/effects.json`, JSON.stringify(namedWithAmbiguous(effects))),
    fs.writeFile(`${DATA_LOCATION}/familiars.json`, JSON.stringify(named(familiars))),
    fs.writeFile(`${DATA_LOCATION}/items.json`, JSON.stringify(namedWithAmbiguous(items))),
    fs.writeFile(`${DATA_LOCATION}/locations.json`, JSON.stringify(named(locations))),
    fs.writeFile(`${DATA_LOCATION}/monsters.json`, JSON.stringify(namedWithAmbiguous(monsters))),
    fs.writeFile(`${DATA_LOCATION}/paths.json`, JSON.stringify(named(paths))),
    fs.writeFile(`${DATA_LOCATION}/skills.json`, JSON.stringify(namedWithAmbiguous(skills))),
    fs.writeFile(`${DATA_LOCATION}/revision.json`, JSON.stringify(meta?.lastRevision ?? 0)),
  ]);
}

export async function verifyConstantsSinceRevision(requestedRevision?: number) {
  await importData(requestedRevision);
}

if (import.meta.main) {
  console.log("Importing latest data...");
  await importData();
  console.log("Done.");
}
