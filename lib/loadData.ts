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
import { randomUUID } from "crypto";
import fs from "fs/promises";
import { join } from "path";

const DATA_LOCATION = join(import.meta.dirname, "..", "data");

// several eslint processes can import data at once while others read it
async function writeFileAtomic(path: string, data: string) {
  const tempPath = `${path}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tempPath, data);
    await fs.rename(tempPath, path);
  } finally {
    await fs.rm(tempPath, { force: true });
  }
}

async function importData(requestedRevision?: number) {
  if (requestedRevision !== undefined) {
    const localRevisionPath = `${DATA_LOCATION}/revision.json`;
    try {
      const localRevision = Number(await fs.readFile(localRevisionPath, "utf-8")) || 0;
      if (localRevision >= requestedRevision) return;
    } catch {
      // no local revision file yet
    }
  }

  const client = createClient();
  await client.load();

  const em = client.query;

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
    writeFileAtomic(`${DATA_LOCATION}/classes.json`, JSON.stringify(named(classes))),
    writeFileAtomic(`${DATA_LOCATION}/effects.json`, JSON.stringify(namedWithAmbiguous(effects))),
    writeFileAtomic(`${DATA_LOCATION}/familiars.json`, JSON.stringify(named(familiars))),
    writeFileAtomic(`${DATA_LOCATION}/items.json`, JSON.stringify(namedWithAmbiguous(items))),
    writeFileAtomic(`${DATA_LOCATION}/locations.json`, JSON.stringify(named(locations))),
    writeFileAtomic(`${DATA_LOCATION}/monsters.json`, JSON.stringify(namedWithAmbiguous(monsters))),
    writeFileAtomic(`${DATA_LOCATION}/paths.json`, JSON.stringify(named(paths))),
    writeFileAtomic(`${DATA_LOCATION}/skills.json`, JSON.stringify(namedWithAmbiguous(skills))),
  ]);
  // written last so a process that sees the new revision also sees the new data
  await writeFileAtomic(`${DATA_LOCATION}/revision.json`, JSON.stringify(meta?.lastRevision ?? 0));
}

export async function verifyConstantsSinceRevision(requestedRevision?: number) {
  await importData(requestedRevision);
}

if (import.meta.main) {
  console.log("Importing latest data...");
  await importData();
  console.log("Done.");
}
