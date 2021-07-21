/**
 * @fileoverview Capitalize enumerated type constants.
 * @author Patrick Hulin
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/capitalize-constants"),

    RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run("capitalize-constants", rule, {

    valid: [

        // give me some code that won't trigger a warning
    ],

    invalid: [
        {
            code: "$item`Hair Spray`",
            errors: [{
                message: "Fill me in.",
                type: "Me too"
            }]
        }
    ]
});
