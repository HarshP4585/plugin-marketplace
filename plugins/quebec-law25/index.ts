/**
 * Quebec Law 25 (Bill 64) Compliance Framework Plugin
 *
 * Auto-generated from template.json - do not edit directly.
 * To modify, update template.json and rebuild.
 */

import { createFrameworkPlugin } from "../../packages/custom-framework-base";
import template from "./template.json";

const plugin = createFrameworkPlugin({
  key: "quebec-law25",
  name: "Quebec Law 25 (Bill 64) Compliance Framework",
  description: "Quebec's Act respecting the protection of personal information in the private sector, as modernized by Bill 64. Comprehensive data protection framework for organizations operating in Quebec.",
  version: "1.0.0",
  author: "VerifyWise",
  template: (template as any).framework,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
