/* Aula IA v2: progressive typesetting, voice, playback, persistence and formula notes. */
(()=>{
'use strict';
const el=id=>document.getElementById(id);
let zoom=1, timer=null, speaking=false;
const originalRender=render;
const lessonTex=lessonCards.map(cs=>cs.map(c=>c.kind==='math'?c.value:null));
function typeset(){document.querySelectorAll("#boardContent .math").forEach((n,i)=>{const t=lessonTex[current][i];if(!t){n.classList.add("prose-line");return}n.classList.add("formula-line");if(window.MathJax?.tex2svg){try{n.replaceChildren(MathJax.tex2svg(t,{display:true}));}catch(e){console.warn("Fórmula",current,i,e)}}else{MathJax.startup.promise.then(()=>{if(n.isConnected)n.replaceChildren(MathJax.tex2svg(t,{display:true}))});}})}
function inlineMath(){const pattern=/(?:\d+|[xy])\s*\/\s*(?:\d+|[xy])|(?:\d+(?:,\d+)?|[xy])(?:\s*[×÷=+−]\s*(?:\d+(?:,\d+)?|[xy]))+/g;const roots=[...document.querySelectorAll('#boardContent .prose-line')];const run=()=>{for(const root of roots.filter(n=>n.isConnected)){if(root.dataset.mathDone)continue;root.dataset.mathDone='1';const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('mjx-container, svg, math, .inline-math'))nodes.push(n);}for(const n of nodes){const raw=n.nodeValue;pattern.lastIndex=0;let m,last=0;const frag=document.createDocumentFragment();while((m=pattern.exec(raw))){frag.append(raw.slice(last,m.index));let t=m[0].replace(/(\w+)\s*\/\s*(\w+)/g,'\\frac{$1}{$2}').replaceAll('×','\\times ').replaceAll('÷','\\div ').replaceAll('−','-').replace(/(\d),(\d)/g,'$1{,}$2');try{frag.append(MathJax.tex2svg(t,{display:false}));}catch{frag.append(m[0])}last=pattern.lastIndex;}if(last){frag.append(raw.slice(last));n.replaceWith(frag)}}}};if(window.MathJax?.tex2svg)run();else MathJax.startup.promise.then(run)}
function savePosition(){try{localStorage.setItem('aula-proporcionalidad-v2-progress',JSON.stringify({current,revealed}))}catch(e){}}
render=function(){originalRender();typeset();inlineMath();savePosition()};
function stopAuto(){if(timer){clearInterval(timer);timer=null}el('playAuto').textContent='▶ Auto'}
function autoTick(){if(revealed<lessons[current][2].length)el('reveal').click();else if(current<lessons.length-1){current++;revealed=1;render();}else stopAuto()}
el('playAuto').onclick=()=>{if(timer){stopAuto();return}el('playAuto').textContent='⏸ Pausar';timer=setInterval(autoTick,Number(el('autoSpeed').value))};
el('autoSpeed').onchange=()=>{if(timer){stopAuto();el('playAuto').click()}};
el('zoomIn').onclick=()=>setZoom(zoom+.1);el('zoomOut').onclick=()=>setZoom(zoom-.1);
function setZoom(v){zoom=Math.max(.7,Math.min(1.6,Math.round(v*10)/10));el('boardContent').style.zoom=String(zoom);el('zoomLabel').textContent=Math.round(zoom*100)+'%'}
function stopVoice(){if('speechSynthesis'in window)window.speechSynthesis.cancel();speaking=false;el('speak').textContent='🔊 Leer guion'}
el('stopSpeak').onclick=stopVoice;
el('speak').onclick=()=>{if(!('speechSynthesis'in window)){alert('Este navegador no admite síntesis de voz.');return}stopVoice();const u=new SpeechSynthesisUtterance(el('scriptText').textContent);u.lang='es-ES';u.rate=.9;u.onend=()=>{speaking=false;el('speak').textContent='🔊 Leer guion'};u.onerror=u.onend;window.speechSynthesis.speak(u);speaking=true;el('speak').textContent='🔊 Reproduciendo…'};
for(const id of ['prev','next','reset'])el(id).addEventListener('click',()=>{stopVoice();stopAuto()});
const formulas=[];
function addFormula(raw,x=8,y=8){if(!raw)return;const d=document.createElement('div');d.className='formula-chip';d.style.left=x+'px';d.style.top=y+'px';d.title='Arrastrar para mover · doble clic para eliminar';d.dataset.raw=raw;
 try{if(window.MathJax?.tex2svg)d.replaceChildren(MathJax.tex2svg(raw,{display:false}));else MathJax.startup.promise.then(()=>{if(d.isConnected)d.replaceChildren(MathJax.tex2svg(raw,{display:false}))})}catch(e){d.textContent=raw}
 d.addEventListener('dblclick',()=>{d.remove();storeFormulas()});let pointer=null;
 d.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,l:d.offsetLeft,t:d.offsetTop};d.setPointerCapture(e.pointerId)});
 d.addEventListener('pointermove',e=>{if(!pointer)return;d.style.left=Math.max(0,pointer.l+e.clientX-pointer.x)+'px';d.style.top=Math.max(0,pointer.t+e.clientY-pointer.y)+'px'});
 d.addEventListener('pointerup',()=>{pointer=null;storeFormulas()});el('formulaOverlay').append(d);storeFormulas()}
function storeFormulas(){try{localStorage.setItem('aula-proporcionalidad-v2-formulas',JSON.stringify([...document.querySelectorAll('.formula-chip')].map(d=>({raw:d.dataset.raw,x:d.offsetLeft,y:d.offsetTop}))))}catch(e){}}
el('formulaBtn').onclick=()=>{el('freePanel').classList.remove('hidden');let raw=prompt('Introduce una fórmula LaTeX (por ejemplo: \\frac{x^2+1}{x-2})');if(raw)addFormula(raw)};
function snapshot(){return{version:2,current,revealed,free:window.aulaFree.exportActions(),formulas:[...document.querySelectorAll('.formula-chip')].map(d=>({raw:d.dataset.raw,x:d.offsetLeft,y:d.offsetTop}))}}
el('saveSession').onclick=()=>{const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='aula-ia-sesion.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
el('loadSession').onclick=()=>{const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=async()=>{try{let data=JSON.parse(await inp.files[0].text());if(data.version!==2||!Array.isArray(data.free)||!Array.isArray(data.formulas))throw Error('Formato de sesión no compatible');current=Math.max(0,Math.min(lessons.length-1,Number(data.current)||0));revealed=Math.max(1,Math.min(lessons[current][2].length,Number(data.revealed)||1));render();window.aulaFree.importActions(data.free);el('formulaOverlay').replaceChildren();data.formulas.forEach(f=>addFormula(String(f.raw),Number(f.x)||0,Number(f.y)||0));el('freePanel').classList.remove('hidden')}catch(e){alert('No se pudo recuperar la sesión: '+e.message)}};inp.click()};
let saveTimer;const canvas=el('freeCanvas');const persist=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem('aula-proporcionalidad-v2-ink',JSON.stringify(window.aulaFree.exportActions()))}catch(e){}},350)};
canvas.addEventListener('pointerup',persist);canvas.addEventListener('pointercancel',persist);
for(const id of ['undo','redo','clear'])el(id).addEventListener('click',persist);
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT','SUMMARY'].includes(document.activeElement.tagName)||document.activeElement.closest('#steps'))return;if(e.ctrlKey&&e.key.toLowerCase()==='z'){e.preventDefault();window.aulaFree.undo();persist();return}if(e.key==='ArrowRight'){e.preventDefault();el('next').click()}if(e.key==='ArrowLeft'){e.preventDefault();el('prev').click()}if(e.code==='Space'){e.preventDefault();el('reveal').click()}});
try{const ink=JSON.parse(localStorage.getItem('aula-proporcionalidad-v2-ink')||'[]');if(Array.isArray(ink))window.aulaFree.importActions(ink);const saved=JSON.parse(localStorage.getItem('aula-proporcionalidad-v2-progress')||'null');if(saved&&Number.isInteger(saved.current)&&saved.current>=0&&saved.current<lessons.length){current=saved.current;revealed=Math.max(1,Math.min(lessons[current][2].length,saved.revealed||1))}const stored=JSON.parse(localStorage.getItem('aula-proporcionalidad-v2-formulas')||'[]');if(Array.isArray(stored))stored.forEach(f=>addFormula(f.raw,f.x,f.y))}catch(e){console.warn('No se pudo restaurar el progreso local',e)}
render();
})();
