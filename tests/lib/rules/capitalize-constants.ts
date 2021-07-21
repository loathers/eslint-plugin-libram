/**
 * @fileoverview Capitalize enumerated type constants.
 * @author Patrick Hulin
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import rule from "../../../lib/rules/capitalize-constants";
import { RuleTester } from "eslint";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
ruleTester.run("capitalize-constants", rule, {
  valid: [
    // give me some code that won't trigger a warning
  ],

  invalid: [
    {
      code: "$item`Hair Spray`",
      errors: [
        {
          message: "Fill me in.",
          type: "Me too",
        },
      ],
    },
  ],
});
