/**
 * @fileoverview Eslint rules for Libram
 * @author Patrick Hulin
 */
import { ESLint } from "eslint";
import * as verifyConstants from "./rules/verify-constants";

const plugin: ESLint.Plugin = {
  meta: {
    name: "eslint-plugin-libram",
    version: "0.5.0",
  },
  configs: {},
  rules: {
    "verify-constants": verifyConstants,
  },
  processors: {},
};

export default plugin;
module.exports = plugin;

export { loadData } from "./loadData";
