/**
 * Risk Importer Plugin
 *
 * Bulk import risks from CSV or Excel files.
 * Supports column mapping, validation, duplicate detection, and import to projects/frameworks.
 */

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// Risk field definitions for Project Risks
const PROJECT_RISK_FIELDS = [
  { field: "risk_name", label: "Risk name", required: true, type: "string" },
  { field: "risk_description", label: "Risk description", required: true, type: "string" },
  { field: "ai_lifecycle_phase", label: "AI lifecycle phase", required: false, type: "enum", options: ["Problem definition & planning", "Data collection & processing", "Model development & training", "Model validation & testing", "Deployment & integration", "Monitoring & maintenance", "Decommissioning & retirement"] },
  { field: "risk_category", label: "Risk category", required: false, type: "enum", options: ["Strategic risk", "Operational risk", "Compliance risk", "Financial risk", "Cybersecurity risk", "Reputational risk", "Legal risk", "Technological risk", "Third-party/vendor risk", "Environmental risk", "Human resources risk", "Geopolitical risk", "Fraud risk", "Data privacy risk", "Health and safety risk"] },
  { field: "impact", label: "Impact", required: false, type: "string" },
  { field: "likelihood", label: "Likelihood", required: false, type: "enum", options: ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"] },
  { field: "severity", label: "Severity", required: false, type: "enum", options: ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"] },
  { field: "review_notes", label: "Review notes", required: false, type: "string" },
  { field: "mitigation_status", label: "Mitigation status", required: false, type: "enum", options: ["Not Started", "In Progress", "Completed", "On Hold", "Deferred", "Canceled", "Requires review"] },
  { field: "current_risk_level", label: "Current risk level", required: false, type: "enum", options: ["Very Low risk", "Low risk", "Medium risk", "High risk", "Very high risk"] },
  { field: "deadline", label: "Deadline", required: false, type: "date" },
  { field: "mitigation_plan", label: "Mitigation plan", required: false, type: "string" },
];

// Risk field definitions for Vendor Risks
const VENDOR_RISK_FIELDS = [
  { field: "risk_description", label: "Risk description", required: true, type: "string" },
  { field: "impact_description", label: "Impact description", required: false, type: "string" },
  { field: "likelihood", label: "Likelihood", required: false, type: "enum", options: ["Very likely", "Likely", "Possible", "Unlikely", "Rare"] },
  { field: "risk_severity", label: "Risk severity", required: false, type: "enum", options: ["Very high", "High", "Moderate", "Low", "Very low"] },
  { field: "action_plan", label: "Action plan", required: false, type: "string" },
  { field: "action_owner", label: "Action owner", required: false, type: "string" },
];

// Risk level calculation matrix
const RISK_MATRIX = {
  "Almost Certain": { "Catastrophic": "Very high risk", "Major": "Very high risk", "Moderate": "High risk", "Minor": "Medium risk", "Negligible": "Low risk" },
  "Likely": { "Catastrophic": "Very high risk", "Major": "High risk", "Moderate": "High risk", "Minor": "Medium risk", "Negligible": "Low risk" },
  "Possible": { "Catastrophic": "High risk", "Major": "High risk", "Moderate": "Medium risk", "Minor": "Low risk", "Negligible": "Very low risk" },
  "Unlikely": { "Catastrophic": "Medium risk", "Major": "Medium risk", "Moderate": "Low risk", "Minor": "Low risk", "Negligible": "Very low risk" },
  "Rare": { "Catastrophic": "Low risk", "Major": "Low risk", "Moderate": "Very low risk", "Minor": "Very low risk", "Negligible": "No risk" },
};

function calculateRiskLevel(likelihood, severity) {
  if (!likelihood || !severity) return null;
  return RISK_MATRIX[likelihood]?.[severity] || null;
}

// Read manifest from file
function loadManifest() {
  try {
    const manifestPath = path.join(__dirname, "manifest.json");
    const content = fs.readFileSync(manifestPath, "utf8");
    return JSON.parse(content);
  } catch {
    return {
      id: "risk-importer",
      name: "Risk importer",
      description: "Bulk import risks from CSV or Excel files",
      version: "1.0.0",
      author: "VerifyWise",
      type: "feature",
      permissions: ["database:read", "database:write"],
      config: {},
    };
  }
}

// Read icon from file
function getIcon() {
  try {
    const iconPath = path.join(__dirname, "icon.svg");
    return fs.readFileSync(iconPath, "utf8");
  } catch {
    return "";
  }
}

let pluginContext = null;

/**
 * Risk Importer Plugin Definition
 */
const riskImporterPlugin = {
  manifest: {
    ...loadManifest(),
    icon: getIcon(),
  },

  async onInstall(ctx) {
    ctx.logger.info("Risk Importer plugin installed");
  },

  async onUninstall(ctx) {
    ctx.logger.info("Risk Importer plugin uninstalled");
  },

  async onLoad(ctx) {
    pluginContext = ctx;
    ctx.logger.info("Risk Importer plugin loaded");
  },

  async onUnload(ctx) {
    pluginContext = null;
    ctx.logger.info("Risk Importer plugin unloaded");
  },

  async onEnable(ctx) {
    pluginContext = ctx;
    ctx.logger.info("Risk Importer plugin enabled");
  },

  async onDisable(ctx) {
    ctx.logger.info("Risk Importer plugin disabled");
  },

  /**
   * Routes for the import workflow
   */
  routes(router) {
    // GET /api/plugins/risk-importer/config
    router.get("/config", (_req, res) => {
      const config = {
        maxFileSizeMB: pluginContext?.config.get("maxFileSizeMB", 10),
        defaultRiskType: pluginContext?.config.get("defaultRiskType", "project"),
        defaultDuplicateAction: pluginContext?.config.get("defaultDuplicateAction", "skip"),
        autoCalculateRiskLevel: pluginContext?.config.get("autoCalculateRiskLevel", true),
        previewRowCount: pluginContext?.config.get("previewRowCount", 5),
      };

      res.json({
        success: true,
        data: config,
      });
    });

    // GET /api/plugins/risk-importer/fields
    router.get("/fields", (req, res) => {
      const riskType = req.query.type || "project";
      const fields = riskType === "vendor" ? VENDOR_RISK_FIELDS : PROJECT_RISK_FIELDS;

      res.json({
        success: true,
        data: {
          fields,
          riskType,
        },
      });
    });

    // POST /api/plugins/risk-importer/parse
    router.post("/parse", async (req, res) => {
      try {
        const { fileContent, fileName } = req.body;

        if (!fileContent) {
          return res.status(400).json({
            success: false,
            error: "No file content provided",
          });
        }

        if (!fileName || typeof fileName !== "string") {
          return res.status(400).json({
            success: false,
            error: "File name is required",
          });
        }

        // Decode base64 file content
        const buffer = Buffer.from(fileContent, "base64");

        // Validate file size
        const maxFileSizeMB = pluginContext?.config.get("maxFileSizeMB", 10);
        const MAX_FILE_SIZE = maxFileSizeMB * 1024 * 1024;
        if (buffer.length > MAX_FILE_SIZE) {
          return res.status(400).json({
            success: false,
            error: `File size exceeds ${maxFileSizeMB}MB limit`,
          });
        }

        // Parse file based on extension
        const extension = path.extname(fileName || "").toLowerCase();
        let workbook;

        if (extension === ".csv") {
          const csvText = buffer.toString("utf8");
          workbook = XLSX.read(csvText, { type: "string" });
        } else if (extension === ".xlsx" || extension === ".xls") {
          workbook = XLSX.read(buffer, { type: "buffer" });
        } else {
          return res.status(400).json({
            success: false,
            error: "Unsupported file format. Please upload a CSV or Excel file.",
          });
        }

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rawData.length === 0) {
          return res.status(400).json({
            success: false,
            error: "File is empty",
          });
        }

        // First row is headers
        const headers = rawData[0].map((h) => String(h || "").trim());

        // Parse remaining rows
        const rows = rawData.slice(1)
          .map((row, index) => {
            const data = {};
            headers.forEach((header, colIndex) => {
              data[header] = String(row[colIndex] ?? "").trim();
            });
            return {
              rowIndex: index + 2,
              data,
            };
          })
          .filter((row) => {
            return Object.values(row.data).some((value) => value.length > 0);
          });

        res.json({
          success: true,
          data: {
            columns: headers,
            rowCount: rows.length,
            preview: rows.slice(0, pluginContext?.config.get("previewRowCount", 5)),
            allRows: rows,
          },
        });
      } catch (error) {
        pluginContext?.logger.error("Failed to parse file:", error);
        res.status(500).json({
          success: false,
          error: "Failed to parse file",
        });
      }
    });

    // POST /api/plugins/risk-importer/validate
    router.post("/validate", async (req, res) => {
      try {
        const { rows, mapping, riskType } = req.body;

        const fields = riskType === "vendor" ? VENDOR_RISK_FIELDS : PROJECT_RISK_FIELDS;
        const requiredFields = fields.filter((f) => f.required).map((f) => f.field);

        const results = rows.map((row) => {
          const errors = [];
          const mappedData = {};

          // Apply mapping
          mapping.forEach((m) => {
            const value = row.data[m.sourceColumn];
            mappedData[m.targetField] = value || null;
          });

          // Check required fields
          requiredFields.forEach((field) => {
            if (!mappedData[field]) {
              const fieldDef = fields.find((f) => f.field === field);
              errors.push(`${fieldDef?.label || field} is required`);
            }
          });

          // Validate enum fields
          fields.filter((f) => f.type === "enum").forEach((field) => {
            const value = mappedData[field.field];
            if (value && field.options && !field.options.includes(value)) {
              errors.push(`${field.label} must be one of: ${field.options.join(", ")}`);
            }
          });

          // Validate date fields
          fields.filter((f) => f.type === "date").forEach((field) => {
            const value = mappedData[field.field];
            if (value) {
              const parsed = new Date(value);
              if (isNaN(parsed.getTime())) {
                errors.push(`${field.label} must be a valid date`);
              } else {
                mappedData[field.field] = parsed.toISOString();
              }
            }
          });

          // Calculate risk level
          const autoCalculate = pluginContext?.config.get("autoCalculateRiskLevel", true);
          if (autoCalculate) {
            if (riskType === "project") {
              const likelihood = mappedData.likelihood;
              const severity = mappedData.severity;
              const calculatedLevel = calculateRiskLevel(likelihood, severity);
              if (calculatedLevel) {
                mappedData.risk_level_autocalculated = calculatedLevel;
              }
            } else if (riskType === "vendor") {
              const likelihood = mappedData.likelihood;
              const severity = mappedData.risk_severity;
              const calculatedLevel = calculateRiskLevel(likelihood, severity);
              if (calculatedLevel) {
                mappedData.risk_level = calculatedLevel;
              }
            }
          }

          return {
            rowIndex: row.rowIndex,
            isValid: errors.length === 0,
            errors,
            data: mappedData,
          };
        });

        const validCount = results.filter((r) => r.isValid).length;
        const invalidCount = results.filter((r) => !r.isValid).length;

        res.json({
          success: true,
          data: {
            results,
            summary: {
              total: results.length,
              valid: validCount,
              invalid: invalidCount,
            },
          },
        });
      } catch (error) {
        pluginContext?.logger.error("Validation failed:", error);
        res.status(500).json({
          success: false,
          error: "Validation failed",
        });
      }
    });

    // POST /api/plugins/risk-importer/check-duplicates
    router.post("/check-duplicates", async (req, res) => {
      try {
        const { validatedRows, riskType } = req.body;
        const tenantId = req.tenantId;

        if (!tenantId) {
          return res.status(401).json({
            success: false,
            error: "Unauthorized - tenant not found",
          });
        }

        const sequelize = pluginContext?.sequelize;
        if (!sequelize) {
          return res.status(500).json({
            success: false,
            error: "Database not available",
          });
        }

        const duplicates = [];

        for (const row of validatedRows) {
          if (!row.isValid) {
            duplicates.push({
              rowIndex: row.rowIndex,
              existingRiskId: null,
              existingRiskName: null,
              isDuplicate: false,
            });
            continue;
          }

          let existingRisk = null;

          if (riskType === "project") {
            const riskName = row.data.risk_name;
            if (riskName) {
              const result = await sequelize.query(
                `SELECT id, risk_name FROM "${tenantId}".risks WHERE risk_name = :risk_name AND is_deleted = false LIMIT 1`,
                {
                  replacements: { risk_name: riskName },
                }
              );
              existingRisk = result[0]?.[0];
            }
          } else {
            const riskDescription = row.data.risk_description;
            if (riskDescription) {
              const result = await sequelize.query(
                `SELECT id, risk_description FROM "${tenantId}".vendorRisks WHERE risk_description = :risk_description AND is_deleted = false LIMIT 1`,
                {
                  replacements: { risk_description: riskDescription },
                }
              );
              existingRisk = result[0]?.[0];
            }
          }

          duplicates.push({
            rowIndex: row.rowIndex,
            existingRiskId: existingRisk?.id || null,
            existingRiskName: riskType === "project"
              ? existingRisk?.risk_name || null
              : existingRisk?.risk_description || null,
            isDuplicate: !!existingRisk,
          });
        }

        const duplicateCount = duplicates.filter((d) => d.isDuplicate).length;

        res.json({
          success: true,
          data: {
            duplicates,
            summary: {
              total: duplicates.length,
              duplicates: duplicateCount,
              unique: duplicates.length - duplicateCount,
            },
          },
        });
      } catch (error) {
        pluginContext?.logger.error("Duplicate check failed:", error);
        res.status(500).json({
          success: false,
          error: "Duplicate check failed",
        });
      }
    });

    // POST /api/plugins/risk-importer/import
    router.post("/import", async (req, res) => {
      const sequelize = pluginContext?.sequelize;
      if (!sequelize) {
        return res.status(500).json({
          success: false,
          error: "Database not available",
        });
      }

      const transaction = await sequelize.transaction();

      try {
        const { validatedRows, duplicateActions, riskType, linkTo } = req.body;
        const tenantId = req.tenantId;

        if (!tenantId) {
          await transaction.rollback();
          return res.status(401).json({
            success: false,
            error: "Unauthorized - tenant not found",
          });
        }

        const results = [];

        for (const row of validatedRows) {
          if (!row.isValid) {
            results.push({
              rowIndex: row.rowIndex,
              success: false,
              error: row.errors.join("; "),
              action: "error",
            });
            continue;
          }

          const duplicateAction = duplicateActions[row.rowIndex] || "create";

          if (duplicateAction === "skip") {
            results.push({
              rowIndex: row.rowIndex,
              success: true,
              action: "skipped",
            });
            continue;
          }

          try {
            if (riskType === "project") {
              const riskData = row.data;

              // Check if overwriting
              if (duplicateAction === "overwrite" && riskData.risk_name) {
                const existingResult = await sequelize.query(
                  `SELECT id FROM "${tenantId}".risks WHERE risk_name = :risk_name AND is_deleted = false LIMIT 1`,
                  {
                    replacements: { risk_name: riskData.risk_name },
                    transaction,
                  }
                );

                if (existingResult[0]?.length > 0) {
                  const existingId = existingResult[0][0].id;

                  await sequelize.query(
                    `UPDATE "${tenantId}".risks SET
                      ai_lifecycle_phase = COALESCE(:ai_lifecycle_phase, ai_lifecycle_phase),
                      risk_description = COALESCE(:risk_description, risk_description),
                      risk_category = COALESCE(:risk_category, risk_category),
                      impact = COALESCE(:impact, impact),
                      likelihood = COALESCE(:likelihood, likelihood),
                      severity = COALESCE(:severity, severity),
                      risk_level_autocalculated = COALESCE(:risk_level_autocalculated, risk_level_autocalculated),
                      mitigation_status = COALESCE(:mitigation_status, mitigation_status),
                      current_risk_level = COALESCE(:current_risk_level, current_risk_level),
                      mitigation_plan = COALESCE(:mitigation_plan, mitigation_plan),
                      updated_at = NOW()
                    WHERE id = :id`,
                    {
                      replacements: {
                        id: existingId,
                        ai_lifecycle_phase: riskData.ai_lifecycle_phase || null,
                        risk_description: riskData.risk_description || null,
                        risk_category: riskData.risk_category ? `{${riskData.risk_category}}` : null,
                        impact: riskData.impact || null,
                        likelihood: riskData.likelihood || null,
                        severity: riskData.severity || null,
                        risk_level_autocalculated: riskData.risk_level_autocalculated || null,
                        mitigation_status: riskData.mitigation_status || null,
                        current_risk_level: riskData.current_risk_level || null,
                        mitigation_plan: riskData.mitigation_plan || null,
                      },
                      transaction,
                    }
                  );

                  results.push({
                    rowIndex: row.rowIndex,
                    success: true,
                    riskId: existingId,
                    action: "overwritten",
                  });
                  continue;
                }
              }

              // Create new risk
              const insertResult = await sequelize.query(
                `INSERT INTO "${tenantId}".risks (
                  risk_name, ai_lifecycle_phase, risk_description,
                  risk_category, impact, assessment_mapping, controls_mapping, likelihood,
                  severity, risk_level_autocalculated, review_notes, mitigation_status,
                  current_risk_level, deadline, mitigation_plan, implementation_strategy,
                  mitigation_evidence_document, likelihood_mitigation, risk_severity,
                  final_risk_level, approval_status, date_of_assessment
                ) VALUES (
                  :risk_name, :ai_lifecycle_phase, :risk_description,
                  :risk_category, :impact, :assessment_mapping, :controls_mapping, :likelihood,
                  :severity, :risk_level_autocalculated, :review_notes, :mitigation_status,
                  :current_risk_level, :deadline, :mitigation_plan, :implementation_strategy,
                  :mitigation_evidence_document, :likelihood_mitigation, :risk_severity,
                  :final_risk_level, :approval_status, :date_of_assessment
                ) RETURNING id`,
                {
                  replacements: {
                    risk_name: riskData.risk_name,
                    ai_lifecycle_phase: riskData.ai_lifecycle_phase || "Problem definition & planning",
                    risk_description: riskData.risk_description,
                    risk_category: riskData.risk_category ? `{${riskData.risk_category}}` : "{Operational risk}",
                    impact: riskData.impact || "To be assessed",
                    assessment_mapping: "",
                    controls_mapping: "",
                    likelihood: riskData.likelihood || "Possible",
                    severity: riskData.severity || "Moderate",
                    risk_level_autocalculated: riskData.risk_level_autocalculated || "Medium risk",
                    review_notes: riskData.review_notes || null,
                    mitigation_status: riskData.mitigation_status || "Not Started",
                    current_risk_level: riskData.current_risk_level || "Medium risk",
                    deadline: riskData.deadline || new Date().toISOString(),
                    mitigation_plan: riskData.mitigation_plan || "To be defined",
                    implementation_strategy: "",
                    mitigation_evidence_document: "",
                    likelihood_mitigation: "Possible",
                    risk_severity: "Moderate",
                    final_risk_level: "",
                    approval_status: "Pending",
                    date_of_assessment: new Date().toISOString(),
                  },
                  transaction,
                }
              );

              const newRiskId = insertResult[0][0].id;

              // Link to project if specified
              if (linkTo?.type === "project" && linkTo.id) {
                await sequelize.query(
                  `INSERT INTO "${tenantId}".projects_risks (project_id, risk_id) VALUES (:project_id, :risk_id)`,
                  {
                    replacements: { project_id: linkTo.id, risk_id: newRiskId },
                    transaction,
                  }
                );
              }

              // Link to framework if specified
              if (linkTo?.type === "framework" && linkTo.id) {
                await sequelize.query(
                  `INSERT INTO "${tenantId}".frameworks_risks (framework_id, risk_id) VALUES (:framework_id, :risk_id)`,
                  {
                    replacements: { framework_id: linkTo.id, risk_id: newRiskId },
                    transaction,
                  }
                );
              }

              results.push({
                rowIndex: row.rowIndex,
                success: true,
                riskId: newRiskId,
                action: "created",
              });

            } else {
              // Handle vendor risk import
              const riskData = row.data;

              if (!linkTo?.id || linkTo.type !== "vendor") {
                results.push({
                  rowIndex: row.rowIndex,
                  success: false,
                  error: "Vendor must be selected for vendor risk import",
                  action: "error",
                });
                continue;
              }

              // Check if overwriting
              if (duplicateAction === "overwrite" && riskData.risk_description) {
                const existingResult = await sequelize.query(
                  `SELECT id FROM "${tenantId}".vendorRisks WHERE risk_description = :risk_description AND vendor_id = :vendor_id AND is_deleted = false LIMIT 1`,
                  {
                    replacements: {
                      risk_description: riskData.risk_description,
                      vendor_id: linkTo.id,
                    },
                    transaction,
                  }
                );

                if (existingResult[0]?.length > 0) {
                  const existingId = existingResult[0][0].id;

                  await sequelize.query(
                    `UPDATE "${tenantId}".vendorRisks SET
                      impact_description = :impact_description,
                      likelihood = :likelihood,
                      risk_severity = :risk_severity,
                      action_plan = :action_plan,
                      action_owner = :action_owner,
                      risk_level = :risk_level,
                      updated_at = NOW()
                    WHERE id = :id`,
                    {
                      replacements: {
                        id: existingId,
                        impact_description: riskData.impact_description || null,
                        likelihood: riskData.likelihood || null,
                        risk_severity: riskData.risk_severity || null,
                        action_plan: riskData.action_plan || null,
                        action_owner: riskData.action_owner || null,
                        risk_level: riskData.risk_level || null,
                      },
                      transaction,
                    }
                  );

                  results.push({
                    rowIndex: row.rowIndex,
                    success: true,
                    riskId: existingId,
                    action: "overwritten",
                  });
                  continue;
                }
              }

              // Create new vendor risk
              const insertResult = await sequelize.query(
                `INSERT INTO "${tenantId}".vendorRisks (
                  vendor_id, risk_description, impact_description,
                  likelihood, risk_severity, action_plan, action_owner, risk_level
                ) VALUES (
                  :vendor_id, :risk_description, :impact_description,
                  :likelihood, :risk_severity, :action_plan, :action_owner, :risk_level
                ) RETURNING id`,
                {
                  replacements: {
                    vendor_id: linkTo.id,
                    risk_description: riskData.risk_description,
                    impact_description: riskData.impact_description || null,
                    likelihood: riskData.likelihood || null,
                    risk_severity: riskData.risk_severity || null,
                    action_plan: riskData.action_plan || null,
                    action_owner: riskData.action_owner || null,
                    risk_level: riskData.risk_level || null,
                  },
                  transaction,
                }
              );

              results.push({
                rowIndex: row.rowIndex,
                success: true,
                riskId: insertResult[0][0].id,
                action: "created",
              });
            }
          } catch (rowError) {
            results.push({
              rowIndex: row.rowIndex,
              success: false,
              error: rowError.message,
              action: "error",
            });
          }
        }

        await transaction.commit();

        const successCount = results.filter((r) => r.success).length;
        const createdCount = results.filter((r) => r.action === "created").length;
        const overwrittenCount = results.filter((r) => r.action === "overwritten").length;
        const skippedCount = results.filter((r) => r.action === "skipped").length;
        const errorCount = results.filter((r) => r.action === "error").length;

        res.json({
          success: true,
          data: {
            results,
            summary: {
              total: results.length,
              success: successCount,
              created: createdCount,
              overwritten: overwrittenCount,
              skipped: skippedCount,
              errors: errorCount,
            },
          },
        });
      } catch (error) {
        await transaction.rollback();
        pluginContext?.logger.error("Import failed:", error);
        res.status(500).json({
          success: false,
          error: "Import failed: " + error.message,
        });
      }
    });

    // GET /api/plugins/risk-importer/template
    router.get("/template", (req, res) => {
      const riskType = req.query.type || "project";
      const format = req.query.format || "csv";

      const fields = riskType === "vendor" ? VENDOR_RISK_FIELDS : PROJECT_RISK_FIELDS;

      // Create workbook with headers
      const workbook = XLSX.utils.book_new();
      const headers = fields.map((f) => f.label);

      // Add example row
      const exampleRow = fields.map((f) => {
        if (f.required) return `Required: ${f.label}`;
        if (f.type === "enum" && f.options) return f.options[0];
        if (f.type === "date") return new Date().toISOString().split("T")[0];
        return "";
      });

      const data = [headers, exampleRow];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Risks");

      // Generate file
      let buffer;
      let contentType;
      let fileName;

      if (format === "xlsx") {
        buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileName = `risk-import-template-${riskType}.xlsx`;
      } else {
        buffer = Buffer.from(XLSX.utils.sheet_to_csv(worksheet));
        contentType = "text/csv";
        fileName = `risk-import-template-${riskType}.csv`;
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(buffer);
    });
  },
};

module.exports = riskImporterPlugin;
