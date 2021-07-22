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
      code: "$item`Newbiesport™ tent`",
    },
    {
      options: [{ ignoreCapitalization: true }],
      code: "$item`Hair Spray`",
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
  ],
});
