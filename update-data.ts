import fs from "fs/promises";
import { gql, GraphQLClient } from 'graphql-request'

const client = new GraphQLClient("https://data.loathers.net/graphql");

type JobType = {
  entity: string;
  disambiguate: boolean;
};

const jobs: JobType[] = [
  { entity: "classes", disambiguate: false },
  { entity: "effects", disambiguate: false },
  { entity: "familiars", disambiguate: false },
  { entity: "items", disambiguate: true },
  { entity: "locations", disambiguate: false },
  { entity: "monsters", disambiguate: true },
  { entity: "paths", disambiguate: false },
  { entity: "skills", disambiguate: true },
];

const titleCase = (i: string) => i.slice(0, 1).toUpperCase() + i.slice(1);

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
    jobs.map(async ({ entity, disambiguate }) => {
      const group = `all${titleCase(entity)}`;
      const data = await client.request<{ [group: string]: { edges: { node: { id: number, name: string, ambiguous?: boolean } }[] } }>(gql`
        {
          ${group} {
            edges {
              node {
                id
                name
                ${disambiguate ? "ambiguous" : ""}
              }
            }
          }
        }
      `);
      const names = data[group].edges.map(({ node }) => node.ambiguous ? `[${node.id}]${node.name}` : node.name);
      return await fs.writeFile(`data/${entity}.json`, JSON.stringify(names));
    }),
  );
}

main();
