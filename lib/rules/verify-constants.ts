import { Rule } from "eslint";
import * as ESTree from "estree";
import { readFileSync } from "fs";
import { decode as decodeEntities } from "html-entities";

class TagInfo {
  singular: string;
  plural: string;
  data: string[];
  caseMap: Map<string, string>;

  constructor(singular: string, plural: string, data: string[]) {
    const dataParsed = data.map((s) => decodeEntities(s));
    this.singular = singular;
    this.plural = plural;
    this.data = dataParsed;
    this.caseMap = new Map<string, string>(
      dataParsed.map((s) => [s.toLowerCase(), s])
    );
  }
}

function getJsonData(filename: string) {
  return JSON.parse(
    readFileSync(`${__dirname}/../../data/${filename}`, { encoding: "utf-8" })
  );
}

const tags = [
  new TagInfo("$effect", "$effects", getJsonData("effects.json")),
  new TagInfo("$familiar", "$familiars", getJsonData("familiars.json")),
  new TagInfo("$item", "$items", getJsonData("items.json")),
  new TagInfo("$monster", "$monsters", getJsonData("monsters.json")),
];

const singularTags = new Map<string, TagInfo>(
  tags.map((tagInfo) => [tagInfo.singular, tagInfo])
);
const singularTagList = Array.from(singularTags.keys());
const pluralTags = new Map<string, TagInfo>(
  tags.map((tagInfo) => [tagInfo.plural, tagInfo])
);
const pluralTagList = Array.from(pluralTags.keys());

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: "Verify enumerated type constants.",
      category: "Fill me in",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          ignoreCapitalization: {
            type: "boolean",
            default: false,
          },
          ignoreEntities: {
            type: "boolean",
            default: false,
          },
          ignoreUnrecognized: {
            type: "boolean",
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context: Rule.RuleContext) {
    const sourceCode = context.getSourceCode();
    const options = context.options[0];

    return {
      TaggedTemplateExpression(
        node: ESTree.TaggedTemplateExpression & Rule.NodeParentExtension
      ) {
        const tagText = sourceCode.getText(node.tag);
        const singular = singularTagList.includes(tagText);
        const plural = pluralTagList.includes(tagText);
        if (!singular && !plural) return;

        const tagInfo = singular
          ? singularTags.get(tagText)!
          : pluralTags.get(tagText)!;

        for (const quasi of node.quasi.quasis) {
          const segmentsRaw = plural
            ? quasi.value.raw.split(/(?<!(?<!\\)\\),/g).map((s) => s.trim())
            : [quasi.value.raw];
          const segments = segmentsRaw.map((raw) =>
            raw.replace(/(?<!\\)\\,/, ",")
          );

          for (const segment of segments) {
            const properlyCapitalized = tagInfo.caseMap.get(
              segment.toLowerCase()
            );

            if (properlyCapitalized === undefined) {
              if (tagInfo.caseMap.has(decodeEntities(segment).toLowerCase())) {
                if (!options?.ignoreEntities) {
                  context.report({
                    node,
                    message: `Enumerated value "${segment}" has HTML entities; should be "${decodeEntities(
                      segment
                    )}".`,
                  });
                }
              } else if (!options?.ignoreUnrecognized) {
                context.report({
                  node,
                  message: `Unrecognized enumerated value name "${segment}"`,
                });
              }
            } else if (
              !options?.ignoreCapitalization &&
              segment !== properlyCapitalized
            ) {
              context.report({
                node,
                message: `Enumerated value name "${segment}" should be capitalized "${properlyCapitalized}".`,
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
