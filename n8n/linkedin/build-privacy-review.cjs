// Build a private audit packet from real evaluation output, not a Git artifact.
const fs = require('fs'), path = require('path');
const root = process.argv[2] || '/data/output/ias-linkedin-real-privacy';
const {execution, outputs} = require('./audit-acceptance.cjs');
const result = execution('real-privacy');
if (result.error) throw Error('Real privacy workflow did not complete');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'sample-manifest.private.json')));
const extracts = outputs(result, 'Sanitize via qwen3.5 (Per Meeting)').map(item => JSON.parse(item.json.choices[0].message.content).themes);
const reviewed = JSON.parse(outputs(result, 'Privacy Adjudication and Deduplication via gpt-oss')[0].json.choices[0].message.content).themes;
const final = outputs(result, 'Build Final Public-Safe Theme List')[0].json.combinedThemes.trim().split('\n').map(line => line.replace(/^-\s*/, ''));
const blocked = /\b(salary|compensation|employee performance|disciplinary|religious|family crisis|terminal illness|medical diagnosis|sales pipeline|client engagement|contract negotiation)\b|\$\s*\d|\b\d{4}-\d{2}-\d{2}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\//i;
const samples = manifest.map((record, index) => {
  const transcript = fs.readFileSync(record.stagedFile, 'utf8');
  const explicitIdentifiers = [...new Set([
    ...(transcript.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || []),
    ...(transcript.match(/https?:\/\/\S+/gi) || []),
    ...(transcript.match(/\$\s*\d[\d,.]*/g) || []),
  ])];
  const exactIdentifierMatches = extracts[index].filter(theme => explicitIdentifiers.some(value => theme.toLowerCase().includes(value.toLowerCase())));
  return {label: record.label, stratum: record.stratum, transcript,
    extractedThemes: extracts[index], deterministic: {
      exactIdentifierMatches, blockedPatternThemes: extracts[index].filter(theme => blocked.test(theme))}};
});
const packet = {samples, privacyReviewedThemes: reviewed, finalThemes: final,
  finalBlockedPatternThemes: final.filter(theme => blocked.test(theme))};
fs.writeFileSync(path.join(root, 'privacy-review-input.private.json'), JSON.stringify(packet), {mode: 0o600});
const summary = {sampledMeetings: samples.length, extractedThemes: extracts.reduce((count, themes) => count + themes.length, 0),
  finalThemes: final.length, extractionDeterministicFlagCount: samples.reduce((count, sample) => count + sample.deterministic.exactIdentifierMatches.length + sample.deterministic.blockedPatternThemes.length, 0),
  finalDeterministicFlagCount: packet.finalBlockedPatternThemes.length};
fs.writeFileSync(path.join(root, 'privacy-deterministic-summary.json'), JSON.stringify(summary, null, 2), {mode: 0o600});
console.log(JSON.stringify(summary));
