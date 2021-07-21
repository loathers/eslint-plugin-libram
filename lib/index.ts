/**
 * @fileoverview Eslint rules for Libram
 * @author Patrick Hulin
 */

import requireIndex from "requireindex";

// import all rules in lib/rules
export const rules = requireIndex(__dirname + "/rules");
