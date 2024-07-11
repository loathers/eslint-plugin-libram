import { readFileSync } from "fs";
import { decode as decodeEntities } from "html-entities";

// Minimum length of substrings before checking for matches.
const SUBSTRING_MIN_LENGTH = 5;

class TagInfo {
  filename: string;
  singular: Singulars;
  plural: Plurals;
  data: string[] = [];
  caseMap: Map<string, string> = new Map();
  prefixSuffixMap: Map<string, string[]> = new Map();

  constructor(singular: Singulars, plural: Plurals) {
    this.singular = singular;
    this.plural = plural;
    this.filename = `${plural}.json`;
  }

  load(data?: string[]) {
    data ??= JSON.parse(
      readFileSync(`${__dirname}/../data/${this.filename}`, {
        encoding: "utf-8",
      }),
    ) as string[];

    const dataParsed = ["none", ...data.map((s) => decodeEntities(s))];
    this.data = dataParsed;
    this.caseMap = new Map(dataParsed.map((s) => [s.toLowerCase(), s]));

    const prefixSuffixSetMap = new Map<string, Set<string>>();
    for (const element of dataParsed) {
      const elementLower = element.toLowerCase();
      const indices = Array.from(new Array(element.length).keys()).slice(
        SUBSTRING_MIN_LENGTH,
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
      ]),
    );
  }
}

// Singular, plural, require disambiguation
export const ALL_TAGS = [
  ["class", "classes", false],
  ["effect", "effects", true],
  ["familiar", "familiars", false],
  ["item", "items", true],
  ["location", "locations", false],
  ["monster", "monsters", true],
  ["path", "paths", false],
  ["skill", "skills", true],
] as const;

export type Singulars = (typeof ALL_TAGS)[number][0];
export type Plurals = (typeof ALL_TAGS)[number][1];

export const tags = ALL_TAGS.map(
  ([singular, plural]) => new TagInfo(singular, plural),
);

export const singularTags = new Map<string, TagInfo>(
  tags.map((tagInfo) => [tagInfo.singular, tagInfo]),
);

export const pluralTags = new Map<string, TagInfo>(
  tags.map((tagInfo) => [tagInfo.plural, tagInfo]),
);
