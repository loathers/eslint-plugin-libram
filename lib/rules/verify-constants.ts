import { Rule } from "eslint";
import * as ESTree from "estree";
import { readFileSync } from "fs";
import { decode as decodeEntities } from "html-entities";

// Minimum length of substrings before checking for matches.
const SUBSTRING_MIN_LENGTH = 5;

class TagInfo {
  singular: string;
  plural: string;
  data: string[];
  caseMap: Map<string, string>;
  prefixSuffixMap: Map<string, string[]>;

  constructor(singular: string, plural: string, data: string[]) {
    const dataParsed = ["none", ...data.map((s) => decodeEntities(s))];
    this.singular = singular;
    this.plural = plural;
    this.data = dataParsed;
    this.caseMap = new Map(dataParsed.map((s) => [s.toLowerCase(), s]));

    const prefixSuffixSetMap = new Map<string, Set<string>>();
    for (const element of dataParsed) {
      const elementLower = element.toLowerCase();
      const indices = Array.from(new Array(element.length).keys()).slice(
        SUBSTRING_MIN_LENGTH
      );
      for (const index of indices) {
        for (const substring of [
          elementLower.slice(element.length - index),
          elementLower.slice(0, index),
        ]) {
          let wholeStrings = prefixSuffixSetMap.get(substring);
          if (!wholeStrings) {
            wholeStrings = new Set();
            prefixSuffixSetMap.set(substring, wholeStrings);
          }
          wholeStrings.add(element);
        }
      }
    }

    this.prefixSuffixMap = new Map(
      Array.from(prefixSuffixSetMap.entries()).map(([k, v]) => [
        k,
        Array.from(v),
      ])
    );
  }
}

function getJsonData(filename: string) {
  return JSON.parse(
    readFileSync(`${__dirname}/../../data/${filename}`, { encoding: "utf-8" })
  );
}

const tags = [
  new TagInfo("$class", "$classes", getJsonData("classes.json")),
  new TagInfo("$effect", "$effects", getJsonData("effects.json")),
  new TagInfo("$familiar", "$familiars", getJsonData("familiars.json")),
  new TagInfo("$item", "$items", getJsonData("items.json")),
  new TagInfo("$location", "$locations", getJsonData("locations.json")),
  new TagInfo("$monster", "$monsters", getJsonData("monsters.json")),
  new TagInfo("$skill", "$skills", getJsonData("skills.json")),
  new TagInfo("$path", "$paths", getJsonData("paths.json")),
];

const singularTags = new Map<string, TagInfo>(
  tags.map((tagInfo) => [tagInfo.singular, tagInfo])
);
const pluralTags = new Map<string, TagInfo>(
  tags.map((tagInfo) => [tagInfo.plural, tagInfo])
);

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: "Verify enumerated type constants.",
      category: "Fill me in",
      recommended: false,
    },
    fixable: "code",
    hasSuggestions: true,
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

    function positionAdd(position: ESTree.Position, offset: number) {
      return sourceCode.getLocFromIndex(
        sourceCode.getIndexFromLoc(position) + offset
      );
    }

    function splitWithLocation(quasi: ESTree.TemplateElement, pattern: RegExp) {
      const startOffset = quasi.value.raw.match(/^\s*/)![0].length;
      const endOffset = quasi.value.raw.match(/\s*$/)![0].length;
      // We have to add/subtract one here to deal with the backticks.
      const start = positionAdd(quasi.loc!.start, startOffset + 1);
      const end = positionAdd(quasi.loc!.end, -endOffset - 1);

      const result: [string, ESTree.Position, ESTree.Position][] = [];

      let match = null;
      let lastMatch: RegExpExecArray | null = null;
      const sliced = quasi.value.raw.slice(
        startOffset,
        quasi.value.raw.length - endOffset
      );
      while ((match = pattern.exec(sliced)) !== null) {
        result.push([
          sliced.slice(
            lastMatch ? lastMatch.index + lastMatch[0].length : 0,
            match.index
          ),
          positionAdd(
            start,
            lastMatch ? lastMatch.index + lastMatch[0].length : 0
          ),
          positionAdd(start, match.index),
        ]);
        lastMatch = match;
      }
      result.push([
        sliced.slice(lastMatch ? lastMatch.index + lastMatch[0].length : 0),
        positionAdd(
          start,
          lastMatch ? lastMatch.index + lastMatch[0].length : 0
        ),
        end,
      ]);

      return result;
    }

    return {
      TaggedTemplateExpression(
        node: ESTree.TaggedTemplateExpression & Rule.NodeParentExtension
      ) {
        // For now just don't check constants if they contain other template literal expressions
        if (node.quasi.expressions.length > 0) return;
        const tagText = sourceCode.getText(node.tag);
        const singular = singularTags.get(tagText);
        const plural = pluralTags.get(tagText);
        const tagElements = singular ?? plural;
        if (!tagElements) return;

        for (const quasi of node.quasi.quasis) {
          const segments = plural
            ? splitWithLocation(quasi, /\s*(?<!(?<!\\)\\),\s*/g)
            : splitWithLocation(quasi, /(?!)/g); // Never matches - don't split.

          for (const [segmentRaw, start, end] of segments) {
            const range: [number, number] = [
              sourceCode.getIndexFromLoc(start),
              sourceCode.getIndexFromLoc(end),
            ];
            const segment = segmentRaw.replace(/(?<!\\)\\,/, ",");
            const lowerCaseSegment = segment.toLowerCase();
            const properlyCapitalized =
              tagElements.caseMap.get(lowerCaseSegment);
            const disambiguations =
              tagElements.prefixSuffixMap.get(lowerCaseSegment);

            if (properlyCapitalized === undefined) {
              const decoded = decodeEntities(segment);
              const decodedProperlyCapitalized = tagElements.caseMap.get(
                decoded.toLowerCase()
              );
              if (decodedProperlyCapitalized !== undefined) {
                if (!options?.ignoreEntities) {
                  context.report({
                    node,
                    message: `Enumerated value "${segment}" has HTML entities; should be "${decodedProperlyCapitalized}".`,
                    fix(fixer) {
                      return fixer.replaceTextRange(
                        range,
                        decodedProperlyCapitalized
                      );
                    },
                  });
                }
              } else if (disambiguations && disambiguations.length > 1) {
                const suggestions = disambiguations.map((dis) => {
                  return {
                    desc: `Change enumerated value to ${dis}`,
                    fix: (fixer: Rule.RuleFixer) => {
                      return fixer.replaceTextRange(
                        range,
                        dis.replace(",", "\\,")
                      );
                    },
                  };
                });
                context.report({
                  node,
                  message: `Ambiguous value name "${segment}".`,
                  suggest: suggestions,
                });
              } else if (
                // Effect names with commas such as $effects`And Your Family, Too` are a degenerate case
                disambiguations &&
                disambiguations.length > 0
              ) {
                context.report({
                  node,
                  message: `Enumerated value "${segment}" should be "${disambiguations[0]}".`,
                  fix(fixer) {
                    return fixer.replaceTextRange(
                      range,
                      disambiguations[0].replace(",", "\\,")
                    );
                  },
                });
              } else if (!options?.ignoreUnrecognized && segment !== "") {
                context.report({
                  node,
                  message: `Unrecognized enumerated value name "${segment}".`,
                });
              }
            } else if (
              !options?.ignoreCapitalization &&
              segment !== properlyCapitalized
            ) {
              context.report({
                node,
                message: `Enumerated value name "${segment}" should be capitalized "${properlyCapitalized}".`,
                fix(fixer) {
                  return fixer.replaceTextRange(range, properlyCapitalized);
                },
              });
            }
          }

          // FIXME: Allow on separate lines.
          const properlySpaced = segments
            .map(([segmentRaw, ,]) => segmentRaw)
            .join(", ");
          if (quasi.value.raw !== properlySpaced) {
            context.report({
              node,
              message:
                "Enumerated value constants should be separated by a comma and space.",
              fix(fixer) {
                const [start, end] = quasi.range!;
                return fixer.replaceTextRange(
                  [start + 1, end - 1],
                  properlySpaced
                );
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
