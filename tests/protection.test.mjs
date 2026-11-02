import test from 'node:test';
import assert from 'node:assert/strict';
import '../protection.js';
import {correct} from '../api.js';
const {check}=globalThis.MrSohnProtection;
test('protect placeholders, numbers, URL, email and repeated shop names',()=>{
 for(const [before,after] of [['{고객명} 안녕','{이름} 안녕'],['[가게명] 안녕','가게명 안녕'],['010-1234-5678','010-1234-5679'],['10,000원','10000원'],['https://a.com','https://b.com'],['a@a.com','a@b.com'],['두번 12 12','두번 12']]) assert.ok(check(before,after));
 assert.ok(check('손씨네 손씨네','손씨네 손네',['손씨네']));
 assert.equal(check('손씨네 {고객명} 10,000원 이에요','손씨네 {고객명} 10,000원이에요',['손씨네']),'');
});
test('API rejects unsafe output and includes only relevant protected terms',async()=>{
 let body;
 const fetcher=async(_,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({corrected:'손네 11원'})}]}}]})};};
 await assert.rejects(correct('손씨네 10원','fake-key',fetcher,['손씨네','없는상호']),/변경/);
 assert.deepEqual(JSON.parse(body.contents[0].parts[0].text).protectedTerms,['손씨네']);
});
