"""Audit saved finish/budget/runtime records without inference or rescoring."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    details=json.loads((args.root/'frozen/deterministic-details.json').read_text())
    result={'modelCalls':0,'rescoring':False,'source':'Original saved API records and PR21 runtime logs/summaries',
            'interpretation':'length at exactly max_tokens is output-budget exhaustion, not a transport timeout; schema validity is separate',
            'arms':{}}
    for arm in ['home-chat','qwen3.8-27b','gemma4-31b']:
        paths=sorted((args.root/'frozen/responses'/arm).glob('assessment-*.json'))
        rows=[json.loads(p.read_text()) for p in paths]
        assert len(rows)==36 and all(r['status']=='response' for r in rows)
        length=[r for r in rows if r['reply']['choices'][0]['finish_reason']=='length']
        assert all(r['reply']['usage']['completion_tokens']==r['requestParameters']['max_tokens']==3072 for r in length)
        stopped=[r for r in rows if r['reply']['choices'][0]['finish_reason']=='stop']
        schema=[r['id'] for r in stopped if not details[arm+'/assessment/'+r['id']]['complete']]
        result['arms'][arm]={
            'savedAssessments':36,'apiResponseReceived':36,'transportTimeouts':0,'requestRuntimeErrors':0,
            'outputBudgetExhausted':len(length),'budgetTokens':3072,'budgetCaseIds':[r['id'] for r in length],
            'completedSemanticDecisions':len(stopped),'completedButSchemaInvalid':len(schema),'schemaFailureCaseIds':schema,
            'budgetLatencySeconds':{'minimum':min(r['latencySeconds'] for r in length),'maximum':max(r['latencySeconds'] for r in length)} if length else None,
            'savedResponseSha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}}
    result['completedSchemaDefects']={'home-chat':'S12 and S14: claims[0].form is outside the exact_quote/paraphrase enum; distinct from the 27 incomplete assessments',
        'qwen3.8-27b':'No full-schema failure among the 18 completed assessment decisions',
        'gemma4-31b':'Ten completed assessments fail schema, commonly null scope_notes; these are not incomplete responses'}
    runtime=json.loads((Path(__file__).parent.parent/'model-selection/runtime-results.json').read_text())
    result['nativeRunStatusCounts']=dict(Counter(x['status'] for x in runtime['nativeRuns']))
    result['intentionalQwenCheckpointStops']=[{'startedAt':x['startedAt'],'reason':'Child exit -15 during planned checkpoint/phase handoff; completed responses retained'} for x in runtime['nativeRuns'] if x['checkpointStopExit15']]
    result['nativeContextTruncation']=sum(x['nativeContextTruncatedRecords'] for x in runtime['nativeRuns'])
    result['limits']=['Output budget also covers thinking; this comparison enabled thinking for assessment, unlike home-chat production default.',
        'The frozen source-count instruction was ambiguous about two total origins versus primary plus two; saved S41 reasoning debates it. Not proven to explain all 45 incomplete assessments.',
        'Partial CPU/GPU offload explains Qwen latency, not a timeout classification.',
        'Larger budgets or altered thinking/prompts were not tested; no counterfactual model-quality claim.']
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({arm:{k:v for k,v in values.items() if k in ['outputBudgetExhausted','completedButSchemaInvalid','transportTimeouts','requestRuntimeErrors']} for arm,values in result['arms'].items()}))


if __name__=='__main__':main()
