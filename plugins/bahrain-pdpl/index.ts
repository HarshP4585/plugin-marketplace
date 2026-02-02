/**
 * Bahrain Personal Data Protection Law Plugin
 *
 * Auto-generated from template.json - do not edit directly.
 * To modify, update template.json and rebuild.
 */

import { createFrameworkPlugin } from "../../packages/custom-framework-base";
import template from "./template.json";

const plugin = createFrameworkPlugin({
  key: "bahrain-pdpl",
  name: "Bahrain Personal Data Protection Law",
  description: "Bahrain PDPL 30/2018, CBB AI Notice, and EDB AI Ethics Pledge compliance framework.",
  version: "1.0.0",
  author: "VerifyWise",
  template: (template as any).framework,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
