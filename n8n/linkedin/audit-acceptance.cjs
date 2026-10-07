// Read private CLI execution logs and isolated artifacts; emit counts only.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || '/data/output/ias-linkedin-acceptance';
const logDir = process.argv[3] || '/tmp/ias-linkedin';
function execution(stage) {
  const text = fs.readFileSync(path.join(logDir, stage + '-execution.log'), 'utf8');
  for (let start = text.indexOf('{'); start >= 0; start = text.indexOf('{', start + 1)) {
    let depth = 0, quoted = false, escaped = false;
    for (let end = start; end < text.length; end++) {
      const char = text[end];
      if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false; }
      else if (char === '"') quoted = true;
      else if (char === '{') depth++;
      else if (char === '}' && --depth === 0) {
        try { const parsed = JSON.parse(text.slice(start, end + 1)); if (parsed.data?.resultData || parsed.resultData) return parsed.data?.resultData || parsed.resultData; } catch {}
        break;
      }
    }
  }
  throw Error('No execution result in private ' + stage + ' log');
}
function outputs(result, name) {
  return (result.runData[name] || []).flatMap(run => run.data?.main?.flat() || []);
}
const forbidden = /CedarQuartzCanary|OrionVelvetCanary|MinaCobaltCanary|91837|2026-11-19|salary|religio|illness|family|contract negotiation|employee performance/i;
const normalize = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&#x27;|&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&nbsp;/gi, ' ').toLowerCase().replace(/\s+/g, ' ').trim();
function audit() {
const san = execution('sanitization');
assert(!san.error, 'Sanitization execution failed');
const extracts = outputs(san, 'Sanitize via qwen3.5 (Per Meeting)').map(item => JSON.parse(item.json.choices[0].message.content));
assert.equal(extracts.length, 3, 'Expected three API transcripts');
assert(extracts[2].themes.length > 0, 'Educational transcript must produce useful themes');
assert.equal(extracts[1].themes.length, 0, 'Personal-only transcript must produce no themes');
assert(!forbidden.test(JSON.stringify(extracts)), 'Extraction privacy canary leak');
const safe = outputs(san, 'Build Final Public-Safe Theme List')[0].json;
assert(safe.themeCount > 0 && safe.themeCount <= 20);
assert(!forbidden.test(safe.combinedThemes), 'Final privacy canary leak');
assert(safe.combinedThemes.trim().split('\n').every(line => line.startsWith('- ')));
if (process.argv.includes('--privacy-only')) {
  console.log(JSON.stringify({privacyPassed: true, extractedMeetings: 3, personalOnlyThemes: 0, finalThemeCount: safe.themeCount}));
  process.exit(0);
}
const research = execution('enrichment');
assert(!research.error, 'Research execution failed');
let queryCount = 0;
for (const name of ['Search Theme-Matched News', 'Search Emerging and Authoritative News', 'Search Evidence Recovery and Industry News', 'Search Authoritative Foundations']) {
  // Query-producing inputs, not the response payloads, are checked below.
  assert(research.runData[name]?.length, 'Missing Brave search branch: ' + name);
}
for (const name of ['Parse Consolidated Themes', 'Create Discovery Queries', 'Create Evidence Recovery Queries', 'Create Authoritative Foundation Queries']) {
  for (const item of outputs(research, name)) {
    const query = item.json.searchQuery || item.json.query || '';
    assert(query && !forbidden.test(query), 'Private data in an external search query');
    queryCount++;
  }
}
const enriched = outputs(research, 'Merge and Reclassify Recovery Evidence')[0].json;
const bundles = new Map(enriched.qualifiedEvidenceBundles.map(bundle => [bundle.bundleId, bundle]));
const files = fs.readdirSync(root);
const candidatesFile = files.filter(name => /^content-candidates-model-eval-.*\.json$/.test(name)).sort().at(-1);
const candidates = JSON.parse(fs.readFileSync(path.join(root, candidatesFile)));
const verified = [...candidates.themeAligned, ...candidates.emerging];
assert(verified.length > 0, 'No verified researched candidate');
for (const candidate of verified) {
  assert.equal(candidate.verificationStatus, 'verified');
  for (const key of ['strongEvidence', 'bundleValid', 'semanticEvidenceAligned']) assert.equal(candidate.validation[key], true);
  assert.notEqual(candidate.validation.unresolvedBlockingRisk, true);
  assert(candidate.validation.independentSourceFamilyCount >= 2);
  const bundle = bundles.get(candidate.evidenceBundleId);
  assert(bundle?.qualified, 'Unknown or unqualified evidence bundle');
  assert(candidate.sources.length >= 2);
  for (const source of candidate.sources) {
    const record = bundle.records.find(record => record.url === source.url);
    assert(record, 'Source URL must exactly match a supplied bundle record');
    const evidence = normalize(source.supportingEvidence);
    assert(evidence.split(' ').length >= 5 && evidence.split(' ').length <= 18);
    assert(normalize(record.title + ' ' + record.description).includes(evidence), 'Evidence must be an exact contiguous source fragment');
  }
  const scores = candidate.scores;
  assert.equal(scores.total, Object.entries(scores).filter(([key]) => key !== 'total').reduce((sum, [, value]) => sum + value, 0));
  assert(scores.total <= 94);
}
const planner = execution('editorial-planner');
assert(!planner.error, 'Planner execution failed');
const plan = outputs(planner, 'Validate Editorial Plan')[0].json;
assert(plan.selectedTopicCount > 0 && plan.selectedTopicCount <= 5);
assert.equal(plan.policySummary.automaticPublishingAllowed, false);
const byTopic = new Map(verified.map(candidate => [candidate.topic, candidate]));
const watchlist = new Set(candidates.watchlist.map(candidate => candidate.topic));
for (const selected of plan.selectedTopics) {
  assert(!watchlist.has(selected.sourceCandidateTopic), 'Watchlist selected for editorial planning');
  const candidate = byTopic.get(selected.sourceCandidateTopic);
  assert(candidate, 'Editorial plan selected an unverified topic');
  assert.deepEqual(new Set(selected.sourceUrls), new Set(candidate.sources.map(source => source.url)));
  assert.equal(selected.webinarReview, 'manual_review_required');
}
const summary = {privacyPassed: true, extractedMeetings: extracts.length, personalOnlyThemes: 0,
  finalThemeCount: safe.themeCount, braveQueryCount: queryCount, qualifiedEvidenceBundles: bundles.size,
  verifiedCandidates: verified.length, watchlistCandidates: candidates.watchlist.length,
  selectedEditorialTopics: plan.selectedTopicCount, exactSourceUrlsAndEvidencePassed: true,
  deterministicScoringPassed: true, manualWebinarReviewRequired: true, automaticPublishingAllowed: false};
console.log(JSON.stringify(summary, null, 2));

}
module.exports = {execution, outputs};
if (require.main === module) audit();
