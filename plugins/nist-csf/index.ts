/**
 * NIST Cybersecurity Framework Plugin
 *
 * Auto-generated from template.json - do not edit directly.
 * To modify, update template.json and rebuild.
 */

import { createFrameworkPlugin } from "../../packages/custom-framework-base";
import template from "./template.json";

const plugin = createFrameworkPlugin({
  key: "nist-csf",
  name: "NIST Cybersecurity Framework",
  description: "The NIST Cybersecurity Framework provides a policy framework of computer security guidance for organizations to assess and improve their ability to prevent, detect, and respond to cyber attacks.",
  version: "1.1",
  author: "VerifyWise",
  template: (template as any).framework,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
