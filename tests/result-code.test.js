'use strict';
const assert=require('node:assert/strict');const {encode,decode}=require('../result-code.js');
const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const old=['4VA73','5VA5M','6VA2D','7VA0T','0VA5R','1VA7F','2VA0P','3VA21','CVA2N','DVA02','EVA7V'];
function referenceCrc(word){let polynomial=word*256;for(let bit=23;bit>=8;bit--)if((polynomial>>>bit)&1)polynomial^=0x107<<(bit-8);return polynomial;}
for(let n=0;n<=10;n++){
 assert.equal(decode('EL1-'+old[n]).difficulty,1);assert.equal(decode('EL1-'+old[n]).percent,n*10);
 for(const difficulty of [0,1]){
  const code=encode({correct:n,total:10,completed:true,moduleId:'electricity-knowledge',difficulty});
  assert.deepEqual(decode(code),{version:2,moduleId:'electricity-knowledge',completed:true,difficulty,level:difficulty===0?'pupil':'student',correct:n,total:10,percent:n*10});
  assert.equal(decode(' '+code.toLowerCase()+' ').correct,n);
  const payload=0x2800+difficulty*1024+n*64+10*4+1;const xor=payload^0x5A3C;
  const rotated=((xor*32)%65536)+Math.floor(xor/2048);let packed=0;
  for(const c of code.slice(4))packed=packed*32+alphabet.indexOf(c);
  assert.equal(packed>>>8,rotated);assert.equal(packed&255,referenceCrc(rotated));
  for(let pos=4;pos<9;pos++)for(const c of alphabet)if(c!==code[pos])assert.throws(()=>decode(code.slice(0,pos)+c+code.slice(pos+1)));
  assert.throws(()=>decode('EL1-'+code.slice(4)));
 }
}
const valid={correct:8,total:10,completed:true,moduleId:'electricity-knowledge',difficulty:1};
for(const patch of [{difficulty:2},{difficulty:-1},{difficulty:'1'},{correct:11},{correct:1.5},{total:9},{completed:false},{moduleId:'political-compass'}])assert.throws(()=>encode({...valid,...patch}));
for(const text of [null,123,'EL2-ZZZZZ','EL2-OVA2N','EL3-CVA2N','<script>'])assert.throws(()=>decode(text));
assert.notEqual(encode({...valid,difficulty:0}),encode(valid));
console.log('EL2: all 22 level/score pairs, 3410 single-character typos, independent CRC/rotation; all 11 legacy EL1 scores PASS.');
