# Content-pipeline acceptance — 2026-10-07 UTC

This records the initial migration version. The later source-aware privacy repair
and mount-access validation are documented in [Readiness.md](Readiness.md); its
focused recheck did not repeat external research or the full editorial pipeline.

The three imported inactive IAS copies completed an end-to-end n8n CLI run
against synthetic transcripts and live local inference/Brave research. The check
ended at an editorial plan. No posts, images, messages or calendar writes were
created. No schedules were activated and no services were restarted.

## Input and isolation

Three recent synthetic API transcripts were staged privately: a mixed technical
and private-detail transcript with an instruction-injection canary, a personal-only
transcript, and a separate education-only technical roundtable. Private canaries
covered invented identifiers, engagement/contract details, money, a date,
compensation/performance, family/medical matters, and religion. A matching legacy
copy tested API-first duplicate suppression. These fixture payloads are outside Git.

The selector chose three API files, excluded one legacy duplicate, and selected
no legacy files. Both private-bearing transcripts produced zero extracted themes.
The educational transcript supplied the six useful themes. Extraction and the
separate final privacy review contained no canaries or disallowed tested topics.
Privacy was checked before any Brave research ran.

All generated themes, candidate briefs, candidate JSON, plan Markdown/JSON, and
execution logs remain outside Git. Files are under the isolated
`/data/output/ias-linkedin-acceptance` directory; private CLI logs are on Unraid
and in the container's private `/tmp/ias-linkedin` directory. Production input
wildcards cannot consume the isolated artifacts.

## Results

| Check | Result |
| --- | --- |
| Final public-safe themes | 6 |
| Brave queries across all four preserved branches | 54 |
| Qualified evidence bundles | 13 |
| Verified researched candidates | 2 |
| Watchlist candidates | 3 |
| Selected editorial topics | 2 |
| Exact supplied source URLs and contiguous evidence fragments | Passed |
| Independent source families, bundle validity and semantic coverage | Passed |
| Deterministic score sums and caps | Passed |
| Invented source / unqualified candidate rejection | Passed |
| Same-source-family corroboration rejection | Passed |
| Watchlist exclusion from editorial selection | Passed |
| Webinar review without supplied inventory | `manual_review_required` |
| Automatic publishing | `false` |

The candidate and editorial counts are intentionally below five; existing policy
allows fewer topics when evidence is weak. No quotas or evidence gates were relaxed.
The negative evidence checks invoked the migrated validators with adversarial
inputs using the successful private run's context. They required no additional
model or search requests.

## Preservation and verification

Read-only export comparison found zero changes to the nodes, connections,
settings, or activation state of all 25 original workflows. The three new IAS
copies are inactive and each schedule is disabled and disconnected. Source prompts,
policy/validator code and original binary/MCP settings were verified against the
private source export. Code changes are limited to inference-response parsing,
isolated paths and provider wording; request prompts are preserved verbatim.

The model replacement uses the existing LiteLLM `home-chat` route to local vLLM.
The six distinct model roles remain separate HTTP nodes. No context, model,
GPU, routing, fallback, or production deployment configuration was changed.
Dedicated IAS credentials were created; the Brave clone used an encrypted export,
and no decrypted n8n credential export was performed. Committed definitions omit
credential bindings and execution/pinned data.

The initial request translation encountered n8n expression-compiler errors from
adjacent closing braces in inline schemas. Pretty-printing the schema fixed the
installed compiler check. The first private-only/mixed-input run correctly stopped
because no themes were safe. Adding a separate educational input exercised the
positive path without weakening the privacy gate.

## Practical limits and decisions

This is a synthetic acceptance check, not proof of privacy equivalence on real
meetings. Independent review still uses the same model in a separate stage.
Representative real-input privacy evaluation, editorial quality review and any
independent-model selection remain decisions before production activation.

At this initial acceptance, normal n8n UI execution was blocked by the Unraid
bind-mount group mismatch; the separately approved fix has since been applied.
The acceptance CLI used UID 1000 with GID 100; this did not change the running
container, production permissions or schedules. The ineffective ACL experiment
was removed. The post-fix normal-user/task-runner probe passed; see [ops/n8n](../../ops/n8n/README.md).
Keep all IAS copies inactive.

OMC integration, additional-model evaluation, publishing, image generation, and
unrelated infrastructure work were not part of this milestone.
