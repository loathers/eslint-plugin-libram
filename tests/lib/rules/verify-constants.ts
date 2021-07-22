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
      code: "$items`hair spray, Newbiesport™ tent, bugged bÃ¶n±Ã©t  `",
    },
    {
      code: "$effects`And Your Family\\, Too, Sugar Rush`",
    },
  ],

  invalid: [
    {
      code: "$item`Hair Spray`",
      errors: [
        {
          message:
            'Enumerated value name "Hair Spray" should be capitalized "hair spray".',
        },
      ],
    },
    {
      code: "$item`Newbiesport&trade; tent`",
      errors: [
        {
          message:
            'Enumerated value "Newbiesport&trade; tent" has HTML entities; should be "Newbiesport™ tent".',
        },
      ],
    },
    {
      code: "$items`Hair Spray, Newbiesport&trade; tent, buged bÃ¶n±Ã©t  `",
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
          message: 'Unrecognized enumerated value name "buged bÃ¶n±Ã©t"',
        },
      ],
    },
    {
      code: "$effects`And Your Family, Too`",
      errors: [
        {
          message: 'Unrecognized enumerated value name "And Your Family"',
        },
        {
          message: 'Unrecognized enumerated value name "Too"',
        },
      ],
    },
  ],
});
