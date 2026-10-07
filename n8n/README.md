# n8n workflows for iggii-ai-stack

Sanitized inactive local content-pipeline copies and deployment/acceptance notes
are in [linkedin/](linkedin/README.md). The workflows live in the existing Unraid
n8n instance. GitHub's root deployment does not import n8n workflows.

- Prefix new copies `IAS_` and preserve production workflows and schedules.
- Use dedicated IAS provider credentials; never edit OMC credentials.
- Keep raw transcripts, credentials, execution payloads and generated content
  outside Git. Committed exports contain definitions only.
- Do not read or write OMC's Postgres schema, calendars, or messages.
- Do not activate schedules or publish content without explicit approval.
