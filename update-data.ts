import fs from "fs/promises";
import {
  disambiguate,
  loadClasses,
  loadEffects,
  loadFamiliars,
  loadItems,
  loadLocations,
  loadMonsters,
  loadPaths,
  loadSkills,
} from "data-of-loathing";

type JobType = {
  filename: string;
  loader: () => Promise<{ data: { id: number; name: string }[] }>;
  shouldDisambiguate: boolean;
};

const jobs: JobType[] = [
  { filename: "classes.json", loader: loadClasses, shouldDisambiguate: false },
  { filename: "effects.json", loader: loadEffects, shouldDisambiguate: false },
  {
    filename: "familiars.json",
    loader: loadFamiliars,
    shouldDisambiguate: false,
  },
  { filename: "items.json", loader: loadItems, shouldDisambiguate: true },
  {
    filename: "locations.json",
    loader: loadLocations,
    shouldDisambiguate: false,
  },
  { filename: "monsters.json", loader: loadMonsters, shouldDisambiguate: true },
  { filename: "paths.json", loader: loadPaths, shouldDisambiguate: false },
  { filename: "skills.json", loader: loadSkills, shouldDisambiguate: false },
];

async function exists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists("data"))) await fs.mkdir("data");

  await Promise.all(
    jobs.map(async ({ filename, loader, shouldDisambiguate }) => {
      const { data } = await loader();
      const names = shouldDisambiguate
        ? disambiguate(data)
        : data.map((d) => d.name);
      return await fs.writeFile(`data/${filename}`, JSON.stringify(names));
    }),
  );
}

main();
