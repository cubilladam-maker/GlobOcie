
(function(){
const G=window.KNOWLEDGE_GRAPH;
const T=window.REASONING_TAXONOMY;
const SPINE=(G&&G.spine)||[];
const NODES={};
for(const n of (G&&G.nodes)||[])NODES[n.id]=n;
const RT={};
for(const n of (T&&T.nodes)||[])RT[n.id]=n;

function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function ensure(s){
 s.mastery??={};s.nodeMastery??={};s.conceptMastery??={};s.reasoningProfile??={};
 s.recentFamilies??=[];s.recentNodes??=[];s.recentModes??=[];
 s.familyAttempts??={};s.familyErrors??={};s.used??=[];s.history??=[];
 s.spineCoverage??=[];s.remedialFamily??=null;s.coreLastWasRemedial??=false;
}
function famMastery(s,f){ensure(s);return s.mastery[f]??50}
function nodeMastery(s,id){ensure(s);return s.nodeMastery[id]??50}
function targetLevel(s){return .65*s.userLevel+.35*s.systemLevel}
function nextSpineFamily(s){
 ensure(s);
 for(const x of SPINE)if(!s.spineCoverage.includes(x.family))return x.family;
 return null;
}
function coreRemaining(s){ensure(s);return SPINE.filter(x=>!s.spineCoverage.includes(x.family)).length}
function remainingSlots(s){return Math.max(0,(s.sessionTarget||36)-(s.history?.length||0))}

function topReasoningWeakness(s){
 ensure(s);
 let best=null,rate=0;
 for(const [id,p] of Object.entries(s.reasoningProfile)){
  if((p.opportunities||0)<2)continue;
  const r=(p.errors||0)/(p.opportunities||1);
  if(r>rate){rate=r;best=id}
 }
 return best;
}
function shouldForceCore(s){
 const remCore=coreRemaining(s), slots=remainingSlots(s);
 if(remCore<=0)return false;
 // Always protect the core if there are not enough spare slots left.
 if(slots<=remCore+1)return true;
 // Default: core stage first, then at most one remedial detour.
 return !s.coreLastWasRemedial;
}
function chooseFamily(s,manifest){
 ensure(s);
 const mandatory=nextSpineFamily(s);

 // Force core when needed.
 if(mandatory&&manifest.families[mandatory]&&shouldForceCore(s)){
  s.coreLastWasRemedial=false;
  return [mandatory,manifest.families[mandatory],"spine"];
 }

 // One short remedial insertion may happen between core stages.
 if(mandatory && s.remedialFamily && manifest.families[s.remedialFamily] && !s.coreLastWasRemedial){
  const f=s.remedialFamily;s.remedialFamily=null;s.coreLastWasRemedial=true;
  return [f,manifest.families[f],"remedial"];
 }

 // If core unfinished but detour already used, return to core.
 if(mandatory&&manifest.families[mandatory]){
  s.coreLastWasRemedial=false;
  return [mandatory,manifest.families[mandatory],"spine"];
 }

 // After core: graph-aware adaptive selection.
 const weakReason=topReasoningWeakness(s);
 const repair=(weakReason&&RT[weakReason]&&RT[weakReason].repair_families)||[];
 const target=targetLevel(s);
 let best=[],bestScore=-1e9;

 for(const [name,f] of Object.entries(manifest.families)){
  let score=0;
  const fMaster=famMastery(s,name);
  const primaryNode="F:"+name;
  const nMaster=nodeMastery(s,primaryNode);

  score+=(60-fMaster)*.55;
  score+=(60-nMaster)*.55;
  if(!s.familyAttempts[name])score+=7;
  if(repair.includes(name))score+=24;
  if(s.nextFamily===name)score+=35;

  const pos=s.recentFamilies.indexOf(name);
  if(pos>=0)score-=(s.recentFamilies.length-pos)*11;

  if(f.chunks.some(c=>Math.abs(c.mid-target)<=20))score+=10;
  score+=Math.random()*4;

  if(score>bestScore+.01){best=[[name,f,"adaptive"]];bestScore=score}
  else if(Math.abs(score-bestScore)<=.01)best.push([name,f,"adaptive"]);
 }
 return best[Math.floor(Math.random()*best.length)];
}
function chooseChunk(s,familyEntry){
 const target=targetLevel(s);
 const chunks=[...familyEntry.chunks].sort((a,b)=>Math.abs(a.mid-target)-Math.abs(b.mid-target));
 return chunks[Math.floor(Math.random()*Math.min(2,chunks.length))];
}
function recordScore(s,r){
 let sc=-Math.abs(r.difficulty-targetLevel(s))*1.35;
 if(r.question_mode&&!s.recentModes.includes(r.question_mode))sc+=11;
 if((s.lastKnowledge??50)<45&&r.difficulty<=targetLevel(s))sc+=9;
 if(r.primary_node&&!s.recentNodes.includes(r.primary_node))sc+=7;
 sc+=Math.random()*4;
 return sc;
}
function chooseRecord(s,records){
 const unused=records.filter(r=>!s.used.includes(r.id));
 const pool=unused.length?unused:records;
 pool.sort((a,b)=>recordScore(s,b)-recordScore(s,a));
 const top=pool.slice(0,Math.min(10,pool.length));
 return top[Math.floor(Math.random()*Math.min(4,top.length))]||null;
}
function assess(rec,id,comment){
 const o=id==="NONE"?rec.none_option:rec.options.find(x=>x.id===id);
 let knowledge=o.score,reasoning=o.score;
 if(id==="NONE"){
  const n=(comment||"").trim().length;
  if(n>35)reasoning=Math.min(100,reasoning+8);
  if(n>90)reasoning=Math.min(100,reasoning+5);
 }
 const allReason=[...new Set((rec.options||[]).flatMap(x=>x.reasoning_tags||[]))];
 const chosenReason=(o.reasoning_tags||[]);
 return {
  knowledge,reasoning,feedback:o.feedback,
  concepts:(rec.analysis&&rec.analysis.concepts)||[],
  knowledgeNodes:rec.knowledge_nodes||[],
  chosenReasoningTags:chosenReason,
  opportunityReasoningTags:allReason,
  family:rec.family,mode:rec.question_mode||"unknown"
 };
}
function updateReasoningProfile(s,res){
 ensure(s);
 for(const id of res.opportunityReasoningTags){
  const p=s.reasoningProfile[id]??={errors:0,opportunities:0};
  p.opportunities++;
 }
 if(res.knowledge<75){
  for(const id of res.chosenReasoningTags){
   const p=s.reasoningProfile[id]??={errors:0,opportunities:0};
   p.errors++;
  }
 }
}
function updateNodeMastery(s,res){
 ensure(s);
 const obs=.55*res.knowledge+.45*res.reasoning;
 for(const id of res.knowledgeNodes){
  s.nodeMastery[id]=Math.round(.76*(s.nodeMastery[id]??50)+.24*obs);
 }
}
function update(s,rec,res){
 ensure(s);
 const obs=.55*res.knowledge+.45*res.reasoning;
 s.mastery[rec.family]=Math.round(.72*(s.mastery[rec.family]??50)+.28*obs);
 for(const c of res.concepts){
  s.conceptMastery[c]=Math.round(.80*(s.conceptMastery[c]??50)+.20*obs);
 }
 updateNodeMastery(s,res);
 updateReasoningProfile(s,res);

 s.familyAttempts[rec.family]=(s.familyAttempts[rec.family]||0)+1;
 if(res.knowledge<50)s.familyErrors[rec.family]=(s.familyErrors[rec.family]||0)+1;

 if(SPINE.some(x=>x.family===rec.family)&&!s.spineCoverage.includes(rec.family)){
  s.spineCoverage.push(rec.family);
 }

 s.recentFamilies.push(rec.family);if(s.recentFamilies.length>6)s.recentFamilies.shift();
 for(const id of res.knowledgeNodes){s.recentNodes.push(id);if(s.recentNodes.length>10)s.recentNodes.shift()}
 if(rec.question_mode){s.recentModes.push(rec.question_mode);if(s.recentModes.length>5)s.recentModes.shift()}

 s.lastKnowledge=res.knowledge;s.lastFamily=rec.family;

 if(res.knowledge<45){
  s.systemLevel=clamp(s.systemLevel-10,0,100);
  const weak=rec.routing&&rec.routing.weak;
  if(weak&&weak!==rec.family)s.remedialFamily=weak;
  s.nextFamily=null;
 }else if(res.knowledge>=80&&res.reasoning>=70){
  s.systemLevel=clamp(s.systemLevel+10,0,100);
  s.nextFamily=rec.routing&&rec.routing.good;
 }else s.nextFamily=null;
}
function why(s,rec,chunk,reason){
 const p=[];
 if(reason==="spine")p.push("obowiązkowy rdzeń dowodu");
 if(reason==="remedial")p.push("krótkie pytanie naprawcze");
 if(reason==="adaptive")p.push("dobór z grafu wiedzy");
 if(nodeMastery(s,rec.primary_node)<45)p.push("słabszy węzeł wiedzy");
 if(Math.abs(rec.difficulty-targetLevel(s))<=10)p.push("dopasowanie poziomu");
 const rw=topReasoningWeakness(s),repair=rw&&RT[rw]&&RT[rw].repair_families;
 if(repair&&repair.includes(rec.family))p.push("test wcześniejszego wzorca błędu");
 if(!s.recentFamilies.includes(rec.family))p.push("zmiana tematu");
 p.push("paczka "+chunk.id);
 return p.join(" • ");
}
function weakestFamilies(s,n=5){
 ensure(s);
 return Object.entries(s.mastery).sort((a,b)=>a[1]-b[1]).slice(0,n);
}
function weakestNodes(s,n=5){
 ensure(s);
 return Object.entries(s.nodeMastery)
  .filter(([id])=>NODES[id]&&NODES[id].type==="evidence")
  .sort((a,b)=>a[1]-b[1]).slice(0,n);
}
function reasoningWeaknesses(s,n=3){
 ensure(s);
 return Object.entries(s.reasoningProfile)
  .filter(([id,p])=>(p.opportunities||0)>=2)
  .map(([id,p])=>[id,(p.errors||0)/(p.opportunities||1),p])
  .sort((a,b)=>b[1]-a[1]).slice(0,n);
}
function coreCoverage(s){
 ensure(s);
 return {done:s.spineCoverage.length,total:SPINE.length,
  percent:Math.round(100*s.spineCoverage.length/Math.max(1,SPINE.length))};
}
function profileConfidence(s){
 ensure(s);
 const answered=s.history.length;
 const families=new Set(s.history.map(x=>x.family)).size;
 const reasoningOps=Object.values(s.reasoningProfile).reduce((a,p)=>a+(p.opportunities||0),0);
 if(answered>=22&&families>=10&&reasoningOps>=20)return "wysoka";
 if(answered>=10&&families>=6)return "średnia";
 return "niska";
}
function reasoningLabel(id){return RT[id]?.title||id}
function nodeLabel(id){return NODES[id]?.title||id}
function spineStatus(s,currentFamily){
 return SPINE.map((x,i)=>({
  index:i+1,family:x.family,label:x.label,
  status:s.spineCoverage.includes(x.family)?"done":(x.family===currentFamily?"current":"pending")
 }));
}
window.Core2Engine={
 chooseFamily,chooseChunk,chooseRecord,assess,update,why,
 weakestFamilies,weakestNodes,reasoningWeaknesses,coreCoverage,profileConfidence,
 famMastery,nodeMastery,targetLevel,reasoningLabel,nodeLabel,nextSpineFamily,spineStatus
};
})();
