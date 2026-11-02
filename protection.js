(()=>{
 const tokens=text=>text.match(/https?:\/\/[^\s<>]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\$?\{[^{}\n]+\}|\[[^\[\]\n]+\]|\d+(?:[.,:/-]\d+)*/g)||[];
 const normalize=terms=>Array.isArray(terms)?[...new Set(terms.filter(t=>typeof t==='string').map(t=>t.trim()).filter(Boolean))].slice(0,50):[];
 const count=(text,term)=>text.split(term).length-1;
 const check=(before,after,terms=[])=>{
  if(JSON.stringify(tokens(before))!==JSON.stringify(tokens(after)))return '변수·숫자·연락처·주소가 변경되었습니다. 원문과 동일하게 복원한 뒤 적용해 주세요.';
  if(normalize(terms).some(term=>count(before,term)!==count(after,term)))return '보호할 단어가 변경되었습니다. 상호명 등을 원문과 동일하게 복원해 주세요.';
  return '';
 };
 globalThis.MrSohnProtection={check,normalize};
})();
