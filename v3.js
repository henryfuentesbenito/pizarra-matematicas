/* Aula IA v3 — controlled lesson cues, object editor and improved visual reveal. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const board=$('board'), content=$('boardContent');
const stage=document.createElement('div');stage.id='objectStage';board.append(stage);
const cue=document.createElement('section');cue.id='cuePanel';cue.setAttribute('aria-live','polite');$('board').after(cue);
const strip=document.createElement('div');strip.className='v3strip';strip.innerHTML=`<button id="v3Cue">🎙 Narrar subpaso</button><button id="v3Add">＋ Objeto matemático</button><button id="v3Select">↖ Seleccionar objetos</button><button id="v3Erase">⌫ Borrar objeto</button><button id="v3Clear">Limpiar objetos</button><label class="compact">Velocidad voz <input id="v3Rate" type="range" min="0.65" max="1.2" step="0.05" value="0.9"></label><span id="v3Status" role="status"></span>`;
cue.after(strip);cue.hidden=true;strip.hidden=true;
const help=document.createElement('p');help.className='v3help';help.textContent='Objetos: arrastra para mover · doble clic para editar · Supr para eliminar el seleccionado. Narrar subpaso lee una indicación breve; Leer guion reproduce el guion completo. La voz es sintética, no una conversación con IA.';strip.after(help);help.hidden=true;
let selected=null,mode='select',storeTimer=null;
const cues=lessonCues;
function cueText(){const idx=Math.min(revealed-1,(cues[current]||[]).length-1);return (cues[current]||[])[Math.max(0,idx)]||lessons[current][3]}
function updateCue(){cue.innerHTML='';const k=document.createElement('div');k.className='cueKicker';k.textContent=`PASO ${current+1} · SUBPASO ${revealed}/${lessons[current][2].length}`;const p=document.createElement('p');p.textContent=cueText();cue.append(k,p);$('v3Status').textContent=`${stage.children.length} objetos en pizarra`;
 // Make changes visible as new visual elements, instead of replacing the whole screen.
 const all=[...content.querySelectorAll('.math')];all.forEach((node,i)=>{node.classList.toggle('v3Newest',i===all.length-1)});
}
const baseRender=render;render=function(){baseRender();updateCue()};
function speakCue(){if(!('speechSynthesis' in window)){alert('Tu navegador no permite voz sintética.');return}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(cueText());utterance.lang='es-ES';utterance.rate=Number($('v3Rate').value);speechSynthesis.speak(utterance)}
$('v3Cue').addEventListener('click',speakCue);
// Coordinate-based movable objects, saved independently of the lesson.
function persist(){clearTimeout(storeTimer);storeTimer=setTimeout(()=>{try{localStorage.setItem('aula-proporcionalidad-v3-objects',JSON.stringify([...stage.children].map(n=>({tex:n.dataset.tex,x:parseFloat(n.style.left),y:parseFloat(n.style.top)}))))}catch(e){}},100)}
function deselect(){if(selected)selected.classList.remove('selected');selected=null}
function add(tex,x=45,y=85){if(!tex)return;const node=document.createElement('div');node.className='mathObject';node.tabIndex=0;node.dataset.tex=tex;node.style.left=x+'px';node.style.top=y+'px';draw(node);stage.append(node);node.addEventListener('pointerdown',e=>{if(mode==='erase'){node.remove();persist();return}deselect();selected=node;node.classList.add('selected');const sx=e.clientX,sy=e.clientY,ox=parseFloat(node.style.left),oy=parseFloat(node.style.top);node.setPointerCapture(e.pointerId);const move=ev=>{const r=board.getBoundingClientRect();node.style.left=Math.max(0,Math.min(r.width-40,ox+ev.clientX-sx))+'px';node.style.top=Math.max(0,Math.min(r.height-40,oy+ev.clientY-sy))+'px'};const up=()=>{node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',up);persist()};node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',up)});node.addEventListener('dblclick',()=>{const t=prompt('Editar LaTeX:',node.dataset.tex);if(t!==null&&t.trim()){node.dataset.tex=t.trim();draw(node);persist()}});node.addEventListener('keydown',e=>{if(e.key==='Delete'||e.key==='Backspace'){node.remove();deselect();persist()}});persist();return node}
function draw(node){node.textContent=node.dataset.tex;if(window.MathJax?.tex2svg){try{node.replaceChildren(MathJax.tex2svg(node.dataset.tex,{display:false}))}catch(e){node.textContent=node.dataset.tex}}else MathJax.startup.promise.then(()=>{if(node.isConnected)draw(node)})}
$('v3Add').onclick=()=>{const tex=prompt('Fórmula LaTeX (ejemplo: \\frac{8}{x+2}):','\\frac{8}{x+2}');if(tex&&tex.trim())add(tex.trim(),40,85+stage.children.length*45)};
$('v3Select').onclick=()=>{mode='select';$('v3Select').classList.add('active');$('v3Erase').classList.remove('active')};
$('v3Erase').onclick=()=>{mode='erase';$('v3Erase').classList.add('active');$('v3Select').classList.remove('active')};
$('v3Clear').onclick=()=>{if(confirm('¿Eliminar todos los objetos matemáticos de la pizarra principal?')){stage.replaceChildren();deselect();persist();updateCue()}};
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(selected&&(e.key==='Delete'||e.key==='Backspace')){selected.remove();deselect();persist()}});
try{const saved=JSON.parse(localStorage.getItem('aula-proporcionalidad-v3-objects')||'[]');if(Array.isArray(saved))saved.slice(0,150).forEach(o=>{if(typeof o.tex==='string'&&o.tex.length<2000)add(o.tex,Number(o.x)||0,Number(o.y)||0)})}catch(e){}
// Save/restore v3 objects alongside the existing v2 session file.
$('saveSession').addEventListener('click',(event)=>{event.stopImmediatePropagation();const data={version:3,current,revealed,free:window.aulaFree.exportActions(),formulas:[...document.querySelectorAll('.formula-chip')].map(n=>({raw:n.dataset.raw,x:n.offsetLeft,y:n.offsetTop})),objects:[...stage.children].map(n=>({tex:n.dataset.tex,x:parseFloat(n.style.left),y:parseFloat(n.style.top)}))};const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='aula-proporcionalidad-v3-sesion.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)},true);
// A separate v3 restore avoids conflict with the v2-only import button.
const restore=document.createElement('button');restore.textContent='↥ Importar sesión v3';$('loadSession').after(restore);restore.onclick=()=>{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{const d=JSON.parse(await input.files[0].text());if(d.version!==3||!Array.isArray(d.objects)||!Array.isArray(d.free))throw Error('No es una sesión v3 válida');current=Math.min(lessons.length-1,Math.max(0,Number(d.current)||0));revealed=Math.min(lessons[current][2].length,Math.max(1,Number(d.revealed)||1));render();window.aulaFree.importActions(d.free);stage.replaceChildren();d.objects.slice(0,150).forEach(o=>add(String(o.tex).slice(0,2000),Number(o.x)||0,Number(o.y)||0));$('freePanel').classList.remove('hidden');persist()}catch(e){alert('Error al importar: '+e.message)}};input.click()};
// Disable the old v2 export to prevent simultaneous duplicate downloads; use v3 export.
$('saveSession').onclick=null;
updateCue();
})();
