/* Aula IA v4: visual cues and step-synchronized teaching controls */
(()=>{'use strict';const $=id=>document.getElementById(id);const board=$('board'),content=$('boardContent');
const bar=document.createElement('div');bar.className='v4bar';bar.innerHTML=`<button id="v4Explain">▶ Explicar y revelar</button><button id="v4Pause">■ Parar voz</button><button id="v4Visual">✧ Señalar operación</button><button id="v4ClearVisual">Borrar marcas</button><button id="v4BoardFull">⛶ Solo pizarra</button><label>Trazo <select id="v4Stroke"><option value="gold">Dorado</option><option value="cyan">Azul</option><option value="pink">Rosa</option></select></label><span id="v4Notice" role="status"></span>`;$('cuePanel').before(bar);
const note=document.createElement('p');note.className='v4note';note.textContent='Versión 4: anotaciones visuales no destructivas, lectura de subpasos y avance coordinado. No es conversación con IA ni escritura manuscrita generada.';bar.after(note);note.hidden=true;
const svgNS='http://www.w3.org/2000/svg';const layer=document.createElementNS(svgNS,'svg');layer.setAttribute('id','v4Marks');layer.setAttribute('aria-hidden','true');board.append(layer);let marks=[],lastKey='',playing=false;
function bounds(){const r=board.getBoundingClientRect();layer.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);return r}
function make(tag,attrs){const e=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));layer.append(e);return e}
function mark(){const items=[...content.querySelectorAll('.math')];const el=items.at(-1);if(!el)return;const br=bounds(),r=el.getBoundingClientRect();const x=r.left-br.left,y=r.top-br.top,w=Math.min(r.width,br.width-30),h=r.height;const col={gold:'#f4cf75',cyan:'#7bd9ef',pink:'#f1a2d6'}[$('v4Stroke').value];const n=make('rect',{x:x-6,y:y-4,width:w+12,height:h+8,rx:9,fill:'none',stroke:col,'stroke-width':2.5,'stroke-dasharray':'9 5',class:'v4Mark'});marks.push(n);const c=make('path',{d:`M ${Math.max(8,x-18)} ${y+h/2} l -12 -9 m 12 9 l -12 9`,fill:'none',stroke:col,'stroke-width':3,class:'v4Mark'});marks.push(c);$('v4Notice').textContent='Operación señalada';}
function clear(){marks.forEach(n=>n.remove());marks=[];}
$('v4Visual').onclick=mark;$('v4ClearVisual').onclick=clear;
$('v4BoardFull').onclick=()=>{if(document.fullscreenElement===board){document.exitFullscreen?.()}else{board.requestFullscreen?.()}};
$('v4Pause').onclick=()=>{playing=false;window.speechSynthesis?.cancel();$('v4Notice').textContent='Narración detenida'};
function speak(text,done){if(!('speechSynthesis'in window)){done?.();return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=Number($('v3Rate')?.value||.9);u.onend=()=>{if(playing)done?.()};u.onerror=()=>{playing=false};speechSynthesis.speak(u)}
function explain(){if(playing)return;playing=true;const reveal=$('reveal');if(!reveal.disabled)reveal.click();lastKey=$('counter').textContent;clear();mark();const txt=$('cuePanel')?.querySelector('p')?.textContent||$('scriptText').textContent;$('v4Notice').textContent='Narrando subpaso';speak(txt,()=>{playing=false;$('v4Notice').textContent='Subpaso explicado'});}
$('v4Explain').onclick=explain;
// Clear temporary marks when the lesson changes, while retaining teacher's manual ink.
const observer=new MutationObserver(()=>{const key=$('counter').textContent;if(key!==lastKey){lastKey=key;clear();}});observer.observe($('counter'),{childList:true,characterData:true,subtree:true});
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='m'){e.preventDefault();mark()}if(e.key==='Escape'){clear()}});
})();
