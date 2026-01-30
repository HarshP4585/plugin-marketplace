/**
 * Pre-built Framework Templates
 *
 * These templates provide starting points for common compliance frameworks.
 * Users can import them directly or customize before importing.
 */

// Import templates from JSON files
import gdprTemplate from "./templates/gdpr.json";
import soc2Template from "./templates/soc2.json";
import hipaaTemplate from "./templates/hipaa.json";
import iso27001StarterTemplate from "./templates/iso27001-starter.json";
import customStarterTemplate from "./templates/custom-starter.json";
import pciDssLiteTemplate from "./templates/pci-dss-lite.json";
import nistCsfTemplate from "./templates/nist-csf.json";
import cisControlsTemplate from "./templates/cis-controls.json";
import ccpaTemplate from "./templates/ccpa.json";
import aiEthicsTemplate from "./templates/ai-ethics.json";
import doraTemplate from "./templates/dora.json";
import dataGovernanceTemplate from "./templates/data-governance.json";

export interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  framework: {
    name: string;
    description: string;
    version: string;
    is_organizational: boolean;
    hierarchy: {
      type: "two_level" | "three_level";
      level1_name: string;
      level2_name: string;
      level3_name?: string;
    };
    structure: any[];
  };
}

export const frameworkTemplates: FrameworkTemplate[] = [
  gdprTemplate as FrameworkTemplate,
  soc2Template as FrameworkTemplate,
  hipaaTemplate as FrameworkTemplate,
  iso27001StarterTemplate as FrameworkTemplate,
  customStarterTemplate as FrameworkTemplate,
  pciDssLiteTemplate as FrameworkTemplate,
  nistCsfTemplate as FrameworkTemplate,
  cisControlsTemplate as FrameworkTemplate,
  ccpaTemplate as FrameworkTemplate,
  aiEthicsTemplate as FrameworkTemplate,
  doraTemplate as FrameworkTemplate,
  dataGovernanceTemplate as FrameworkTemplate,
];

export const templateCategories = [
  { id: "all", name: "All Templates" },
  { id: "Privacy", name: "Privacy" },
  { id: "Security", name: "Security" },
  { id: "Healthcare", name: "Healthcare" },
  { id: "Financial", name: "Financial" },
  { id: "AI Governance", name: "AI Governance" },
  { id: "Data Management", name: "Data Management" },
  { id: "Template", name: "Starter Templates" },
];
