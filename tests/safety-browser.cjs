const {chromium}=require('playwright');
const assert=require('assert/strict');
(async()=>{
 const dir=require('path').resolve(__dirname,'..');
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 await page.setContent('<textarea id="target"></textarea><div contenteditable="true" id="editable">안녕 하세요</div>');
 await page.evaluate(()=>{
  const attach=Element.prototype.attachShadow;Element.prototype.attachShadow=function(o){return attach.call(this,{...o,mode:'open'});};
  window.chrome={runtime:{onMessage:{addListener:f=>window.openProof=f},sendMessage:async m=>({corrected:m.text.replace('안녕 하세요','안녕하세요')})}};
 });
 for(const file of ['diff.js','protection.js','content.js'])await page.addScriptTag({path:dir+'/'+file});
 const field=page.locator('#target');
 const open=async(text)=>{await field.fill(text);await field.focus();await page.evaluate(()=>openProof({type:'OPEN_PROOFREADER'}));await page.locator('#after:enabled').waitFor();};
 const apply=()=>page.locator('#apply').click();
 await open('안녕 하세요 {고객명} 010-1234-5678');
 await page.locator('#after').fill('안녕하세요 {고객명} 010-1234-5679');await apply();
 assert.match(await page.locator('#status').innerText(),/변경/);assert.equal(await field.inputValue(),'안녕 하세요 {고객명} 010-1234-5678');
 await page.locator('#after').fill('안녕하세요 {고객명} 010-1234-5678');await apply();
 await page.locator('#undo').click();assert.equal(await field.inputValue(),'안녕 하세요 {고객명} 010-1234-5678');
 console.log('PASS manual token changes blocked and successful apply undone');
 await open('손씨네 안녕 하세요');await page.locator('#protected').fill('손씨네');await page.locator('#after').fill('손네 안녕하세요');await apply();assert.match(await page.locator('#status').innerText(),/보호할 단어/);
 await page.locator('#after').fill('손씨네 안녕하세요');await apply();await field.fill('사용자가 새로 작성');await page.locator('#undo').click();assert.equal(await field.inputValue(),'사용자가 새로 작성');assert.match(await page.getByRole('status').innerText(),/바뀌어/);await page.locator('#dismiss').click();
 console.log('PASS protected shop name and undo stale-value protection');
 await page.evaluate(()=>{const t=document.querySelector('#target');t.value='앞 안녕 하세요 뒤';t.focus();t.setSelectionRange(2,8);openProof({type:'OPEN_PROOFREADER'});});await page.locator('#after:enabled').waitFor();await apply();await page.locator('#undo').click();assert.equal(await field.inputValue(),'앞 안녕 하세요 뒤');
 await page.locator('#editable').focus();await page.evaluate(()=>openProof({type:'OPEN_PROOFREADER'}));await page.locator('#after:enabled').waitFor();await apply();await page.locator('#undo').click();assert.equal(await page.locator('#editable').innerText(),'안녕 하세요');
 console.log('PASS selection and plain contenteditable undo');
 await open('손씨네 안녕 하세요');await page.locator('#protected').fill('손씨네');
 for(const width of [420,1440]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
  const boxes=await page.locator('.pane').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert.ok(boxes[0].right<=boxes[1].left);
 }
 await browser.close();console.log('PASS responsive side-by-side preview');
})().catch(e=>{console.error(e);process.exit(1);});
