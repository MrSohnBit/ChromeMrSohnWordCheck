import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkShortcut} from '../shortcut.js';
test('shortcut monitoring preserves assigned keys and guides only after loss',async()=>{
 let shortcut='Command+Shift+Y',previous='',opened=0,badge;
 globalThis.chrome={commands:{getAll:async()=>[{name:'proofread',shortcut}]},storage:{local:{get:async()=>({lastProofreadShortcut:previous}),set:async v=>{previous=v.lastProofreadShortcut}}},action:{setBadgeText:async v=>{badge=v.text},setBadgeBackgroundColor:async()=>{}},tabs:{query:async()=>[],create:async()=>{opened++}}};
 await checkShortcut({guideIfMissing:true});assert.equal(opened,0);assert.equal(previous,shortcut);assert.equal(badge,'');
 shortcut='';await checkShortcut();assert.equal(badge,'KEY');assert.equal(opened,0);
 await checkShortcut({guideIfMissing:true});assert.equal(opened,1);assert.equal(previous,'Command+Shift+Y');
 shortcut='Alt+Shift+J';await checkShortcut({guideIfMissing:true});assert.equal(previous,shortcut);assert.equal(opened,1);assert.equal(badge,'');
 delete globalThis.chrome;
});
