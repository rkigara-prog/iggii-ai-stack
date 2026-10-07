"""Conservative full-prose coverage for existing evaluation drafts; no inference."""
import re

def review_prose(draft,approved_claims):
    clean=lambda x:' '.join(x.split())
    allowed={clean(c['text']) for c in approved_claims}
    sentences=[clean(s) for s in re.split(r'(?<=[.!?])\s+|\n+',draft) if clean(s)]
    rows=[{'id':f'assertion-{i+1}','text':s,'status':'exact_approved_claim' if s in allowed else 'human_review_required'} for i,s in enumerate(sentences)]
    return {'method':'deterministic_full_prose_coverage','independent_semantic_verification':False,'review_required':any(r['status']=='human_review_required' for r in rows),'assertions':rows,'automaticPublishingAllowed':False,'note':'Unmapped prose requires human claim/attribution/recommendation review; it is not automatically false. Writer claim lists are not the coverage source.'}
