import { gql, GraphQLClient } from "graphql-request";
import { ALL_TAGS, Plurals } from "./tags.js";

const client = new GraphQLClient("https://data.loathers.net/graphql");

type JobType = {
  entity: Plurals;
  disambiguate: boolean;
};

const jobs: JobType[] = ALL_TAGS.map(([, entity, disambiguate]) => ({
  entity,
  disambiguate,
}));

const titleCase = (i: string) => i.slice(0, 1).toUpperCase() + i.slice(1);

export async function loadData() {
  return (
    await Promise.all(
      jobs.map(async ({ entity, disambiguate }) => {
        const group = `all${titleCase(entity)}`;
        const data = await client.request<{
          [group: string]: {
            nodes: { id: number; name: string; ambiguous?: boolean }[];
          };
        }>(gql`
        {
          ${group} {
            nodes {
              id
              name
              ${disambiguate ? "ambiguous" : ""}
            }
          }
        }
      `);
        const names = data[group].nodes.map((node) =>
          node.ambiguous ? `[${node.id}]${node.name}` : node.name,
        );
        return [entity, names] as [string, string[]];
      }),
    )
  ).reduce(
    (acc, [entity, names]) => ({ ...acc, [entity]: names }),
    {} as Record<Plurals, string[]>,
  );
}
