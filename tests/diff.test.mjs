import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../diff.js';
const diff=globalThis.MrSohnWordDiff;
const changed=p=>p.filter(x=>x.changed).map(x=>x.text).join('');
test('spacing insertion and typo highlight',()=>{const d=diff('몇시에 부탁드림니다','몇 시에 부탁드립니다');assert.equal(changed(d.before),'림');assert.equal(changed(d.after),' 립');});
test('deletion, unchanged, newlines and emoji preserve exact text',()=>{for(const [a,b] of [['a  b','a b'],['같아요','같아요'],['안녕\n하세요','안녕하세요'],['👨‍👩‍👧‍👦 가게','👨‍👩‍👧‍👦 좋은 가게'],['<script>bad</script>','<img src=x>'],['','추가'],['삭제','']]){const d=diff(a,b);assert.equal(d.before.map(x=>x.text).join(''),a);assert.equal(d.after.map(x=>x.text).join(''),b);if(a===b)assert.equal(changed(d.after),'');}});
test('long replacement uses bounded fallback',()=>{const d=diff('가'.repeat(5000),'나'.repeat(5000));assert.equal(changed(d.before).length,5000);assert.equal(changed(d.after).length,5000);});
