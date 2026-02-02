/**
 * SOC 2 Type II Framework Plugin
 *
 * Auto-generated from template.json - do not edit directly.
 * To modify, update template.json and rebuild.
 */

import { createFrameworkPlugin } from "../../packages/custom-framework-base";
import template from "./template.json";

const plugin = createFrameworkPlugin({
  key: "soc2",
  name: "SOC 2 Type II Framework",
  description: "Service Organization Control 2 framework based on Trust Services Criteria covering Security, Availability, Processing Integrity, Confidentiality, and Privacy.",
  version: "1.0.0",
  author: "VerifyWise",
  template: (template as any).framework,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
