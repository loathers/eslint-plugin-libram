/**
 * @fileoverview Capitalize enumerated type constants.
 * @author Patrick Hulin
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import rule from "../../../lib/rules/verify-constants";
import { RuleTester } from "eslint";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
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
  ],

  invalid: [
    {
      code: "$item`Hair Spray`",
      output: "$item`hair spray`",
      errors: [
        {
          message:
            'Enumerated value name "Hair Spray" should be capitalized "hair spray".',
        },
      ],
    },
    {
      code: "$item`Newbiesport&trade; tent`",
      output: "$item`Newbiesport™ tent`",
      errors: [
        {
          message:
            'Enumerated value "Newbiesport&trade; tent" has HTML entities; should be "Newbiesport™ tent".',
        },
      ],
    },
    {
      code: "$items`Hair Spray, Newbiesport&trade; tent, buged bÃ¶n±Ã©t`",
      output: "$items`hair spray, Newbiesport™ tent, buged bÃ¶n±Ã©t`",
      errors: [
        {
          message:
            'Enumerated value name "Hair Spray" should be capitalized "hair spray".',
        },
        {
          message:
            'Enumerated value "Newbiesport&trade; tent" has HTML entities; should be "Newbiesport™ tent".',
        },
        {
          message: 'Unrecognized enumerated value name "buged bÃ¶n±Ã©t".',
        },
      ],
    },
    {
      code: "$effects`And Your Family, Too`",
      output: "$effects`And Your Family\\, Too, Too`",
      errors: [
        {
          message:
            'Enumerated value "And Your Family" should be "And Your Family, Too".',
        },
        {
          message: 'Unrecognized enumerated value name "Too".',
        },
      ],
    },
    {
      code: "$skill`fat leon's phat loot lyric`",
      output: "$skill`Fat Leon's Phat Loot Lyric`",
      errors: [
        {
          message:
            'Enumerated value name "fat leon\'s phat loot lyric" should be capitalized "Fat Leon\'s Phat Loot Lyric".',
        },
      ],
    },
    {
      code: "$class`vampyre`",
      output: "$class`Vampyre`",
      errors: [
        {
          message:
            'Enumerated value name "vampyre" should be capitalized "Vampyre".',
        },
      ],
    },
    {
      code: "$location`the middle chamber`",
      output: "$location`The Middle Chamber`",
      errors: [
        {
          message:
            'Enumerated value name "the middle chamber" should be capitalized "The Middle Chamber".',
        },
      ],
    },
    {
      code: "$items` hair spray,glittery mascara,\t   Ben-Gal™ Balm   `",
      output: "$items`hair spray, glittery mascara, Ben-Gal™ Balm`",
      errors: [
        {
          message:
            "Enumerated value constants should be separated by a comma and space.",
        },
      ],
    },
    {
      code: "$effect`Hip to the Jive`",
      output: "$effect`Hip to the Jive`",
      errors: [
        {
          message: 'Ambiguous value name "Hip to the Jive".',
        },
      ],
    },
    {
      code: "$effect`plump and chub`",
      output: "$effect`Plump and Chubby`",
      errors: [
        {
          message:
            'Enumerated value "plump and chub" should be "Plump and Chubby".',
        },
      ],
    },
    {
      code: "$item`1234`",
      output: "$item`plexiglass pants`",
      errors: [
        {
          message:
            'Enumerated value name "1234" should be "plexiglass pants" not an id.',
        },
      ],
    },
    {
      code: "$item`1.234`",
      errors: [
        {
          message: 'Unrecognized enumerated value name "1.234".',
        },
      ],
    },
    {
      code: "$item`1234 `",
      output: "$item`plexiglass pants `",
      errors: [
        {
          message:
            'Enumerated value name "1234" should be "plexiglass pants" not an id.',
        },
        {
          message:
            "Enumerated value constants should be separated by a comma and space.",
        },
      ],
    },
    {
      code: "$location`0`",
      errors: [
        {
          message: 'Unrecognized enumerated value name "0".',
        },
      ],
    },
  ],
});
