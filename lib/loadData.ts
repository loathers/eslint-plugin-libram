import { createClient } from "data-of-loathing";
import fs from "fs/promises";
import { join } from "path";

const DATA_LOCATION = join(import.meta.dirname, "..", "data");
const client = createClient();

const exists = async (file: string) =>
  fs
    .access(file)
    .then(() => true)
    .catch(() => false);

async function getRemoteRevision() {
  return (
    (
      await client.query({
        metaById: {
          __args: {
            id: 1,
          },
          lastRevision: true,
        },
      })
    ).metaById?.lastRevision ?? 0
  );
}

export async function since(requestedRevision?: number) {
  if (!(await exists(DATA_LOCATION))) await fs.mkdir(DATA_LOCATION);

  const localRevisionPath = `${DATA_LOCATION}/revision.json`;
  const localRevision =
    Number(
      (await exists(localRevisionPath))
        ? await fs.readFile(localRevisionPath, "utf-8")
        : 0,
    ) || 0;

  // If our data is up to date, skip
  if (requestedRevision && localRevision >= requestedRevision) return;

  // If there is no newer data to be fetched anyway, skip
  const remoteRevision = await getRemoteRevision();
  if (localRevision >= remoteRevision) return;

  const data = await client.query({
    allClasses: {
      nodes: {
        id: true,
        name: true,
        ambiguous: false,
      },
    },
    allEffects: {
      nodes: {
        id: true,
        name: true,
        ambiguous: true,
      },
    },
    allFamiliars: {
      nodes: {
        id: true,
        name: true,
        ambiguous: false,
      },
    },
    allItems: {
      nodes: {
        id: true,
        name: true,
        ambiguous: true,
      },
    },
    allLocations: {
      nodes: {
        id: true,
        name: true,
        ambiguous: false,
      },
    },
    allMonsters: {
      nodes: {
        id: true,
        name: true,
        ambiguous: true,
      },
    },
    allPaths: {
      nodes: {
        id: true,
        name: true,
        ambiguous: false,
      },
    },
    allSkills: {
      nodes: {
        id: true,
        name: true,
        ambiguous: true,
      },
    },
  });

  for (const e of Object.keys(data)) {
    const entity = e as keyof typeof data;
    const names =
      data[entity]?.nodes
        .filter((n) => n !== null)
        .map((n) =>
          "ambiguous" in n && n.ambiguous ? `[${n.id}]${n.name}` : n.name,
        ) ?? [];

    await fs.writeFile(
      `${DATA_LOCATION}/${entity.slice(3).toLowerCase()}.json`,
      JSON.stringify(names),
    );
  }

  await fs.writeFile(localRevisionPath, JSON.stringify(remoteRevision));
}

if (import.meta.main) {
  console.log("Importing latest data...");
  await since();
}
