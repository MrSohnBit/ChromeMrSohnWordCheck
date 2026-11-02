export const REVIEW_ORIGIN='https://maadm.okpos.co.kr/*';
let pending;
export function registerReviewButtons(){
 if(!pending)pending=register().finally(()=>{pending=null;});
 return pending;
}
async function register(){
 const id='okpos-review-buttons';
 const scripts=await chrome.scripting.getRegisteredContentScripts({ids:[id]});
 if(scripts.length) await chrome.scripting.updateContentScripts([{id,js:['diff.js','protection.js','content.js']}]);
 if(!scripts.length) await chrome.scripting.registerContentScripts([{id,matches:['https://maadm.okpos.co.kr/bizchatRegularCmpnReview/form/*'],js:['diff.js','protection.js','content.js'],runAt:'document_idle',persistAcrossSessions:true}]);
 // Existing tabs receive the buttons immediately, without reloading unsaved forms.
 const tabs=await chrome.tabs.query({url:'https://maadm.okpos.co.kr/bizchatRegularCmpnReview/form/*'});
 await Promise.allSettled(tabs.filter(t=>t.id).map(t=>chrome.scripting.executeScript({target:{tabId:t.id},files:['diff.js','protection.js','content.js']})));
}

export async function restoreReviewButtons(){
 if(await chrome.permissions.contains({origins:[REVIEW_ORIGIN]})) await registerReviewButtons();
}
