// Exercise the deployed validators with adversarial inputs, without new model
// or search calls. All private logs and generated payloads remain outside Git.
const fs = require('fs'), assert = require('assert/strict');
const {execution, outputs} = require('./audit-acceptance.cjs');
const workflowDir = process.argv[4] || '/tmp/ias-linkedin';
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
function workflow(stage) {
  const parsed = JSON.parse(fs.readFileSync(workflowDir + '/' + stage + '.json'));
  return Array.isArray(parsed) ? parsed[0] : parsed;
}
function nodeCode(stage, name) { return workflow(stage).nodes.find(node => node.name === name).parameters.jsCode; }
async function code(stage, name, input, sources) {
  return new AsyncFunction('$json', '$input', '$', 'Buffer', nodeCode(stage, name))(
    input, {all: () => [{json: input}]}, key => ({first: () => ({json: sources[key]}), all: () => [{json: sources[key]}]}), Buffer);
}
const response = value => ({choices: [{message: {content: JSON.stringify(value)}}]});
async function main() {
  const research = execution('enrichment');
  const source = outputs(research, 'Merge and Reclassify Recovery Evidence')[0].json;
  const common = {rank: 1, topic: 'Identity governance operating practices',
    proposedHeadline: 'Review identity governance operating practices',
    whyNow: 'An ongoing operating decision', targetAudience: ['Technology leaders'],
    contentAngle: 'Assess ownership and validation', openingHook: 'Review operating practices',
    recommendedFormat: 'LinkedIn post', relatedMeetingThemes: [],
    scores: {audienceFit: 10, businessImpact: 10, timeliness: 5, novelty: 5,
      engagementPotential: 5, actionability: 5, sourceQuality: 4, total: 44},
    confidence: 0.7, editorialRisks: [], verificationStatus: 'verified'};
  const unsupported = {...common, topic: 'Unsupported invented candidate', evidenceBundleId: 'does-not-exist',
    sources: [{url: 'https://invalid.example/fiction', title: 'Invented source', supportingEvidence: 'This source record was never supplied'}]};
  const noBundles = {...source, qualifiedEvidenceBundles: []};
  const result1 = await code('enrichment', 'Build Content Brief Files', response({themeAligned: [unsupported], emerging: [], watchlist: []}), {'Merge and Reclassify Recovery Evidence': noBundles});
  const candidateResult = result => JSON.parse(Buffer.from(result.find(item => item.json.fileName.endsWith('.json')).binary.data.data, 'base64').toString());
  const rejected = candidateResult(result1);
  assert.equal(rejected.themeAligned.length + rejected.emerging.length, 0, 'Invented source must not produce a verified candidate');
  const records = ['a', 'b'].map(id => ({url: 'https://www.nist.gov/' + id,
    title: 'Identity governance operating practices require ownership and validation',
    description: 'Identity governance operating practices support an ongoing leadership decision about access review and accountable ownership.',
    publisher: 'NIST', publishedAt: '', sourceTier: 'primary'}));
  const singleFamily = {...source, articles: records, consolidatedThemes: [],
    qualifiedEvidenceBundles: [{bundleId: 'same-family-test', qualified: true, records}]};
  const sameFamily = {...common, evidenceBundleId: 'same-family-test', sources: records};
  const result2 = await code('enrichment', 'Build Content Brief Files', response({themeAligned: [sameFamily], emerging: [], watchlist: []}), {'Merge and Reclassify Recovery Evidence': singleFamily});
  const familyResult = candidateResult(result2);
  assert.equal(familyResult.themeAligned.length + familyResult.emerging.length, 0, 'Two URLs in one source family must not qualify');
  const planner = execution('editorial-planner');
  const policy = structuredClone(outputs(planner, 'Add Editorial Policy')[0].json);
  const fakeTopic = 'Watchlist-only acceptance sentinel';
  policy.watchlistCandidates.push({topic: fakeTopic});
  const proposed = JSON.parse(outputs(planner, 'Plan Dynamic Editorial Portfolio via gpt-oss')[0].json.choices[0].message.content);
  proposed.selectedTopics.push({...proposed.selectedTopics[0], sourceCandidateTopic: fakeTopic});
  const result3 = await code('editorial-planner', 'Validate Editorial Plan', response(proposed), {'Add Editorial Policy': policy});
  assert(!result3[0].json.selectedTopics.some(topic => topic.sourceCandidateTopic === fakeTopic));
  assert(result3[0].json.selectedTopicCount > 0);
  assert.equal(result3[0].json.policySummary.automaticPublishingAllowed, false);
  console.log(JSON.stringify({unsupportedCandidateRejected: true, sameSourceFamilyRejected: true, watchlistExcludedFromPlan: true}));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
