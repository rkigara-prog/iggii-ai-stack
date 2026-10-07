// Shared by the embedded n8n validators and private evaluation tooling.
const policyVersion = 'source-aware-v1';
function parseReply(reply) {
  const choice = reply?.choices?.[0];
  if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') throw Error('Privacy response incomplete');
  let parsed;
  try { parsed = JSON.parse(choice.message.content); } catch { throw Error('Privacy response malformed'); }
  return parsed;
}
function sourceSegments(text) {
  return String(text).split(/\n\s*\n/).map(value => value.trim()).filter(Boolean)
    .map((text, index) => ({id: index, text}));
}
function surfaceSafe(theme, maxLength = 220) {
  return typeof theme === 'string' && theme === theme.trim() && theme.length >= 8 && theme.length <= maxLength
    && !/[\r\n;|"<>@]|https?:\/\/|\b\d+\b|[$€£]/i.test(theme)
    && !/\b(personnel|staffing|recruitment|hiring|talent acquisition|salary|compensation|performance assessment|disciplin\w*|family|medical|religio\w*|politic\w*|emotional|professional networking|executive leadership networking|sales|pricing|budget|contract\w*|procurement|client engagement|audit readiness|audit deadline|incident response|access problem|go-live)\b/i.test(theme)
    && !/\b(?:SOC|ISO|NIST|TPRM|BYOD|MSSP|EDR|MCP)\b/.test(theme);
}
function extraction(reply) {
  const value = parseReply(reply);
  if (!value || Object.keys(value).join() !== 'themes' || !Array.isArray(value.themes) || value.themes.length > 6
      || value.themes.some(t => typeof t !== 'string' || !t.trim() || t.length > 220)
      || new Set(value.themes).size !== value.themes.length) throw Error('Extraction schema invalid');
  return value.themes;
}
const categories = new Set(['identifier','private_engagement_fact','personal_personnel','finance_date','incident_operations','unsupported_topic','overspecific_combination']);
function validateReview(reply, input) {
  const review = parseReply(reply);
  if (!review || Object.keys(review).join() !== 'decisions' || !Array.isArray(review.decisions)
      || review.decisions.length !== input.candidates.length) throw Error('Privacy review coverage invalid');
  const seen = new Set(), retained = [], rejected = [];
  for (const row of review.decisions) {
    if (!row || Object.keys(row).sort().join() !== 'candidateIndex,educational,evidenceSegmentIds,riskFlags,verdict'
        || !Number.isInteger(row.candidateIndex) || row.candidateIndex < 0 || row.candidateIndex >= input.candidates.length
        || seen.has(row.candidateIndex) || !['retain','reject','ambiguous'].includes(row.verdict)
        || typeof row.educational !== 'boolean' || !row.riskFlags || Array.isArray(row.riskFlags)
        || Object.keys(row.riskFlags).sort().join() !== [...categories].sort().join()
        || Object.values(row.riskFlags).some(v => typeof v !== 'boolean')
        || !Array.isArray(row.evidenceSegmentIds) || !row.evidenceSegmentIds.length
        || new Set(row.evidenceSegmentIds).size !== row.evidenceSegmentIds.length
        || row.evidenceSegmentIds.some(id => !Number.isInteger(id) || !input.sourceSegments.some(s => s.id === id)))
      throw Error('Privacy decision/evidence invalid');
    seen.add(row.candidateIndex);
    const theme = input.candidates[row.candidateIndex];
    if (row.verdict === 'ambiguous') throw Error('Privacy review unresolved');
    if (row.verdict === 'retain') {
      if (!row.educational || Object.values(row.riskFlags).some(Boolean) || !(input.surfaceTexts?.[row.candidateIndex] || [theme]).every(t => surfaceSafe(t, 1000))) throw Error('Retained theme violates privacy policy');
      retained.push(theme);
    } else {
      if (!Object.values(row.riskFlags).some(Boolean)) throw Error('Rejected theme has no policy reason');
      rejected.push(row.candidateIndex);
    }
  }
  return {retained, rejected, reviewed: seen.size};
}
module.exports = {policyVersion, parseReply, sourceSegments, surfaceSafe, extraction, validateReview};
