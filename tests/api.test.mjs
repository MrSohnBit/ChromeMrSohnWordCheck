import {test} from 'node:test';
import assert from 'node:assert/strict';
import {correct} from '../api.js';
test('request contract, key header and structured response',async()=>{
 const result=await correct('몇시에 하나요?','fake-key',async(url,options)=>{
  assert.match(url,/gemini-3.5-flash-lite:generateContent$/);
  assert.equal(options.headers['x-goog-api-key'],'fake-key');
  assert.ok(!url.includes('fake-key'));
  const body=JSON.parse(options.body);
  assert.deepEqual(JSON.parse(body.contents[0].parts[0].text),{text:'몇시에 하나요?'});
  assert.equal(body.generationConfig.responseMimeType,'application/json');
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"corrected":"몇 시에 하나요?"}'}]}}]})};
 });assert.equal(result,'몇 시에 하나요?');
});
test('quota error is surfaced with no retry',async()=>{let count=0;await assert.rejects(correct('문장','key',async()=>{count++;return{ok:false,status:429};}),/한도/);assert.equal(count,1);});
test('empty, oversized and missing-key inputs never call API',async()=>{const nope=()=>assert.fail('should not fetch');for(const text of ['', ' ', 'a'.repeat(5001)])await assert.rejects(correct(text,'key',nope));await assert.rejects(correct('text','',nope));});
test('incomplete and invalid responses cannot replace input',async()=>{for(const candidate of [{finishReason:'MAX_TOKENS'},{finishReason:'STOP',content:{parts:[{text:'not json'}]}},{finishReason:'STOP',content:{parts:[{text:'{"corrected":""}'}]}}])await assert.rejects(correct('문장','key',async()=>({ok:true,json:async()=>({candidates:[candidate]})})));});

test('server authentication details are shown without exposing the submitted key',async()=>{
 const key='AQ.fake-key-for-test';
 await assert.rejects(correct('문장',key,async()=>({ok:false,status:400,json:async()=>({error:{status:'INVALID_ARGUMENT',message:`Invalid key ${key}`,details:[{reason:'API_KEY_INVALID'}]}})})),error=>{assert.match(error.message,/HTTP 400 INVALID_ARGUMENT/);assert.match(error.message,/Google 응답/);assert.ok(!error.message.includes(key));return true;});
});
