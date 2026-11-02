import {checkShortcut} from './shortcut.js';
import {REVIEW_ORIGIN,registerReviewButtons} from './site-access.js';
import {validateAndSave} from './settings.js';
const key=document.querySelector('#key'), consent=document.querySelector('#consent'), status=document.querySelector('#status');
const form=document.querySelector('form'), save=form.querySelector('[type=submit]'), remove=document.querySelector('#remove');
let busy=false;
function setBusy(value) {
  busy=value;
  for (const control of [key,consent,save,remove]) control.disabled=value;
  form.setAttribute('aria-busy',String(value));
  save.textContent=value?'키 확인 중…':'설정 저장';
}
setBusy(true);
(async()=>{
 try {const data=await chrome.storage.local.get(['apiKey','consent']);key.value=data.apiKey || '';consent.checked=!!data.consent;}
 catch {status.textContent='저장된 설정을 읽지 못했습니다.';}
 finally {setBusy(false);}
})();
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(busy || !form.reportValidity()) return;
 const candidate=key.value, agreed=consent.checked;
 setBusy(true);
 status.textContent='Gemini에 테스트 문장을 보내 API 키와 모델 사용 가능 여부를 확인하고 있습니다…';
 try {
  await validateAndSave(candidate,agreed,chrome.storage.local);
  status.textContent='키 검증 완료 · 저장했습니다. 입력창에서 단축키를 눌러 주세요.';
 } catch(error) {
  const message=error.name==='TimeoutError'?'키 확인 시간이 초과되었습니다. 다시 시도해 주세요.':error instanceof TypeError?'네트워크 연결을 확인해 주세요.':error.message;
  status.textContent=message+' 설정은 저장하지 않았으며, 기존 설정은 유지됩니다.';
 } finally {setBusy(false);}
});
remove.addEventListener('click',async()=>{
 if(busy)return;
 setBusy(true);
 try {await chrome.storage.local.remove(['apiKey','consent']);key.value='';consent.checked=false;status.textContent='API 키를 삭제했습니다.';}
 catch {status.textContent='API 키를 삭제하지 못했습니다. 다시 시도해 주세요.';}
 finally {setBusy(false);}
});

const enableReview=document.querySelector('#enable-review');
const reviewStatus=document.querySelector('#review-status');
enableReview.addEventListener('click',async()=>{
 try {
  const granted=await chrome.permissions.request({origins:[REVIEW_ORIGIN]});
  if(!granted){reviewStatus.textContent='권한이 허용되지 않았습니다. 단축키는 계속 사용할 수 있습니다.';return;}
  await registerReviewButtons();
  reviewStatus.textContent='활성화했습니다. 검수 페이지의 두 입력칸 옆에 문구 교정 버튼이 표시됩니다.';
 }catch{reviewStatus.textContent='버튼을 활성화하지 못했습니다. 다시 시도해 주세요.';}
});

async function refreshShortcut(){
 const label=document.querySelector('#shortcut-state');
 try {const {shortcut,previous}=await checkShortcut();label.textContent=shortcut?'현재 교정 단축키: '+shortcut:'단축키가 해제되었습니다. '+(previous || 'Mac ⌘⇧Y / Windows Ctrl⇧Y')+'로 다시 설정해 주세요.';}
 catch {label.textContent='단축키 상태를 확인하지 못했습니다.';}
}
document.querySelector('#shortcut-settings').addEventListener('click',()=>chrome.tabs.create({url:'chrome://extensions/shortcuts'}));
window.addEventListener('focus',refreshShortcut);
void refreshShortcut();
