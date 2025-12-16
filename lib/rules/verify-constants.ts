import { ESLintUtils } from "@typescript-eslint/utils";

import { decode as decodeEntities } from "html-entities";

import { pluralTags, singularTags, tags } from "../tags.js";
import { Position, TemplateElement } from "estree";
import { SuggestionReportDescriptor } from "@typescript-eslint/utils/ts-eslint";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://loathers.net/eslint/${name}`,
);

type Options = [
  {
    ignoreCapitalization?: boolean;
    ignoreEntities?: boolean;
    ignoreUnrecognized?: boolean;
    data?: Partial<Record<string, string[]>>;
  },
];

type MessageIds =
  | "decodeHtmlEntities"
  | "ambiguousValueName"
  | "valueShouldBe"
  | "changeValueTo"
  | "unrecognizedValue"
  | "shouldBeCapitalized"
  | "invalidSeparator";

export const rule = createRule<Options, MessageIds>({
  name: "verify-constants",
  create(context) {
    const sourceCode = context.sourceCode;
    const options = context.options[0];

    // Allow user to provide custom data for testing or other purposes
    pluralTags.forEach((tag) => {
      tag.load(options?.data?.[tag.plural]);
    });

    function positionAdd(position: Position, offset: number) {
      return sourceCode.getLocFromIndex(
        sourceCode.getIndexFromLoc(position) + offset,
      );
    }

    function splitWithLocation(quasi: TemplateElement, pattern: RegExp) {
      const startOffset = quasi.value.raw.match(/^\s*/)![0].length;
      const endOffset = quasi.value.raw.match(/\s*$/)![0].length;
      // We have to add/subtract one here to deal with the backticks.
      const start = positionAdd(quasi.loc!.start, startOffset + 1);
      const end = positionAdd(quasi.loc!.end, -endOffset - 1);

      const result: [string, Position, Position][] = [];

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
        positionAdd(
          start,
          lastMatch ? lastMatch.index + lastMatch[0].length : 0,
        ),
        end,
      ]);

      return result;
    }

    return {
      TaggedTemplateExpression(node) {
        // For now just don't check constants if they contain other template literal expressions
        if (node.quasi.expressions.length > 0) return;
        const tagText = sourceCode.getText(node.tag);
        if (!tagText.startsWith("$")) return;
        const tagName = tagText.slice(1);
        const tagElements =
          singularTags.get(tagName) ?? pluralTags.get(tagName);
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
            const properlyCapitalized =
              tagElements.caseMap.get(lowerCaseSegment);
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
                    messageId: "decodeHtmlEntities",
                    data: {
                      actual: segment,
                      expected: decodedProperlyCapitalized,
                    },
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
                    messageId: "changeValueTo",
                    data: { expected: dis },
                    fix: () => ({
                      range,
                      text: dis.replace(",", "\\,"),
                    }),
                  } satisfies SuggestionReportDescriptor<MessageIds>;
                });
                context.report({
                  node,
                  messageId: "ambiguousValueName",
                  data: { actual: segment },
                  suggest: suggestions,
                });
              } else if (
                // Effect names with commas such as $effects`And Your Family, Too` are a degenerate case
                disambiguations &&
                disambiguations.length > 0
              ) {
                context.report({
                  node,
                  messageId: "valueShouldBe",
                  data: { actual: segment, expected: disambiguations[0] },
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
                  messageId: "unrecognizedValue",
                  data: { actual: segment },
                });
              }
            } else if (
              !options?.ignoreCapitalization &&
              segment !== properlyCapitalized
            ) {
              context.report({
                node,
                messageId: "shouldBeCapitalized",
                data: { actual: segment, expected: properlyCapitalized },
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
              messageId: "invalidSeparator",
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
  },
  defaultOptions: [
    {
      ignoreCapitalization: false,
      ignoreEntities: false,
      ignoreUnrecognized: false,
      data: {},
    },
  ],
  meta: {
    docs: {
      description: "Verify enumerated type constants.",
    },
    messages: {
      decodeHtmlEntities:
        'Enumerated value "{{actual}}" has HTML entities; should be "{{expected}}".',
      ambiguousValueName: 'Ambiguous value name "{{actual}}".',
      valueShouldBe: 'Enumerated value "{{actual}}" should be "{{expected}}".',
      changeValueTo: `Change enumerated value to "{{expected}}"`,
      unrecognizedValue: `Unrecognized enumerated value name "{{actual}}".`,
      shouldBeCapitalized: `Enumerated value name "{{actual}}" should be capitalized "{{expected}}".`,
      invalidSeparator: `Enumerated value constants should be separated by a comma and space.`,
    },
    fixable: "code",
    hasSuggestions: true,
    type: "suggestion",
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
  },
});
