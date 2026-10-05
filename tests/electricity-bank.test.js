'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const zlib = require('node:zlib');
const vm = require('node:vm');
const bank = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, '../topics/electricity-student.json')));
const embedded = { window: {} };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../topics/electricity-student.quiz.gz.js'),'utf8'), embedded);
assert.deepEqual(JSON.parse(zlib.gunzipSync(Buffer.from(embedded.window.KNJ_EMBEDDED_TOPICS['topics/electricity-student.quiz.gz'], 'base64'))), bank);
assert.deepEqual(JSON.parse(zlib.gunzipSync(fs.readFileSync(require('node:path').join(__dirname, '../topics/electricity-student.quiz.gz')))), bank);
assert.equal(bank.questions.length, 60);
const groups = new Map();
function near(a,b,tol=1e-8){assert.ok(Math.abs(a-b)<=tol, `${a} != ${b}`);}
function numbers(label){return [...label.replaceAll('−','-').matchAll(/[+-]?\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));}
function rounded(value,places=2){return Number(value.toFixed(places));}
for(const q of bank.questions.filter(q=>q.difficulty===1)){
  groups.set(q.group,(groups.get(q.group)||0)+1);
  assert.equal(q.difficulty,1); assert.equal(q.options.length,4);
  assert.equal(new Set(q.options.map(o=>o.id)).size,4);
  assert.equal(new Set(q.options.map(o=>o.label)).size,4);
  assert.equal(q.options.filter(o=>o.id===q.correctOptionId).length,1);
  assert.ok(q.translations.en.text && q.translations.en.hint && q.translations.en.explanation && q.translations.en.category);
  assert.ok(q.sourceIds.every(id=>bank.sources.some(source=>source.id===id)));
  const x=q.calculation.inputs, v=q.calculation.expected;
  const correct=q.options.find(o=>o.id===q.correctOptionId).label;
  let expected;
  switch(q.group){
    case 'ac': {
      // Complex division U/(R+jX), then S=U*conj(I).
      const real=x.u*x.r/(x.r*x.r+x.x*x.x), imag=-x.u*x.x/(x.r*x.r+x.x*x.x);
      expected=[Math.sqrt(real*real+imag*imag),x.u*real,-x.u*imag];
      near(v.i,expected[0]); near(v.p,expected[1]); near(v.q,expected[2]); break;
    }
    case 'rlc': {
      const omega=Math.sqrt(1/x.l/x.c); expected=[omega/2/Math.PI,omega*x.l/x.r];
      near(v.f,expected[0]); near(v.quality,expected[1]); break;
    }
    case 'threephase': {
      const phase=x.u/Math.sqrt(3), i=Math.sqrt(phase*phase/(x.r*x.r+x.x*x.x));
      expected=[i,Math.sqrt(3)*x.u*i*x.r/Math.sqrt(x.r*x.r+x.x*x.x)/1000];
      near(v.i,expected[0]); near(v.p,expected[1]); break;
    }
    case 'compensation': {
      const qBefore=Math.sqrt((x.p/x.a)**2-x.p**2), qAfter=Math.sqrt((x.p/x.b)**2-x.p**2);
      expected=[qBefore-qAfter]; near(v.q,expected[0]); break;
    }
    case 'harmonics': {
      // Independently integrate actual voltage/current waveforms over one cycle.
      let power=0,squared=0; const count=12000;
      for(let j=0;j<count;j++){const t=2*Math.PI*j/count, voltage=Math.sqrt(2)*x.u*Math.sin(t), current=Math.sqrt(2)*(x.i1*Math.sin(t)+x.i3*Math.sin(3*t)); power+=voltage*current/count;squared+=current*current/count;}
      const pf=power/x.u/Math.sqrt(squared); near(v.p,power,1e-7);near(v.irms,Math.sqrt(squared));near(v.pf,pf);
      expected=[rounded(power),rounded(pf,3)]; break;
    }
    case 'slip': expected=[100*(1-x.speed/(120*x.freq/x.poles)),x.freq-x.speed*x.poles/120]; near(v.s,expected[0]/100);near(v.fr,expected[1]); break;
    case 'motorpower': expected=[x.s*x.p*1000,x.p-x.s*x.p];near(v.loss,expected[0]);near(v.mech,expected[1]);break;
    case 'transformer': {
      expected=[100*Math.sqrt(x.fe/x.cu)];near(v.load,expected[0]/100);
      const eta=load=>10000*load/(10000*load+x.fe+x.cu*load*load);
      assert.ok(eta(v.load)>eta(v.load-.001)&&eta(v.load)>eta(v.load+.001));break;
    }
    case 'buck': {
      const d=x.vout/x.vin, onRise=(x.vin-x.vout)/x.l*d/x.freq, offFall=x.vout/x.l*(1-d)/x.freq;
      near(onRise,offFall);near(v.ripple,onRise);near(v.d,d);expected=[100*d,onRise];break;
    }
    case 'matching': {
      near(v.r,x.r);near(v.x,-x.x);
      const power=(r,reactance)=>r/((r+x.r)**2+(reactance+x.x)**2);
      const peak=power(v.r,v.x);
      for(const dr of [-.1,0,.1])for(const dx of [-.1,0,.1])assert.ok(power(v.r+dr,v.x+dx)<=peak+1e-12);
      expected=[x.r,-x.x];break;
    }
  }
  // Some label symbols contain digits (e.g. f₂); compare a constructed label instead.
  let expectedLabel;
  const f=(value,places=2)=>String(rounded(value,places));
  switch(q.group){
    case 'ac':expectedLabel=`I = ${f(expected[0])} A; P = ${f(expected[1])} W; Q = +${f(expected[2])} var`;break;
    case 'rlc':expectedLabel=`f₀ ≈ ${f(expected[0])} Hz; Q = ${f(expected[1])}`;break;
    case 'threephase':expectedLabel=`I = ${f(expected[0])} A; P = ${f(expected[1])} kW`;break;
    case 'compensation':expectedLabel=`${f(expected[0])} kvar`;break;
    case 'harmonics':expectedLabel=`P = ${f(expected[0])} W; PF ≈ ${f(expected[1],3)}`;break;
    case 'slip':expectedLabel=`s = ${f(expected[0])}%; f₂ = ${f(expected[1])} Hz`;break;
    case 'motorpower':expectedLabel=`ΔPcu₂ = ${f(expected[0])} W; Pmech = ${f(expected[1])} kW`;break;
    case 'transformer':expectedLabel=`${f(expected[0])}%`;break;
    case 'buck':expectedLabel=`D = ${f(expected[0])}%; ΔIL = ${f(expected[1])} A`;break;
    case 'matching':expectedLabel=`${expected[0]} ${expected[1]>=0?'+':'−'} j${Math.abs(expected[1])} Ω`;break;
  }
  assert.equal(correct,expectedLabel,q.id);
}
assert.equal(groups.size,10);assert.ok([...groups.values()].every(count=>count===3));
console.log('Electricity bank: 30 bilingual questions, 10 areas, all answer keys independently recalculated; gzip and embedded copy match.');

const basic = bank.questions.filter(q=>q.difficulty===0); assert.equal(basic.length,30);
const basicGroups = new Map();
for(const q of basic){
  const x=q.calculation.inputs;
  const calc={ohm:()=>x.u/x.r,series:()=>x.a+x.b,parallel:()=>1/(2/x.r),power:()=>x.u*x.i,energy:()=>x.p*x.t,kcl:()=>x.a+x.b,charge:()=>x.i*x.t,capacitor:()=>x.c*1e-6*x.u*1000,period:()=>1000/x.f,loss:()=>x.i*x.i*x.r}[q.group]();
  near(calc,q.calculation.expected.value);
  const label=q.options.find(o=>o.id===q.correctOptionId).label;
  assert.equal(label,`${Number(calc.toFixed(2))} ${q.calculation.expected.unit}`);
  assert.equal(new Set(q.options.map(o=>o.label)).size,4);assert.equal(q.options.length,4);
  assert.equal(q.translations.en.options.find(o=>o.id===q.correctOptionId).label,label);
  assert.ok(q.translations.en.text&&q.translations.en.hint&&q.translations.en.explanation);
  assert.ok(q.sourceIds.every(id=>bank.sources.some(s=>s.id===id)));
  basicGroups.set(q.group,(basicGroups.get(q.group)||0)+1);
}
assert.equal(basicGroups.size,10);assert.ok([...basicGroups.values()].every(n=>n===3));
assert.equal(new Set(bank.questions.map(q=>q.id)).size,60);
console.log('Additional pupil band: 30 bilingual items, all keys independently recalculated; 10 groups × 3 variants PASS.');
