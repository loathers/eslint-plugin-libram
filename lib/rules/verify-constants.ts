import { Rule } from "eslint";
import * as ESTree from "estree";
import { decode as decodeEntities } from "html-entities";

import { Plurals, pluralTags, singularTags, tags } from "../tags.js";

export const meta: Rule.RuleMetaData = {
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
        data: {
          type: "object",
          default: {},
          properties: tags.reduce(
            (acc, tag) => ({
              ...acc,
              [tag.plural]: { type: "array", items: { type: "string" } },
            }),
            {},
          ),
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  ],
};

type Options = {
  ignoreCapitalization: boolean;
  ignoreEntities: boolean;
  ignoreUnrecognized: boolean;
  data: Partial<Record<Plurals, string[]>>;
};

export function create(context: Rule.RuleContext): Rule.RuleListener {
  const sourceCode = context.sourceCode;
  const options = context.options[0] as Options | undefined;

  // Load from provided data else data contained in the plugin.
  pluralTags.forEach((tag) => {
    tag.load(options?.data[tag.plural]);
  });

  function positionAdd(position: ESTree.Position, offset: number) {
    return sourceCode.getLocFromIndex(
      sourceCode.getIndexFromLoc(position) + offset,
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
      quasi.value.raw.length - endOffset,
    );
    while ((match = pattern.exec(sliced)) !== null) {
      result.push([
        sliced.slice(
          lastMatch ? lastMatch.index + lastMatch[0].length : 0,
          match.index,
        ),
        positionAdd(
          start,
          lastMatch ? lastMatch.index + lastMatch[0].length : 0,
        ),
        positionAdd(start, match.index),
      ]);
      lastMatch = match;
    }
    result.push([
      sliced.slice(lastMatch ? lastMatch.index + lastMatch[0].length : 0),
      positionAdd(start, lastMatch ? lastMatch.index + lastMatch[0].length : 0),
      end,
    ]);

    return result;
  }

  return {
    TaggedTemplateExpression(
      node: ESTree.TaggedTemplateExpression & Rule.NodeParentExtension,
    ) {
      // For now just don't check constants if they contain other template literal expressions
      if (node.quasi.expressions.length > 0) return;
      const tagText = sourceCode.getText(node.tag);
      if (!tagText.startsWith("$")) return;
      const tagName = tagText.slice(1);
      const tagElements = singularTags.get(tagName) ?? pluralTags.get(tagName);
      if (!tagElements) return;

      for (const quasi of node.quasi.quasis) {
        const segments = pluralTags.has(tagName)
          ? splitWithLocation(quasi, /\s*(?<!(?<!\\)\\),\s*/g)
          : splitWithLocation(quasi, /(?!)/g); // Never matches - don't split.

        for (const [segmentRaw, start, end] of segments) {
          const range: [number, number] = [
            sourceCode.getIndexFromLoc(start),
            sourceCode.getIndexFromLoc(end),
          ];
          const segment = segmentRaw.replace(/(?<!\\)\\,/, ",");
          const lowerCaseSegment = segment.toLowerCase();
          const properlyCapitalized = tagElements.caseMap.get(lowerCaseSegment);
          const disambiguations =
            tagElements.prefixSuffixMap.get(lowerCaseSegment);

          if (properlyCapitalized === undefined) {
            const decoded = decodeEntities(segment);
            const decodedProperlyCapitalized = tagElements.caseMap.get(
              decoded.toLowerCase(),
            );
            if (decodedProperlyCapitalized !== undefined) {
              if (!options?.ignoreEntities) {
                context.report({
                  node,
                  message: `Enumerated value "${segment}" has HTML entities; should be "${decodedProperlyCapitalized}".`,
                  fix(fixer) {
                    return fixer.replaceTextRange(
                      range,
                      decodedProperlyCapitalized,
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
                      dis.replace(",", "\\,"),
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
                    disambiguations[0].replace(",", "\\,"),
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
                properlySpaced,
              );
            },
          });
        }
      }
    },
  };
}
