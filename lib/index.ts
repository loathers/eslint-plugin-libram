/**
 * @fileoverview Eslint rules for Libram
 * @author Patrick Hulin
 */
import { rule as verifyConstants } from "./rules/verify-constants.js";

const rules = {
  "verify-constants": verifyConstants,
};

const plugin = {
  meta: {
    name: "eslint-plugin-libram",
    version: "0.5.2",
  },
  configs: {
    get recommended() {
      return recommended;
    },
  },
  rules,
  processors: {},
};

const recommended = [
  {
    plugins: {
      libram: plugin,
    },
    rules: {
      "libram/verify-constants": "error" as const,
    },
  },
];

export default plugin;

export { verifyConstantsSinceRevision } from "./loadData.js";
