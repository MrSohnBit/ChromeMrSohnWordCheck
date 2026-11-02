import {checkShortcut} from './shortcut.js';
import {restoreReviewButtons} from './site-access.js';
import {correct} from './api.js';
// API keys are readable only by extension pages/service worker, never content scripts.
const secured = chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
chrome.commands.onCommand.addListener(async command => {
  if(command !== 'proofread') return;
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id) return;
  try {
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['diff.js','protection.js','content.js']});
    await chrome.tabs.sendMessage(tab.id,{type:'OPEN_PROOFREADER'},{frameId:0});
    await chrome.action.setBadgeText({tabId:tab.id,text:''});
  } catch {
    await chrome.action.setBadgeText({tabId:tab.id,text:'!'});
    await chrome.action.setTitle({tabId:tab.id,title:'이 페이지에서 실행할 수 없습니다. 일반 웹페이지의 입력창에서 사용해 주세요.'});
  }
});
let busy=false;
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(sender.id !== chrome.runtime.id || !sender.tab || message.type !== 'CORRECT') return;
  if(busy){reply({error:'다른 교정 요청이 진행 중입니다. 잠시 후 다시 시도해 주세요.'});return;}
  busy=true;
  (async()=>{
    await secured;
    const {apiKey,consent}=await chrome.storage.local.get(['apiKey','consent']);
    if(!consent) throw new Error('확장 프로그램 아이콘에서 무료 이용 안내를 확인하고 API 키를 저장해 주세요.');
    return correct(message.text,apiKey,fetch,message.protectedTerms);
  })().then(corrected=>reply({corrected})).catch(error=>reply({error:error.name==='TimeoutError'?'응답 시간이 초과되었습니다. 다시 시도해 주세요.':error.message==='Failed to fetch'?'네트워크 연결을 확인해 주세요.':error.message})).finally(()=>{busy=false;});
  return true;
});

// Chrome may discard dynamic registrations when an unpacked extension is reloaded.
// Reconcile from the already-granted permission whenever the worker starts.
const restore=()=>restoreReviewButtons().catch(()=>{});
chrome.runtime.onInstalled.addListener(restore);
chrome.runtime.onStartup.addListener(restore);
chrome.permissions.onAdded.addListener(restore);
void restore();

// Chrome has no commands.update API. Detect loss without pretending to restore it.
chrome.runtime.onInstalled.addListener(()=>{void checkShortcut({guideIfMissing:true}).catch(()=>{});});
chrome.runtime.onStartup.addListener(()=>{void checkShortcut({guideIfMissing:true}).catch(()=>{});});
void checkShortcut().catch(()=>{});
