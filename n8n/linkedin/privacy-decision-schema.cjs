// Preserve the existing response shape and validator. Never repair model decisions.
const risks=['identifier','private_engagement_fact','personal_personnel','finance_date','incident_operations','unsupported_topic','overspecific_combination'];
function constrainPrivacySchema(schema){
 const next=JSON.parse(JSON.stringify(schema)),base=next.properties.decisions.items;
 if(base.anyOf)return next;
 // The installed grammar backend rejects uniqueItems. Evidence uniqueness
 // remains enforced by the unchanged post-generation privacy validator.
 const branch=(verdict,forced={})=>{const row=JSON.parse(JSON.stringify(base));row.properties.verdict={type:'string',enum:[verdict]};for(const [k,v] of Object.entries(forced))row.properties[k]=v;return row;};
 const flags=(requiredTrue,allFalse=false)=>({type:'object',properties:Object.fromEntries(risks.map(k=>[k,{type:'boolean',...(allFalse?{enum:[false]}:k===requiredTrue?{enum:[true]}:{})}])),required:risks,additionalProperties:false});
 // Disjoint verdicts; reject branches may overlap, so anyOf (not oneOf).
 next.properties.decisions.items={anyOf:[branch('retain',{educational:{type:'boolean',enum:[true]},riskFlags:flags(null,true)}),...risks.map(k=>branch('reject',{riskFlags:flags(k)})),branch('ambiguous')]};
 return next;
}
module.exports={constrainPrivacySchema,risks};

