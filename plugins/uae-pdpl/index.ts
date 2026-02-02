/**
 * UAE Personal Data Protection Law Plugin
 *
 * Auto-generated from template.json - do not edit directly.
 * To modify, update template.json and rebuild.
 */

import { createFrameworkPlugin } from "../../packages/custom-framework-base";
import template from "./template.json";

const plugin = createFrameworkPlugin({
  key: "uae-pdpl",
  name: "UAE Personal Data Protection Law",
  description: "UAE Federal Decree-Law No. 45/2021 on Personal Data Protection and AI governance framework.",
  version: "1.0.0",
  author: "VerifyWise",
  template: (template as any).framework,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
