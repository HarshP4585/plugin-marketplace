/**
 * CIS Controls v8 Plugin
 *
 * Auto-generated from template.json - do not edit directly.
 * To modify, update template.json and rebuild.
 */

import { createFrameworkPlugin } from "../../packages/custom-framework-base";
import template from "./template.json";

const plugin = createFrameworkPlugin({
  key: "cis-controls",
  name: "CIS Controls v8",
  description: "The CIS Critical Security Controls are a prioritized set of actions that collectively form a defense-in-depth set of best practices to mitigate the most common attacks.",
  version: "8.0",
  author: "VerifyWise",
  template: (template as any).framework,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
