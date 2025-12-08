# VerifyWise Plugin Marketplace

Official plugin registry for [VerifyWise](https://verifywise.ai) - the AI Governance platform.

## Available Plugins

| Plugin | Description | Type |
|--------|-------------|------|
| [Slack Notifications](./plugins/slack-notifications) | Real-time Slack notifications for risks, tasks, and compliance | Integration |
| [Jira Integration](./plugins/jira-integration) | Sync risks and tasks with Jira | Integration |
| [Microsoft Teams](./plugins/microsoft-teams) | Teams notifications and alerts | Integration |
| [GDPR Compliance Checker](./plugins/gdpr-compliance-checker) | Automated GDPR compliance checking | Framework |
| [ISO 27001](./plugins/iso-27001) | ISO 27001 compliance framework | Framework |
| [SOC 2 Compliance](./plugins/soc2-compliance) | SOC 2 Type I/II compliance tracking | Framework |
| [Audit Trail](./plugins/audit-trail) | Comprehensive activity logging | Feature |

## Installing Plugins

1. Go to **Settings > Plugins** in your VerifyWise instance
2. Browse available plugins in the Marketplace tab
3. Click **Install** on the plugin you want
4. Configure the plugin settings
5. Enable the plugin

## Creating Your Own Plugin

See the [`templates`](./templates) directory for a comprehensive sample plugin with:

- Full documentation and inline comments
- All lifecycle hooks demonstrated
- Event handlers for all entity types
- Custom API routes
- Dashboard widget examples
- Configuration schema examples

### Quick Start

```bash
# Clone this repository
git clone https://github.com/bluewave-labs/plugin-marketplace.git

# Copy the sample plugin template
cp -r templates/sample-plugin plugins/my-plugin

# Edit the manifest and code
code plugins/my-plugin

# Test locally by copying to your VerifyWise installation
cp -r plugins/my-plugin /path/to/verifywise/Servers/plugins/marketplace/
```

## Repository Structure

```
plugin-marketplace/
├── README.md              # This file
├── registry.json          # Plugin registry (auto-fetched by VerifyWise)
├── plugins/               # Published plugins
│   ├── plugin-name/       # Plugin source files
│   └── plugin-name.zip    # Downloadable package
└── templates/             # Development templates (not in registry)
    ├── README.md          # Plugin development guide
    └── sample-plugin/     # Comprehensive sample plugin
```

## Contributing a Plugin

1. Fork this repository
2. Create your plugin in `plugins/your-plugin-name/`
3. Add your plugin to `registry.json`
4. Create a zip file: `cd plugins && zip -r your-plugin-name.zip your-plugin-name/`
5. Submit a pull request

### Registry Entry Format

```json
{
  "id": "your-plugin-name",
  "name": "Your Plugin Name",
  "description": "Brief description of what your plugin does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "url": "https://your-website.com"
  },
  "type": "integration|feature|framework|reporting",
  "tags": ["tag1", "tag2"],
  "download": "https://raw.githubusercontent.com/bluewave-labs/plugin-marketplace/main/plugins/your-plugin-name.zip",
  "checksum": "sha256:...",
  "compatibility": {
    "minVersion": "1.6.0"
  },
  "permissions": ["events:listen", "database:read"]
}
```

## Plugin Types

| Type | Description |
|------|-------------|
| `integration` | Connect with external services (Slack, Jira, etc.) |
| `feature` | Add new functionality (audit trail, analytics) |
| `framework` | Compliance frameworks (GDPR, ISO 27001, SOC2) |
| `reporting` | Report generation and export |

## License

MIT
