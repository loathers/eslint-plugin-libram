/**
 * @fileoverview Capitalize enumerated type constants.
 * @author Patrick Hulin
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { afterAll, describe, it } from "vitest";
import { rule } from "../../../lib/rules/verify-constants";
import { RuleTester } from "@typescript-eslint/rule-tester";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("verify-constants", rule, {
  valid: [
    {
      code: "$item`hair spray`",
    },
    {
      options: [{ ignoreCapitalization: true }],
      code: "$item`Hair Spray`",
    },
    {
      code: "$item`Newbiesport™ tent`",
    },
    {
      options: [{ ignoreEntities: true }],
      code: "$item`Newbiesport&trade; tent`",
    },
    {
      options: [{ ignoreUnrecognized: true }],
      code: "$item`kfljdafoeiq`",
    },
    {
      code: "$item`bugged bÃ¶n±Ã©t`",
    },
    {
      code: "$monster`party girl`",
    },
    {
      code: "$familiar`Angry Goat`",
    },
    {
      code: "$effect`Video... Games?`",
    },
    {
      code: "$items`hair spray, Newbiesport™ tent, bugged bÃ¶n±Ã©t`",
    },
    {
      code: "$effects`And Your Family\\, Too, Sugar Rush`",
    },
    {
      code: "$items``",
    },
    {
      code: "$items`${'hair spray'}`",
    },
    {
      code: "$skill`Fat Leon's Phat Loot Lyric`",
    },
    {
      code: "$class`Vampyre`",
    },
    {
      code: "$location`The Middle Chamber`",
    },
    {
      code: "$effect`[597]A Little Bit Evil`",
    },
    {
      code: "$effect``",
    },
    {
      code: "$effect`Make Meat FA$T!`",
    },
    {
      code: "$item`Gene Tonic: ${phylum}`",
    },
    {
      code: "$items`Gene Tonic: ${phylum1}, Gene Tonic: ${phylum2}`",
    },
    {
      code: "$item`gausie`",
      options: [
        {
          data: {
            items: ["gausie"],
          },
        },
      ],
    },
  ],

  invalid: [
    {
      code: "$item`Hair Spray`",
      output: "$item`hair spray`",
      errors: [
        {
          messageId: "shouldBeCapitalized",
          data: {
            actual: "Hair Spray",
            expected: "hair spray",
          },
        },
      ],
    },
    {
      code: "$item`Newbiesport&trade; tent`",
      output: "$item`Newbiesport™ tent`",
      errors: [
        {
          messageId: "decodeHtmlEntities",
          data: {
            actual: "Newbiesport&trade; tent",
            expected: "Newbiesport™ tent",
          },
        },
      ],
    },
    {
      code: "$items`Hair Spray, Newbiesport&trade; tent, buged bÃ¶n±Ã©t`",
      output: "$items`hair spray, Newbiesport™ tent, buged bÃ¶n±Ã©t`",
      errors: [
        {
          messageId: "shouldBeCapitalized",
          data: {
            actual: "Hair Spray",
            expected: "hair spray",
          },
        },
        {
          messageId: "decodeHtmlEntities",
          data: {
            actual: "Newbiesport&trade; tent",
            expected: "Newbiesport™ tent",
          },
        },
        {
          messageId: "unrecognizedValue",
          data: {
            actual: "buged bÃ¶n±Ã©t",
          },
        },
      ],
    },
    {
      code: "$effects`And Your Family, Too`",
      output: "$effects`And Your Family\\, Too, Too`",
      errors: [
        {
          messageId: "valueShouldBe",
          data: {
            actual: "And Your Family",
            expected: "And Your Family, Too",
          },
        },
        {
          messageId: "unrecognizedValue",
          data: {
            actual: "Too",
          },
        },
      ],
    },
    {
      code: "$skill`fat leon's phat loot lyric`",
      output: "$skill`Fat Leon's Phat Loot Lyric`",
      errors: [
        {
          messageId: "shouldBeCapitalized",
          data: {
            actual: "fat leon's phat loot lyric",
            expected: "Fat Leon's Phat Loot Lyric",
          },
        },
      ],
    },
    {
      code: "$class`vampyre`",
      output: "$class`Vampyre`",
      errors: [
        {
          messageId: "shouldBeCapitalized",
          data: {
            actual: "vampyre",
            expected: "Vampyre",
          },
        },
      ],
    },
    {
      code: "$location`the middle chamber`",
      output: "$location`The Middle Chamber`",
      errors: [
        {
          messageId: "shouldBeCapitalized",
          data: {
            actual: "the middle chamber",
            expected: "The Middle Chamber",
          },
        },
      ],
    },
    {
      code: "$items` hair spray,glittery mascara,\t   Ben-Gal™ Balm   `",
      output: "$items`hair spray, glittery mascara, Ben-Gal™ Balm`",
      errors: [
        {
          messageId: "invalidSeparator",
        },
      ],
    },
    {
      code: "$effect`Hip to the Jive`",
      output: null,
      // Ambiguous effect with two possible ids
      errors: [
        {
          messageId: "ambiguousValueName",
          data: {
            actual: "Hip to the Jive",
          },
          suggestions: [
            {
              messageId: "changeValueTo",
              data: {
                expected: "[1701]Hip to the Jive",
              },
              output: "$effect`[1701]Hip to the Jive`",
            },
            {
              messageId: "changeValueTo",
              data: {
                expected: "[1872]Hip to the Jive",
              },
              output: "$effect`[1872]Hip to the Jive`",
            },
          ],
        },
      ],
    },
    {
      code: "$effect`plump and chub`",
      output: "$effect`Plump and Chubby`",
      errors: [
        {
          messageId: "valueShouldBe",
          data: {
            actual: "plump and chub",
            expected: "Plump and Chubby",
          },
        },
      ],
    },
  ],
});
