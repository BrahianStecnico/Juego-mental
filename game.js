const images=["assets/gargola-astar.webp", "assets/gargola-bruma.webp", "assets/gargola-cuervo.webp", "assets/gargola-dalia.webp", "assets/gargola-ebano.webp", "assets/gargola-fauce.webp"];
const names=["ASTAR","BRUMA","CUERVO","DALIA","ÉBANO","FAUCE"];
const ids=["A","B","C","D","E","F"];
let puzzle,order=[],failures=0,hints=0,solved=false,locked=false,selected=null;
const $=s=>document.querySelector(s);
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function buildPuzzle(){
 // A statement is either "key is behind X or Y" or its negation.
 // Search for a puzzle with one unique location yielding exactly three true statements.
 for(let tries=0;tries<50000;tries++){
  const key=ids[Math.floor(Math.random()*6)],pool=[];
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){pool.push({set:[ids[i],ids[j]],neg:false},{set:[ids[i],ids[j]],neg:true})}
  const statements=shuffle(pool).slice(0,6);
  const truthAt=k=>statements.map(s=>s.neg?!s.set.includes(k):s.set.includes(k));
  const solutions=ids.filter(k=>truthAt(k).filter(Boolean).length===3);
  if(solutions.length===1&&solutions[0]===key)return {key,statements,truth:truthAt(key)};
 }
 // Fallback validado: C es la única ubicación que produce exactamente 3 declaraciones verdaderas.
 const statements=[{set:["A","B"],neg:false},{set:["A","B"],neg:true},{set:["A","C"],neg:false},{set:["A","D"],neg:false},{set:["A","E"],neg:false},{set:["B","C"],neg:false}];
 const key="C";return {key,statements,truth:statements.map(s=>s.neg?!s.set.includes(key):s.set.includes(key))};
}
function statement(s){const n=s.set.map(id=>names[ids.indexOf(id)].toLowerCase());return s.neg?`La llave NO está detrás de ${n[0]} ni de ${n[1]}.`:`La llave está detrás de ${n[0]} o de ${n[1]}.`}
function newGame(){
 puzzle=buildPuzzle();failures=0;hints=0;solved=false;locked=false;selected=null;
 const shuffledNames=shuffle(ids),shuffledStatements=shuffle(puzzle.statements);
 order=shuffledNames.map((id,i)=>({id,name:names[ids.indexOf(id)],img:images[ids.indexOf(id)],claim:shuffledStatements[i]}));
 $('#grid').innerHTML=order.map((g,i)=>`<button class="demon" data-id="${g.id}" aria-label="Ver declaración de ${g.name}"><span class="badge">Gárgola ${i+1}</span><span class="keymark">🔑</span><img src="${g.img}" alt="${g.name}" loading="eager"><span class="name">${g.name}</span><span class="tap">Toca para escuchar su declaración ↗</span></button>`).join('');
 document.querySelectorAll('.demon').forEach(b=>b.addEventListener('click',()=>openDemon(b.dataset.id)));
 $('#feedback').className='feedback';$('#feedback').textContent='';$('#hint').disabled=false;$('#hint').textContent='Pista (0/2)';updateStats();
}
function openDemon(id){
 if(locked||solved)return;
 selected=order.find(g=>g.id===id);
 $('#modalImage').src=selected.img;$('#modalImage').alt=selected.name;
 $('#modalName').textContent=selected.name;
 $('#modalSub').textContent='Declaración tallada en piedra';
 $('#modalStatement').textContent='«'+statement(selected.claim)+'»';
 $('#modalTruth').textContent='No revelaremos todavía si esta gárgola dice la verdad o miente. Compara su frase con las demás.';
 $('#choose').disabled=false;
 $('#overlay').classList.add('open');
}
function closeModal(){$('#overlay').classList.remove('open')}
function guess(id){
 if(locked||solved)return;
 closeModal();
 if(id===puzzle.key){
  solved=true;const g=order.find(x=>x.id===id);
  document.querySelector(`[data-id="${id}"]`).classList.add('correct');
  $('#feedback').className='feedback show good';
  $('#feedback').innerHTML=`<strong>¡Correcto! La llave aparece detrás de ${g.name} 🔑</strong><br>Has encontrado la única ubicación compatible con exactamente tres declaraciones verdaderas y tres falsas. ¡La salida está abierta!`;
  document.querySelectorAll('.demon').forEach(b=>b.disabled=true);$('#hint').disabled=true;
 }else{
  failures++;
  if(failures>=3){locked=true;$('#feedback').className='feedback show bad';$('#feedback').innerHTML='<strong>La torre se ha cerrado: has agotado los 3 intentos.</strong><br>Pulsa «Nueva partida» para generar otro acertijo.';document.querySelectorAll('.demon').forEach(b=>b.disabled=true);$('#hint').disabled=true}
  else{$('#feedback').className='feedback show bad';$('#feedback').textContent=`No es esa gárgola. Te quedan ${3-failures} ${3-failures===1?'intento':'intentos'}. Vuelve a examinar las declaraciones.`}
 }
 updateStats();
}
function updateStats(){$('#stats').textContent=`Fallos: ${failures}/3 · Pistas: ${hints}/2`;
 $('#hint').textContent=`Pista (${hints}/2)`;$('#hint').disabled=locked||solved||hints>=2;$('#choose').disabled=locked||solved}
$('#choose').addEventListener('click',()=>{if(selected)guess(selected.id)});
$('#close').addEventListener('click',closeModal);$('#dismiss').addEventListener('click',closeModal);
$('#overlay').addEventListener('click',e=>{if(e.target===$('#overlay'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
$('#reset').addEventListener('click',newGame);
$('#hint').addEventListener('click',()=>{
 if(locked||solved||hints>=2)return;
 hints++;
 const msg=[
 'Pista 1: interpreta cada frase literalmente. «La llave está detrás de X o de Y» es verdadera si está detrás de al menos una de esas dos gárgolas. «No está detrás de X ni de Y» solo es verdadera si no está detrás de ninguna de las dos.',
 'Pista 2: prueba mentalmente cada una de las seis gárgolas como posible escondite. Para cada candidata, evalúa las seis declaraciones y cuenta las verdaderas. Descarta cualquier candidata que no produzca exactamente tres verdades; la solución debe ser la única que sí lo consiga.'
 ];
 $('#feedback').className='feedback show hint';$('#feedback').textContent=msg[hints-1];
 updateStats();
});
newGame();
