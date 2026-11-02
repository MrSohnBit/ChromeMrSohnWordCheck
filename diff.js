// Grapheme-aware character differences; no HTML interpretation of user/model text.
globalThis.MrSohnWordDiff = function(before, after) {
 const segmenter=new Intl.Segmenter('ko',{granularity:'grapheme'});
 const split=s=>Array.from(segmenter.segment(s),part=>part.segment);
 const a=split(before),b=split(after);
 let prefix=0,suffix=0;
 while(prefix<a.length && prefix<b.length && a[prefix]===b[prefix])prefix++;
 while(suffix<a.length-prefix && suffix<b.length-prefix && a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;
 const x=a.slice(prefix,a.length-suffix),y=b.slice(prefix,b.length-suffix);
 const left=[],right=[];
 const push=(arr,text,changed)=>{if(!text)return;const last=arr.at(-1);if(last && last.changed===changed)last.text+=text;else arr.push({text,changed});};
 const common=a.slice(0,prefix).join('');push(left,common,false);push(right,common,false);
 // Bound memory/latency for entirely rewritten long passages.
 if(x.length*y.length>2000000){push(left,x.join(''),true);push(right,y.join(''),true);}
 else {
  const stride=y.length+1,table=new Uint16Array((x.length+1)*stride);
  for(let i=x.length-1;i>=0;i--)for(let j=y.length-1;j>=0;j--)table[i*stride+j]=x[i]===y[j]?1+table[(i+1)*stride+j+1]:Math.max(table[(i+1)*stride+j],table[i*stride+j+1]);
  let i=0,j=0;
  while(i<x.length || j<y.length){
   if(i<x.length && j<y.length && x[i]===y[j]){push(left,x[i],false);push(right,y[j],false);i++;j++;}
   else if(j<y.length && (i===x.length || table[i*stride+j+1]>=table[(i+1)*stride+j]))push(right,y[j++],true);
   else push(left,x[i++],true);
  }
 }
 const tail=suffix?a.slice(a.length-suffix).join(''):'';push(left,tail,false);push(right,tail,false);
 return {before:left,after:right};
};
