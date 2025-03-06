import fs from "fs/promises";
import { loadData } from "./lib/loadData";

const exists = async (file: string) =>
  fs
    .access(file)
    .then(() => true)
    .catch(() => false);

async function main() {
  if (!(await exists("data"))) await fs.mkdir("data");

  const data = await loadData();

  await Promise.all(
    Object.entries(data).map(([entity, names]) =>
      fs.writeFile(`data/${entity}.json`, JSON.stringify(names)),
    ),
  );
}

main();
