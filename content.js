(()=>{
 if(globalThis.__geminiProofreader) return;
 globalThis.__geminiProofreader=true;
 let host=null, undoHost=null, composing=false;
 document.addEventListener('compositionstart',()=>{composing=true;},true);
 document.addEventListener('compositionend',()=>{composing=false;},true);
 chrome.runtime.onMessage.addListener(message=>{if(message.type==='OPEN_PROOFREADER') open();});
 installReviewButtons();
 function open(explicitTarget=null){
  if(host){return;}
  let target=explicitTarget || document.activeElement;
  while(target?.shadowRoot?.activeElement) target=target.shadowRoot.activeElement;
  const field=target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && ['text','search','url','tel'].includes(target.type));
  const editable=target?.isContentEditable;
  const read=()=>field?target.value:target.innerText;
  let warning='';
  if(composing) warning='한글 입력을 마친 뒤 다시 단축키를 눌러 주세요.';
  else if((!field && !editable) || target.disabled || target.readOnly) warning='수정할 텍스트 입력창을 클릭한 뒤 다시 실행해 주세요. 비밀번호·읽기 전용 입력창과 iframe 내부는 지원하지 않습니다.';
  // Restrict rich editors: replacing their DOM can erase formatting, mentions or attachments.
  else if(editable && target.querySelector('*:not(br):not(div):not(p)')) warning='서식·링크·멘션이 있는 편집기는 직접 적용을 지원하지 않습니다. 일반 텍스트 입력창에서 사용해 주세요.';
  const original=warning?'':read();
  const start=field?(target.selectionStart ?? 0):0;
  const end=field?(target.selectionEnd ?? original.length):original.length;
  const selected=!explicitTarget && field && end>start;
  const text=selected?original.slice(start,end):original;
  if(!warning && (!text.trim() || text.length>5000)) warning='1~5,000자의 문장을 입력하거나 선택해 주세요.';
  const protectedTerms=[];
  if(location.origin==='https://maadm.okpos.co.kr:8090'){
   for(const row of document.querySelectorAll('#variableForm tr')){
    if(/^(가게명|상호명)\s*[:：]?$/.test(row.querySelector('th')?.textContent.trim()||'')){
     const cell=row.querySelector('td');const name=(cell?.querySelector('input')?.value||cell?.textContent||'').trim();
     if(name && text.includes(name))protectedTerms.push(name);
    }
   }
  }
  host=document.createElement('div');
  const root=host.attachShadow({mode:'closed'});
  root.innerHTML=`<style>
  :host{all:initial}*{box-sizing:border-box}dialog{font:14px/1.6 system-ui,sans-serif;color:#1c2940;background:#fff;border:1px solid #e0e5ef;border-radius:18px;width:94vw;max-width:1600px;height:88vh;height:88dvh;max-height:94dvh;padding:clamp(12px,2.4vw,28px);overflow:auto;box-shadow:0 24px 90px #0b153b40}dialog::backdrop{background:#18233c65}h2{font-size:23px;margin:4px 0 8px}.eyebrow{color:#5365cd;font-size:11px;letter-spacing:2px}p{color:#667085;margin:8px 0 18px}label{display:block;font-weight:650;font-size:12px;margin:14px 0 6px}textarea{display:block;width:100%;min-height:80px;height:100%;flex:1;resize:none;padding:12px;border-radius:9px;border:1px solid #cdd5e5;background:#f7f9fc;color:#253149;font:14px/1.7 system-ui}textarea:focus{outline:2px solid #899af6}#status{white-space:pre-wrap;min-height:24px;color:#485bd0;font-size:13px}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}button{font:600 13px system-ui;border:0;border-radius:8px;background:#edf0f6;color:#344054;padding:11px 18px;cursor:pointer}button.primary{background:#485bd7;color:#fff}button:disabled{opacity:.4;cursor:default}button:focus-visible{outline:3px solid #a1afff;outline-offset:2px}.note{font-size:11px;margin:12px 0 0}
  dialog[open]{display:flex;flex-direction:column;gap:12px}section{display:flex;flex-direction:column;flex:1;min-height:120px}section[hidden]{display:none}.comparison{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(8px,2vw,24px);flex:1;min-height:0}.pane{display:flex;flex-direction:column;min-width:0;min-height:0}.pane label{min-height:38px;margin:0 0 6px;display:flex;align-items:center}.note{flex:none}#status{flex:none;max-height:18vh;overflow:auto;overflow-wrap:anywhere}.actions{flex:none;margin-top:0}.eyebrow{flex:none}@media(max-width:480px){dialog{width:96vw}textarea{padding:8px;font-size:13px}.pane label{font-size:11px}button{padding:10px 12px}}

  .editor{position:relative;flex:1;min-height:80px;overflow:hidden;border:1px solid #cdd5e5;border-radius:9px;background:#f7f9fc}.editor:focus-within{outline:2px solid #899af6}.editor textarea,.highlight{position:absolute;inset:0;width:100%;height:100%;margin:0;border:0;border-radius:0;padding:12px;font:14px/1.7 system-ui;letter-spacing:normal;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal;tab-size:8;box-sizing:border-box;overflow-y:scroll;overflow-x:hidden}.editor textarea{background:transparent;resize:none;outline:none;color:#253149}.highlight{pointer-events:none;color:transparent;scrollbar-color:transparent transparent}.highlight mark{color:transparent;background:#fde68a;border-radius:2px;box-decoration-break:clone;-webkit-box-decoration-break:clone}.highlight.removed mark{background:#fecdd3}.legend{padding:2px 5px;border-radius:3px;color:#253149}.removed-key{background:#fecdd3}.added-key{background:#fde68a}@media(max-width:480px){.editor textarea,.highlight{padding:8px;font-size:13px}}
  </style><dialog aria-label="교정 미리보기"><div class="eyebrow">MrSohnWordCheck</div><section><div class="comparison"><div class="pane"><label for="before">원문</label><div class="editor"><div id="before-highlight" class="highlight removed" aria-hidden="true"></div><textarea id="before" readonly></textarea></div></div><div class="pane"><label for="after">수정문 · 직접 편집할 수 있어요</label><div class="editor"><div id="after-highlight" class="highlight added" aria-hidden="true"></div><textarea id="after" disabled></textarea></div></div></div><p class="note"><span class="legend removed-key">원문: 삭제·변경</span> <span class="legend added-key">수정문: 추가·변경</span> · 띄어쓰기 변경도 표시합니다. 메시지는 자동 전송되지 않습니다.</p></section><label for="protected">보호할 단어 (상호명 등, 쉼표로 구분)<input id="protected" type="text" style="display:block;width:100%;padding:8px;border:1px solid #cdd5e5;border-radius:6px" placeholder="예: 손씨네 식당"></label><div id="status" role="status" aria-live="polite"></div><div class="actions"><button id="close">취소</button><button id="apply" class="primary" disabled>입력창에 적용</button></div></dialog>`;
  document.documentElement.append(host);
  const dialog=root.querySelector('dialog'),before=root.querySelector('#before'),after=root.querySelector('#after'),status=root.querySelector('#status'),apply=root.querySelector('#apply');
  const protectedInput=root.querySelector('#protected');protectedInput.value=protectedTerms.join(', ');
  const protectionError=()=>globalThis.MrSohnProtection.check(text,after.value,protectedInput.value.split(','));
  before.value=text;
  const beforeHighlight=root.querySelector('#before-highlight'),afterHighlight=root.querySelector('#after-highlight');
  const paint=(element,parts)=>{
   const fragment=document.createDocumentFragment();
   for(const part of parts){const node=document.createElement(part.changed?'mark':'span');node.textContent=part.text;fragment.append(node);}
   fragment.append(document.createTextNode('\n'));element.replaceChildren(fragment);
  };
  const syncScroll=()=>{for(const [input,layer] of [[before,beforeHighlight],[after,afterHighlight]]){layer.scrollTop=input.scrollTop;layer.scrollLeft=input.scrollLeft;}};
  const highlight=()=>{const diff=globalThis.MrSohnWordDiff(text,after.value);paint(beforeHighlight,diff.before);paint(afterHighlight,diff.after);syncScroll();};
  let highlightTimer;
  after.addEventListener('input',()=>{clearTimeout(highlightTimer);highlightTimer=setTimeout(highlight,100);});
  before.addEventListener('scroll',syncScroll);after.addEventListener('scroll',syncScroll);
  const close=()=>{clearTimeout(highlightTimer);dialog.close();host?.remove();host=null;if(target?.isConnected)target.focus();};
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  root.querySelector('#close').onclick=close;
  dialog.showModal();
  if(warning){root.querySelector('section').hidden=true;status.textContent=warning;return;}
  status.textContent='Gemini가 교정 중입니다…';
  const currentHost=host;
  chrome.runtime.sendMessage({type:'CORRECT',text,protectedTerms}).then(result=>{
   if(host!==currentHost)return;
   if(result?.error)throw new Error(result.error);
   if(typeof result?.corrected!=='string')throw new Error('교정 결과를 받지 못했습니다.');
   after.value=result.corrected;after.disabled=false;apply.disabled=false;highlight();
   status.textContent=text===result.corrected?'고칠 오타가 없습니다. 필요하면 수정문을 직접 편집하세요.':selected?'선택한 부분만 교정했습니다. 확인 후 적용해 주세요.':'교정했습니다. 확인 후 적용해 주세요.';
  }).catch(error=>{if(host===currentHost)status.textContent=error.message;});
  apply.onclick=()=>{
   if(!target.isConnected || read()!==original || target.disabled || target.readOnly || (!field && !target.isContentEditable)){status.textContent='원문 또는 입력창 상태가 바뀌었습니다. 닫고 다시 교정해 주세요.';apply.disabled=true;return;}
   const blocked=protectionError();if(blocked){status.textContent=blocked;return;}
   if(!after.value.trim()){status.textContent='수정문이 비어 있습니다.';return;}
   const value=selected?original.slice(0,start)+after.value+original.slice(end):after.value;
   if(field && target.maxLength>=0 && value.length>target.maxLength){status.textContent='입력창의 최대 글자 수를 초과했습니다.';return;}
   // Close the modal before focusing the target, otherwise the page is inert.
   dialog.close();target.focus();
   if(field){
    const proto=target instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(target,value);
    target.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'insertReplacementText',data:after.value}));
    target.dispatchEvent(new Event('change',{bubbles:true}));
    if(target.setSelectionRange && !['url','tel'].includes(target.type)){const pos=selected?start+after.value.length:value.length;target.setSelectionRange(pos,pos);}
   }else{
    const range=document.createRange();range.selectNodeContents(target);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    if(!document.execCommand('insertText',false,value)){dialog.showModal();status.textContent='이 편집기는 적용을 지원하지 않습니다. 수정문을 복사해 주세요.';return;}
   }
   host?.remove();host=null;
   if(read()===value)offerUndo(target,field,original,value);
  };
 }

 function offerUndo(target,field,original,applied){
  undoHost?.remove();
  const notice=document.createElement('div');undoHost=notice;
  const shadow=notice.attachShadow({mode:'closed'});
  shadow.innerHTML=`<style>:host{all:initial;position:fixed;bottom:24px;right:24px;z-index:2147483647}div{max-width:380px;padding:14px;background:#24314b;color:white;border-radius:12px;font:14px/1.5 system-ui;box-shadow:0 4px 24px #0004}button{margin:8px 6px 0 0;padding:7px 12px;cursor:pointer;border:0;border-radius:6px}</style><div role="status"><span>입력창에 적용했습니다.</span><br><button id="undo">되돌리기</button><button id="dismiss">닫기</button></div>`;
  document.documentElement.append(notice);
  const appliedHTML=field?null:target.innerHTML;
  shadow.querySelector('#dismiss').onclick=()=>notice.remove();
  shadow.querySelector('#undo').onclick=()=>{
   const unchanged=field?target.value===applied:target.isContentEditable && target.innerText===applied && target.innerHTML===appliedHTML;
   if(!target.isConnected || target.disabled || target.readOnly || !unchanged){shadow.querySelector('span').textContent='입력창이 바뀌어 되돌릴 수 없습니다. 새로 작성한 내용은 유지됩니다.';shadow.querySelector('#undo').disabled=true;return;}
   target.focus();
   if(field){
    const proto=target instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(target,original);
    target.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'historyUndo',data:null}));
    target.dispatchEvent(new Event('change',{bubbles:true}));
   }else{
    const range=document.createRange();range.selectNodeContents(target);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    if(!document.execCommand('insertText',false,original)){shadow.querySelector('span').textContent='이 편집기는 되돌리기를 지원하지 않습니다.';return;}
   }
   notice.remove();if(undoHost===notice)undoHost=null;
  };
 }

 function installReviewButtons(){
  if(location.origin!=='https://maadm.okpos.co.kr:8090' || !/^\/bizchatRegularCmpnReview\/form\/\d+\/?$/.test(location.pathname))return;
  const titles=['우리 가게를 소개하는 내용','사장님께서 하고 싶으신 말씀'];
  const owned=new WeakSet();
  const style=document.createElement('style');
  style.textContent='.gemini-review-control{display:flex;align-items:center;gap:8px;width:100%}.gemini-review-control>input,.gemini-review-control>textarea{flex:1;min-width:0;width:auto}.gemini-review-control>.gemini-review-button{flex:none;border:1px solid #485bd7;border-radius:4px;background:#485bd7;color:#fff;padding:6px 10px;font:600 12px/1.4 system-ui;white-space:nowrap;cursor:pointer}.gemini-review-button:disabled{opacity:.45;cursor:not-allowed}.gemini-review-button:focus-visible{outline:3px solid #9eafff;outline-offset:2px}';
  document.head.append(style);
  function scan(){
   for(const row of document.querySelectorAll('#variableForm .bizchat-regular-review-variable tr')){
    const label=row.querySelector('th')?.textContent.replace(/\s+/g,' ').trim() || '';
    const title=titles.find(t=>label.startsWith(t));
    if(!title)continue;
    const input=row.querySelector('td input[type="text"],td textarea');
    if(!input)continue;
    let button=row.querySelector('.gemini-review-button');
    if(button && !owned.has(button))continue;
    if(!button){
     let wrap=input.closest('.gemini-review-control');
     if(!wrap){wrap=document.createElement('div');wrap.className='gemini-review-control';input.before(wrap);wrap.append(input);}
     button=document.createElement('button');button.type='button';button.className='gemini-review-button';button.textContent='검사';button.setAttribute('aria-label',title+' 검사');
     button.title='이 입력칸 전체 문구를 Gemini로 교정하고 미리보기';
     button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open(input);});owned.add(button);wrap.append(button);
    }
    const disabled=input.disabled || input.readOnly;
    if(button.disabled!==disabled)button.disabled=disabled;
   }
  }
  scan();
  const form=document.querySelector('#variableForm');
  if(form)new MutationObserver(scan).observe(form,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','readonly']});
 }
})();
