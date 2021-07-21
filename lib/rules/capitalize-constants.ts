/**
 * @fileoverview Capitalize enumerated type constants.
 * @author Patrick Hulin
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

import { Rule } from "eslint";
import * as ESTree from "estree";

const singularTags = [
  "$bounty",
  "$class",
  "$coinmaster",
  "$effect",
  "$element",
  "$familiar",
  "$item",
  "$location",
  "$monster",
  "$phylum",
  "$servant",
  "$skill",
  "$slot",
  "$stat",
  "$thrall",
];
const pluralTags = [
  "$bounties",
  "$classes",
  "$coinmasters",
  "$effects",
  "$elements",
  "$familiars",
  "$items",
  "$locations",
  "$monsters",
  "$phylums",
  "$servants",
  "$skills",
  "$slots",
  "$stats",
  "$thralls",
];

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: "Capitalize enumerated type constants.",
      category: "Fill me in",
      recommended: false,
    },
    fixable: "code",
    schema: [
      // fill in your schema
    ],
  },

  create(context: Rule.RuleContext) {
    const sourceCode = context.getSourceCode();

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    // any helper functions should go here or else delete this section

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      TaggedTemplateExpression(
        node: ESTree.TaggedTemplateExpression & Rule.NodeParentExtension
      ) {
        console.log("tag", sourceCode.getText(node.tag));
        console.log("expressions", sourceCode.getText(node.tag));
      },
    };
  },
};

export default rule;
