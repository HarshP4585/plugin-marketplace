/**
 * CCPA Compliance Framework Plugin
 *
 * Auto-generated from template.json - do not edit directly.
 * To modify, update template.json and rebuild.
 */

import { createFrameworkPlugin } from "../../packages/custom-framework-base";
import template from "./template.json";

const plugin = createFrameworkPlugin({
  key: "ccpa",
  name: "CCPA Compliance Framework",
  description: "California Consumer Privacy Act framework for protecting California residents' personal information and providing consumer rights.",
  version: "1.0.0",
  author: "VerifyWise",
  template: (template as any).framework,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
