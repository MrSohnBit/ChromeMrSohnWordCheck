export async function checkShortcut({guideIfMissing=false}={}) {
 const commands=await chrome.commands.getAll();
 const shortcut=commands.find(c=>c.name==='proofread')?.shortcut || '';
 const {lastProofreadShortcut}=await chrome.storage.local.get('lastProofreadShortcut');
 if(shortcut){
  await chrome.storage.local.set({lastProofreadShortcut:shortcut});
  await chrome.action.setBadgeText({text:''});
  return {shortcut,previous:shortcut};
 }
 await chrome.action.setBadgeText({text:'KEY'});
 await chrome.action.setBadgeBackgroundColor({color:'#B45309'});
 if(guideIfMissing && lastProofreadShortcut){
  const tabs=await chrome.tabs.query({});
  const existing=tabs.find(t=>t.url==='chrome://extensions/shortcuts');
  if(existing)await chrome.tabs.update(existing.id,{active:true});
  else await chrome.tabs.create({url:'chrome://extensions/shortcuts'});
 }
 return {shortcut:'',previous:lastProofreadShortcut || ''};
}
