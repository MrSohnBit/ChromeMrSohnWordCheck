import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateAndSave} from '../settings.js';
const success={ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"corrected":"안녕하세요."}'}]}}]})};
function storage(){return {saved:{apiKey:'old-key',consent:true},async setAccessLevel(){},async set(data){this.saved=data;}};}
test('validates before storing trimmed key',async()=>{
 const s=storage();let calls=0;
 await validateAndSave(' new-key ',true,s,async(url,options)=>{calls++;assert.equal(s.saved.apiKey,'old-key');assert.equal(options.headers['x-goog-api-key'],'new-key');assert.equal(JSON.parse(JSON.parse(options.body).contents[0].parts[0].text).text,'안녕하세요.');return success;});
 assert.equal(calls,1);assert.deepEqual(s.saved,{apiKey:'new-key',consent:true});
});
for(const code of [400,401,403,429,500]) test(`HTTP ${code} preserves existing settings`,async()=>{
 const s=storage();await assert.rejects(validateAndSave('bad',true,s,async()=>({ok:false,status:code})));assert.equal(s.saved.apiKey,'old-key');
});
test('network and timeout failures preserve existing settings',async()=>{
 for(const error of [new TypeError('Failed to fetch'),new DOMException('Timeout','TimeoutError')]){const s=storage();await assert.rejects(validateAndSave('key',true,s,async()=>{throw error;}));assert.equal(s.saved.apiKey,'old-key');}
});
test('missing key or consent never sends request',async()=>{
 for(const [key,consent] of [['',true],['key',false]])await assert.rejects(validateAndSave(key,consent,storage(),()=>assert.fail('unexpected request')));
});
