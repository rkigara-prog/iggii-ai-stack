// Trusted local handoff marker. No transcript or theme text is printed.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {policyVersion, surfaceSafe} = require('./privacy-policy.cjs');
const root = process.env.IAS_PRIVACY_ROOT || '/data/output/ias-linkedin-acceptance';
const statusFile = path.join(root, 'privacy-status.json');
const write = value => {
  const tmp = statusFile + '.' + crypto.randomUUID();
  fs.writeFileSync(tmp, JSON.stringify(value), {mode: 0o600, flag: 'wx'});
  fs.renameSync(tmp, statusFile);
};
const digest = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
function validate(expectedRunId) {
  const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
  if (status.state !== 'approved' || status.policyVersion !== policyVersion
      || !/^[a-f0-9-]{36}$/.test(status.runId) || (expectedRunId && status.runId !== expectedRunId)
      || !Number.isFinite(Date.parse(status.approvedAt)) || Date.now() - Date.parse(status.approvedAt) > 24*3600*1000
      || Date.parse(status.approvedAt) > Date.now()) throw Error('Privacy artifact not currently approved');
  if (!/^theme-list-model-eval-qwen35-\d{4}-\d{2}-\d{2}\.txt$/.test(status.fileName)) throw Error('Privacy artifact path invalid');
  const bytes = fs.readFileSync(path.join(root, status.fileName));
  const lines = bytes.toString('utf8').trim().split('\n');
  if (digest(bytes) !== status.sha256 || lines.length !== status.themeCount || !lines.length || lines.length > 20
      || lines.some(line => !line.startsWith('- ') || !surfaceSafe(line.slice(2)))) throw Error('Privacy artifact content invalid');
  return {runId: status.runId, fileName: status.fileName, sha256: status.sha256, themeCount: status.themeCount, policyVersion};
}
function main() {
  const [action, runId, fileName] = process.argv.slice(2);
  if (action === 'begin') {
    const runId = crypto.randomUUID();
    write({state: 'pending', runId, policyVersion, startedAt: new Date().toISOString()});
    console.log(JSON.stringify({runId}));
  } else if (action === 'approve') {
    const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    if (status.state !== 'pending' || status.runId !== runId || !/^theme-list-model-eval-qwen35-\d{4}-\d{2}-\d{2}\.txt$/.test(fileName)) throw Error('Privacy attempt mismatch');
    const artifactPath = path.join(root, fileName);
    fs.chmodSync(artifactPath, 0o600);
    const bytes = fs.readFileSync(artifactPath);
    const themes = bytes.toString('utf8').trim().split('\n');
    if (!themes.length || themes.length > 20 || themes.some(line => !line.startsWith('- ') || !surfaceSafe(line.slice(2)))) throw Error('Privacy output invalid');
    write({...status, state: 'approved', fileName, themeCount: themes.length, sha256: digest(bytes), approvedAt: new Date().toISOString()});
    console.log(JSON.stringify(validate(runId)));
  } else if (action === 'verify') console.log(JSON.stringify(validate(runId)));
  else throw Error('Unknown privacy artifact action');
}
if (require.main === module) { try { main(); } catch { console.error('Privacy handoff blocked'); process.exitCode = 1; } }
module.exports = {validate};
