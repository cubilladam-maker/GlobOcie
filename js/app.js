
const $=id=>document.getElementById(id),E=window.Core2Engine;
const screens=["start","quiz","s1","s2","s3"];
const MODE=window.DATA_MODE||"online";
const PROFILE_KEY="quiz-dowodowy-core2-profile-v1";
let loader=new ChunkLoader(MODE),manifest=null,cur=null,curChunk=null,sel=null,unlockTimer=null,selectionReason="";

let S={
 userLevel:40,systemLevel:40,startLevel:40,sessionTarget:25,
 stanceStart:75,stanceEnd:75,nextFamily:null,remedialFamily:null,
 used:[],history:[],influential:[],spineCoverage:[],
 mastery:{},nodeMastery:{},conceptMastery:{},reasoningProfile:{},
 recentFamilies:[],recentNodes:[],recentModes:[],familyAttempts:{},familyErrors:{},
 remember:true,lastKnowledge:50
};

function show(id){screens.forEach(x=>$(x).classList.add("hidden"));$(id).classList.remove("hidden")}
function home(){if(confirm("Wrócić do początku? Bieżąca sesja zostanie zakończona."))location.reload()}
document.querySelectorAll("[data-home]").forEach(b=>b.onclick=home);

function sessionQuestionsForLevel(level){return Math.round(18+18*(level/100))}
function sessionMinutesForQuestions(q){return Math.max(6,Math.round(q*.45))}
function levelLabel(level){
 if(level<=20)return "Uczeń — podstawy";
 if(level<=40)return "Uczeń+ — krok dalej";
 if(level<=60)return "Student — średnio";
 if(level<=80)return "Student+ — głębiej";
 return "Profesor — maksymalnie";
}
function updateStartUi(){
 const level=+$("level").value,q=sessionQuestionsForLevel(level);
 $("lv").textContent=level+"%";$("time").textContent=`ok. ${sessionMinutesForQuestions(q)} min • ${q} pytań`;
 $("startLevelDesc").textContent=levelLabel(level);
}
$("level").oninput=updateStartUi;

function loadProfile(){
 try{
  const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||"null");if(!p)return false;
  for(const k of ["mastery","nodeMastery","conceptMastery","reasoningProfile","familyAttempts","familyErrors"])if(p[k])S[k]=p[k];
  return true;
 }catch(e){return false}
}
function saveProfile(){
 if(!S.remember)return;
 try{localStorage.setItem(PROFILE_KEY,JSON.stringify({
  mastery:S.mastery,nodeMastery:S.nodeMastery,conceptMastery:S.conceptMastery,reasoningProfile:S.reasoningProfile,
  familyAttempts:S.familyAttempts,familyErrors:S.familyErrors,savedAt:new Date().toISOString()
 }))}catch(e){}
}
$("clearProfile").onclick=()=>{
 localStorage.removeItem(PROFILE_KEY);
 S.mastery={};S.nodeMastery={};S.conceptMastery={};S.reasoningProfile={};S.familyAttempts={};S.familyErrors={};
 $("profileInfo").textContent="Pamięć wyczyszczona.";
};

async function boot(){
 try{
  manifest=await loader.init();
  const remembered=loadProfile();
  $("bankInfo").textContent=`${manifest.records_total.toLocaleString("pl-PL")} rekordów • ${manifest.knowledge_nodes_total} węzłów wiedzy • ${manifest.families_total} rodzin`;
  $("profileInfo").textContent=remembered?"Znaleziono profil z poprzednich sesji.":"Brak wcześniejszego profilu — czysta karta.";
  $("modeInfo").textContent=MODE==="offline"?"Tryb lokalny: skompresowane paczki są rozpakowywane tylko w razie potrzeby.":"Tryb WWW: paczki .ndjson.gz są pobierane na żądanie.";
 }catch(e){
  $("bankInfo").textContent="Błąd uruchamiania: "+e.message;$("go").disabled=true;
 }
}
boot();updateStartUi();

$("go").onclick=async()=>{
 S.remember=$("remember").checked;
 S.userLevel=+$("level").value;S.startLevel=S.userLevel;S.sessionTarget=sessionQuestionsForLevel(S.startLevel);
 S.systemLevel=S.userLevel;S.stanceStart=+$("stance").value;S.stanceEnd=S.stanceStart;
 S.used=[];S.history=[];S.spineCoverage=[];S.recentFamilies=[];S.recentNodes=[];S.recentModes=[];S.remedialFamily=null;S.nextFamily=null;
 show("quiz");await nextQ();
};

function changeLevel(d){
 S.userLevel=Math.max(0,Math.min(100,S.userLevel+d));
 $("ul").textContent=S.userLevel+"%";$("gameLevelDesc").textContent=levelLabel(S.userLevel);
 $("levelnote").textContent=d>0?"Poziom gry podniesiony — trudniej, ale liczba pytań tej sesji pozostaje bez zmian.":"Poziom gry obniżony — łatwiej, ale liczba pytań tej sesji pozostaje bez zmian.";
 $("levelnote").classList.remove("hidden");setTimeout(()=>$("levelnote").classList.add("hidden"),2600);
}
$("minus").onclick=()=>changeLevel(-10);$("plus").onclick=()=>changeLevel(10);

function setReadingLock(rec){
 if(unlockTimer)clearInterval(unlockTimer);
 const ms=Math.max(1800,Math.min(6000,1200+rec.stem.length*12+rec.difficulty*12)),until=Date.now()+ms;
 $("check").disabled=true;
 unlockTimer=setInterval(()=>{
  const left=until-Date.now();
  if(left<=0){clearInterval(unlockTimer);$("readTimer").textContent="Możesz już zatwierdzić odpowiedź.";$("check").disabled=!sel}
  else $("readTimer").textContent="Minimalny czas zapoznania: "+(left/1000).toFixed(1)+" s";
 },100);
}


function renderSpine(currentFamily){
 const wrap=$("spineMap");if(!wrap)return;
 const items=E.spineStatus(S,currentFamily);
 wrap.innerHTML=items.map(x=>{
   const cls=x.status==="done"?"spine-done":(x.status==="current"?"spine-current":"spine-pending");
   const mark=x.status==="done"?"✓":x.index;
   return `<div class="spine-step ${cls}"><span>${mark}</span><small>${x.label}</small></div>`;
 }).join("");
}

async function nextQ(){
 if(S.used.length>=S.sessionTarget){prepSummaries();show("s1");return}
 $("loading").classList.remove("hidden");
 try{
  const choice=E.chooseFamily(S,manifest);
  const famName=choice[0],famEntry=choice[1];selectionReason=choice[2];
  curChunk=E.chooseChunk(S,famEntry);
  const records=await loader.load(curChunk.path);
  cur=E.chooseRecord(S,records);if(!cur)throw new Error("Brak rekordu w paczce.");
  renderSpine(cur.family);

  sel=null;$("topic").textContent=cur.topic;$("diff").textContent="trudność "+cur.difficulty+"%";
  $("ul").textContent=S.userLevel+"%";$("gameLevelDesc").textContent=levelLabel(S.userLevel);
  const st=loader.stats(),remain=Math.max(0,S.sessionTarget-S.used.length),cov=E.coreCoverage(S);
  $("meta").textContent=`pytanie ${S.used.length+1}/${S.sessionTarget} • rdzeń ${cov.done}/${cov.total} • RAM ${st.chunks} paczek / ${st.records} rekordów • system ${S.systemLevel}% • ~${Math.max(1,Math.ceil(remain*.45))} min`;
  $("whyq").textContent="Dlaczego to pytanie: "+E.why(S,cur,curChunk,selectionReason);
  $("stem").textContent=cur.stem;$("answers").innerHTML="";$("fb").classList.add("hidden");$("next").classList.add("hidden");$("cw").classList.add("hidden");$("comment").value="";

  for(const o of cur.options){
   const b=document.createElement("button");b.className="ans";b.textContent=o.text;b.onclick=()=>pick(o.id,b,false);$("answers").appendChild(b);
  }
  const n=document.createElement("button");n.className="ans";n.textContent="Żadne z powyższych";n.onclick=()=>pick("NONE",n,true);$("answers").appendChild(n);
  setReadingLock(cur);
 }catch(e){$("stem").textContent="Błąd: "+e.message}
 finally{$("loading").classList.add("hidden")}
}
function pick(id,b,isnone){
 sel=id;document.querySelectorAll(".ans").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");
 $("cw").classList.toggle("hidden",!isnone);if($("readTimer").textContent.startsWith("Możesz"))$("check").disabled=false;
}
async function checkAnswer(){
 if(!cur || !sel)return;

 const checkBtn=$("check");
 const oldText=checkBtn.textContent;
 checkBtn.disabled=true;
 checkBtn.textContent="Analizuję…";

 // Natychmiastowy sygnał dla użytkownika, że kliknięcie zostało przyjęte.
 $("fb").innerHTML="<b>Sprawdzam odpowiedź…</b>";
 $("fb").classList.remove("hidden");

 try{
   const r=E.assess(cur,sel,$("comment").value);

   // Najpierw pokaż wynik. Pamięć/profil nie może zablokować informacji zwrotnej.
   let mastery=E.famMastery(S,cur.family);
   let reasonText="";
   let src="";
   let claim="";

   try{
     reasonText=(r.chosenReasoningTags||[]).length
       ? `<div class="reasonbox"><b>Wykryty trop rozumowania:</b> ${(r.chosenReasoningTags||[]).map(id=>E.reasoningLabel(id)).join(" • ")}</div>`
       : "";
   }catch(_){ reasonText=""; }

   try{
     src=(cur.sources||[]).map(id=>{
       const s=(window.QUIZ_SOURCES||{})[id];
       return s?`<a href="${s.url}" target="_blank" rel="noopener">${s.title||id}</a>`:id;
     }).join(" • ");
   }catch(_){ src=""; }

   try{
     const node=(window.KNOWLEDGE_GRAPH?.nodes||[]).find(n=>n.id===cur.primary_node);
     claim=node
       ? `<div class="claimbox"><b>Węzeł wiedzy:</b> ${node.title}<br><span>${node.canonical_claim||""}</span></div>`
       : "";
   }catch(_){ claim=""; }

   $("fb").innerHTML=
     `<div class="result-head">${r.knowledge>=75?"✓ Odpowiedź przeanalizowana":"Odpowiedź przeanalizowana"}</div>`+
     `<b>Analiza odpowiedzi:</b> ${r.feedback}<br><br>`+
     `<b>Trafność:</b> ${r.knowledge}% &nbsp; `+
     `<b>Rozumowanie:</b> ${r.reasoning}% &nbsp; `+
     `<b>Opanowanie obszaru przed aktualizacją:</b> ${mastery}%`+
     reasonText+claim+
     (src?`<div class="sources"><b>Źródła przypisane do tego węzła:</b> ${src}</div>`:"");

   // Dopiero po pokazaniu wyniku aktualizujemy historię i profil.
   try{
     S.used.push(cur.id);
     S.history.push({id:cur.id,family:cur.family,topic:cur.topic,difficulty:cur.difficulty,...r});
     E.update(S,cur,r);
     saveProfile();
   }catch(profileErr){
     console.error("Błąd aktualizacji profilu:",profileErr);
     $("fb").innerHTML+=`<div class="softwarn">Wynik został pokazany, ale nie udało się zapisać części profilu tej sesji.</div>`;
   }

   document.querySelectorAll(".ans").forEach(b=>b.disabled=true);
   $("next").classList.remove("hidden");
   $("next").textContent="Dalej →";
   $("fb").scrollIntoView({behavior:"smooth",block:"nearest"});
 }catch(err){
   console.error("Błąd sprawdzania odpowiedzi:",err);
   $("fb").innerHTML=
     `<div class="errorbox"><b>Nie udało się przeanalizować odpowiedzi.</b><br>`+
     `${String(err && err.message ? err.message : err)}<br>`+
     `<span class="small">Możesz spróbować ponownie albo przejść do następnego pytania.</span></div>`;
   checkBtn.disabled=false;
 }finally{
   checkBtn.textContent=oldText;
 }
}
$("check").onclick=checkAnswer;
$("next").onclick=nextQ;

function avg(k){return S.history.length?Math.round(S.history.reduce((a,b)=>a+b[k],0)/S.history.length):0}
function prepSummaries(){
 const acc=avg("knowledge"),reas=avg("reasoning"),cov=E.coreCoverage(S),conf=E.profileConfidence(S);
 $("a1").textContent=acc+"%";$("r1").textContent=reas+"%";$("ab").style.width=acc+"%";$("rb").style.width=reas+"%";
 $("coverage").textContent=`${cov.done}/${cov.total} (${cov.percent}%)`;$("confidence").textContent=conf;
 $("sl").textContent=S.startLevel+"%";$("el").textContent=S.userLevel+"%";

 const by={};for(const x of S.history)(by[x.topic]??=[]).push(x.knowledge);
 const rows=Object.entries(by).map(([t,v])=>[t,Math.round(v.reduce((a,b)=>a+b,0)/v.length)]).sort((a,b)=>b[1]-a[1]);
 $("best").textContent=rows[0]?rows[0][0]+" ("+rows[0][1]+"%)":"—";$("weak").textContent=rows.at(-1)?rows.at(-1)[0]+" ("+rows.at(-1)[1]+"%)":"—";

 const weakest=E.weakestFamilies(S,5);
 const weakNodes=E.weakestNodes(S,5);
 if($("nodeweaklist"))$("nodeweaklist").innerHTML=weakNodes.length?weakNodes.map(([id,v])=>`<div class="box"><b>${E.nodeLabel(id)}</b><br>${v}%</div>`).join(""):"<div class='box'>Za mało danych.</div>";
 $("masterylist").innerHTML=weakest.length?weakest.map(([f,v])=>`<div class="box"><b>${manifest.families[f]?.topic||f}</b><br>${v}%</div>`).join(""):"<div class='box'>Za mało danych.</div>";

 const rw=E.reasoningWeaknesses(S,3);
 $("reasoninglist").innerHTML=rw.length?rw.map(([id,rate,p])=>`<div class="box"><b>${E.reasoningLabel(id)}</b><br><span class="small">${p.errors}/${p.opportunities} okazji zakończyło się tym typem błędu</span></div>`).join(""):"<div class='box'>Nie wykryto jeszcze powtarzalnego wzorca błędu.</div>";

 $("grid").innerHTML="";Object.keys(by).forEach(t=>{const b=document.createElement("button");b.className="choice";b.textContent=t;b.onclick=()=>{b.classList.toggle("sel");S.influential=[...document.querySelectorAll(".choice.sel")].map(x=>x.textContent)};$("grid").appendChild(b)});
 $("startdot").style.left=S.stanceStart+"%";$("endrange").value=S.stanceStart;$("enddot").style.left=S.stanceStart+"%";
}
$("to2").onclick=()=>show("s2");$("back1").onclick=()=>show("s1");
$("to3").onclick=()=>{$("influ").textContent=S.influential.length?S.influential.join(", "):"Nic nie zaznaczono.";$("doubtout").textContent=$("doubt").value.trim()||"Nie wpisano.";show("s3")};
$("back2").onclick=()=>show("s2");
$("endrange").oninput=()=>{S.stanceEnd=+$("endrange").value;$("enddot").style.left=S.stanceEnd+"%"};
$("retry").onclick=async()=>{const rw=E.reasoningWeaknesses(S,1)[0],wf=E.weakestFamilies(S,1)[0];if(rw){const node=window.REASONING_TAXONOMY.nodes.find(n=>n.id===rw[0]);if(node&&node.repair_families.length)S.remedialFamily=node.repair_families[0]}else if(wf)S.remedialFamily=wf[0];show("quiz");await nextQ()};
