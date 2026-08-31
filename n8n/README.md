# n8n workflows for iggii-ai-stack

This is a placeholder. Routing/automation workflows built for the new
LiteLLM-backed stack get exported here as JSON for backup/version control,
imported into the *same* n8n instance that already runs OMC's production
workflows.

Rules to avoid colliding with OMC:
- Prefix new workflow names distinctly (e.g. `IAS_...`) so they're never
  confused with OMC's `OMC_...` / weekly/daily workflows in the n8n UI.
- Use separate n8n credentials for any new provider connections — do not
  reuse or edit OMC's existing credential entries.
- Nothing here should read from or write to OMC's Postgres schema.

No workflows have been exported yet.
