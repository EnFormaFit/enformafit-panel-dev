// ═══ RUTINAS EDITOR ═══
function getRut(cliId,sem,dia){
  if(!RUTINAS[cliId])RUTINAS[cliId]={__logs:{}};
  if(!RUTINAS[cliId].__logs)RUTINAS[cliId].__logs={};
  // Check if this semana has an override
  if(RUTINAS[cliId][sem]&&RUTINAS[cliId][sem][dia]!==undefined){
    return RUTINAS[cliId][sem][dia];
  }
  // No override for this semana — use rutina_base (same for all weeks)
  const c=byId(cliId);
  const base=c&&c.rutinaBase?c.rutinaBase:c&&c.rutinaDias?c.rutinaDias:null;
  const ejBase=base&&base[String(dia)]!==undefined?base[String(dia)]:EJ_DEF[dia]||[];
  // Cache it so edits work
  if(!RUTINAS[cliId][sem])RUTINAS[cliId][sem]={};
  RUTINAS[cliId][sem][dia]=JSON.parse(JSON.stringify(ejBase));
  return RUTINAS[cliId][sem][dia];
}
// Flag to block ejSave briefly after structural changes (add/del)
let _blockEjSave=false;

// Patch ej-list DOM directly (no re-render — preserves scroll, focus, undo stack)
function patchEjList(){
  const ejList=document.getElementById('ej-list');
  if(ejList){
    const ejes=getRut(RUT_CLI,RUT_SEM,RUT_DIA);
    ejList.innerHTML=ejes.map((ej,ei)=>ejRow(ej,ei)).join('');
    return true;
  }
  return false;
}
// Full re-render fallback only when ej-list doesn't exist
function rutRedo(){
  if(!REDO_RUT.length){toast('Nada que rehacer','');return;}
  const s=REDO_RUT.pop();
  if(RUT_CLI)UNDO_RUT.push({cli:RUT_CLI,sem:RUT_SEM,dia:RUT_DIA,data:JSON.stringify(RUTINAS[RUT_CLI]||{})});
  RUTINAS[s.cli]=JSON.parse(s.data);
  RUT_SEM=s.sem;RUT_DIA=s.dia;
  toast('↪ Rehecho ('+(REDO_RUT.length)+' más)','vd');
  rutRefresh();
}

function rutRefresh(){
  if(!patchEjList()){
    if(VIEW==='client')setTab('entreno');else render();
  }
}

// Log a completed set for an exercise (called from future client app sync)
function logEj(cliId,ejNom,sem,vals){
  if(!RUTINAS[cliId])RUTINAS[cliId]={};
  if(!RUTINAS[cliId].__logs)RUTINAS[cliId].__logs={};
  if(!RUTINAS[cliId].__logs[ejNom])RUTINAS[cliId].__logs[ejNom]=[];
  const logs=RUTINAS[cliId].__logs[ejNom];
  // Replace if same sem, else add
  const idx=logs.findIndex(l=>l.sem===sem);
  if(idx>=0)logs[idx].vals=vals;
  else logs.push({sem,vals});
  // Keep last 12 sessions only
  if(logs.length>12)logs.shift();
}

// UNDO: push snapshot before ANY change
function rutPush(){
  if(!RUT_CLI)return;
  UNDO_RUT.push({cli:RUT_CLI,sem:RUT_SEM,dia:RUT_DIA,
    data:JSON.stringify(RUTINAS[RUT_CLI]||{})});
  if(UNDO_RUT.length>UNDO_MAX)UNDO_RUT.shift();
  REDO_RUT.length=0; // clear redo on new action
}
function rutUndo(){
  if(!UNDO_RUT.length){toast('Nada más que deshacer','');return;}
  const s=UNDO_RUT.pop();
  // Save current state to redo
  if(RUT_CLI)REDO_RUT.push({cli:RUT_CLI,sem:RUT_SEM,dia:RUT_DIA,data:JSON.stringify(RUTINAS[RUT_CLI]||{})});
  const restored=JSON.parse(s.data);
  // Clean up semanas where ALL days are empty arrays (artifacts from old pre-population)
  Object.keys(restored).forEach(k=>{
    if(k==='__logs')return;
    const sem=restored[k];
    if(typeof sem==='object'&&!Array.isArray(sem)){
      const days=Object.values(sem);
      const allEmpty=days.length>0&&days.every(d=>Array.isArray(d)&&d.length===0);
      if(allEmpty)delete restored[k];
    }
  });
  RUTINAS[s.cli]=restored;
  RUT_SEM=s.sem;RUT_DIA=s.dia;
  toast('↩ Deshecho ('+(UNDO_RUT.length)+' más)','vd');
  rutRefresh();
}

// Global Ctrl+Z: routes to correct undo based on active tab
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){
    e.preventDefault();
    const activeNutInp=document.activeElement?.dataset?.cli&&document.activeElement?.dataset?.meal?document.activeElement:null;
    if(activeNutInp)nutSave(activeNutInp);
    if(CLI_TAB==='revision')medUndo();
    else if(CLI_TAB==='editar')editUndo();
    else if(CLI_TAB==='nutricion'||UNDO_NUT.length>0&&!UNDO_RUT.length){
      if(UNDO_NUT.length)nutUndo();else toast('Nada que deshacer','');
    } else {
      if(UNDO_RUT.length)rutUndo();else toast('Nada que deshacer','');
    }
  }
  // Ctrl+Y or Ctrl+Shift+Z = redo
  if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){
    e.preventDefault();
    if(CLI_TAB==='revision')medRedo();
    else if(CLI_TAB==='editar')editRedo();
    else if(CLI_TAB==='nutricion'){
      if(REDO_NUT&&REDO_NUT.length)nutRedo();else toast('Nada que rehacer','');
    } else {
      if(REDO_RUT.length)rutRedo();else toast('Nada que rehacer','');
    }
  }
});

function rRutinas(){
  const c=RUT_CLI?byId(RUT_CLI):null;
  const opts=C.map(x=>`<option value="${x.id}" ${RUT_CLI===x.id?'selected':''}>${x.nom} (${x.tipo==='uno'?'1:1':'Prog'} S${x.semana}/${x.semTotal})</option>`).join('');
  const selH=`<select style="width:100%;border:1.5px solid var(--bor);border-radius:8px;padding:8px;font-size:13.5px;outline:none;font-family:inherit;background:#fff;margin-bottom:12px" onchange="RUT_CLI=this.value;RUT_SEM=1;RUT_DIA=0;${VIEW==='client'?'setTab(\'entreno\')':'render()'}">
    <option value="">-- Selecciona cliente --</option>${opts}
  </select>`;

  if(!c)return`<div class="card"><div class="cb">${selH}</div></div>`;

  const rs=revSems(c.tipo),st=c.semTotal;
  const semH=Array.from({length:st},(_,i)=>{
    const s=i+1,isRev=rs.includes(s),isCur=s===c.semana;
    return`<button class="sem-btn${s===RUT_SEM?' on':''}${isRev&&s!==RUT_SEM?' rev':''}${isCur?' cur':''}" onclick="RUT_SEM=${s};RUT_DIA=0;${VIEW==='client'?'setTab(\'entreno\')':'render()'}">S${s}${isRev?'📋':''}${isCur?' 📍':''}</button>`;
  }).join('');

  const dayH=DIAS_BASE.map((d,i)=>`<button class="day-btn${i===RUT_DIA?' on':''}${d.rest?' rest':''}" onclick="RUT_DIA=${i};${VIEW==='client'?'setTab(\'entreno\')':'render()'}">${d.nom}</button>`).join('');

  const dia=DIAS_BASE[RUT_DIA];

  // Copy/paste bar
  const semChecks=CP_MODE==='semana'?Array.from({length:st},(_,i)=>{
    const s=i+1;if(s===RUT_SEM)return'';
    return`<label style="display:inline-flex;align-items:center;gap:3px;font-size:11.5px;cursor:pointer;padding:3px 7px;border:1px solid var(--bor);border-radius:5px;background:#fff"><input type="checkbox" value="${s}" style="margin:0"> S${s}</label>`;
  }).join(''):'';

  let cpBar='';
  if(!CP_MODE){
    cpBar=`<div class="cp-bar">
      <button class="cp-btn" onclick="cpSem(${RUT_SEM})">📋 Copiar semana S${RUT_SEM}</button>
      ${!dia.rest?`<button class="cp-btn" onclick="cpDia(${RUT_SEM},${RUT_DIA})">Copiar ${dia.nom}</button>`:''}
      <button class="cp-btn" onclick="cpImport(${RUT_SEM})">📥 Importar plantilla</button>
      <span style="margin-left:auto;font-size:11px;color:var(--t3)">Ctrl+Z deshacer</span>
    </div>`;
  } else if(CP_MODE==='semana'){
    const destBtns=Array.from({length:st},(_,i)=>{
      const s=i+1;
      if(s===CP_DATA.sem)return`<button class="sem-btn" disabled style="opacity:.35">S${s}</button>`;
      return`<button class="sem-btn${_cpDest.has(s)?' on':''}" id="cpd-${s}" onclick="cpToggleDest(${s})">S${s}</button>`;
    }).join('');
    cpBar=`<div class="cp-bar" style="flex-direction:column;align-items:flex-start;gap:8px">
      <div style="font-size:12px;font-weight:700;color:var(--az2)">📋 S${CP_DATA.sem} copiada → selecciona semanas destino:</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${destBtns}</div>
      <div style="display:flex;gap:6px">
        <button class="cp-btn on" onclick="cpPegarSel()">📌 Pegar en seleccionadas</button>
        <button class="cp-btn cancel" onclick="cpCancel()">✕ Cancelar</button>
      </div>
    </div>`;
  } else if(CP_MODE==='dia'){
    cpBar=`<div class="cp-bar">
      <span style="font-size:12px;font-weight:700;color:var(--az2)">📋 ${DIAS_BASE[CP_DATA.dia].nom} copiado</span>
      ${!dia.rest?`<button class="cp-btn on" onclick="cpPegar(${RUT_SEM},${RUT_DIA})">📌 Pegar en ${dia.nom} S${RUT_SEM}</button>`:'<span style="color:var(--t3);font-size:11.5px">Ve a un día de entreno para pegar</span>'}
      <button class="cp-btn cancel" onclick="cpCancel()">✕ Cancelar</button>
    </div>`;
  }

  // Day editor
  let dayEditor='';
  if(dia.rest){
    dayEditor=`<div class="card"><div class="cb" style="text-align:center;padding:22px">
      <div style="font-size:36px;margin-bottom:8px">😴</div>
      <div style="font-weight:700;color:var(--t2);margin-bottom:8px">Día de descanso</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn bp" onclick="convTrain(${RUT_DIA})">💪 Convertir a entreno</button>
        ${CP_MODE==='dia'&&CP_DATA?`<button class="btn bo" onclick="cpPegar(${RUT_SEM},${RUT_DIA})">📌 Pegar día copiado</button>`:''}
      </div>
    </div></div>`;
  } else {
    const ejes=getRut(RUT_CLI,RUT_SEM,RUT_DIA);
    dayEditor=`<div class="card">
      <div class="ch">
        <h2>${dia.nom} · ${dia.tipo} · S${RUT_SEM}</h2>
        <div style="display:flex;gap:6px">
          <button class="btn bo bs" onclick="addEj()">+ Ejercicio</button>
          <button class="btn bo bs" style="color:var(--t3)" onclick="if(confirm('¿Convertir a descanso?'))convRest(${RUT_DIA})">😴 Descanso</button>
        </div>
      </div>
      <div style="overflow-x:auto;padding:0 2px">
        <div class="ej-hd">
          <span>#</span><span>Ejercicio</span><span style="text-align:center">Series</span>
          <span style="text-align:center">Reps</span><span style="text-align:center;color:var(--nr)">RIR</span>
          <span style="text-align:center">Descanso</span><span></span>
        </div>
        <div id="ej-list">${ejes.map((ej,ei)=>ejRow(ej,ei)).join('')}</div>
      </div>
    </div>`;
  }

  const header=VIEW==='client'?'':`${selH}`;
  return`${header}
  <div class="card" style="margin-bottom:10px"><div class="ch"><h2>📅 Semanas</h2></div><div class="cb" style="padding:10px 14px"><div class="sem-strip">${semH}</div></div></div>
  <div class="card" style="margin-bottom:10px"><div class="ch"><h2>Días S${RUT_SEM}</h2></div><div class="cb" style="padding:10px 14px"><div class="day-strip">${dayH}</div></div></div>
  ${cpBar}
  ${dayEditor}`;
}

function ejRow(ej,ei){
  const restOpts=REST_OPTS.map(s=>`<option value="${s}" ${ej.rest===s?'selected':''}>${REST_LABEL[s]}</option>`).join('');
  // Find last log for this exercise by name (not position)
  const allLogs=RUTINAS[RUT_CLI]?.__logs||{};
  const ejLogs=allLogs[ej.nom]||[];
  const lastLog=ejLogs.length?ejLogs[ejLogs.length-1]:null;
  const lastLogH=lastLog?`<div style="font-size:9.5px;color:var(--vd);margin-top:2px">▶ S${lastLog.sem}: ${lastLog.vals}</div>`:'';
  return`<div class="ej-row" id="ejr-${ei}">
    <span class="ej-num">${ei+1}</span>
    <div class="ac-wrap">
      <input class="ei" value="${ej.nom}" placeholder="Nombre ejercicio..."
        oninput="acSearch(this,${ei});ejUpd(${ei},'nom',this.value)"
        onfocus="acSearch(this,${ei})"
        onblur="setTimeout(()=>acHide(${ei}),160);ejSave(${ei},'nom',this.value)">
      <div class="ac-list" id="ac-${ei}" style="display:none"></div>
      ${lastLogH}
    </div>
    <input class="ei" type="number" value="${ej.sets}" placeholder="4" style="text-align:center"
      oninput="ejUpd(${ei},'sets',parseInt(this.value)||3)"
      onblur="ejSave(${ei},'sets',parseInt(this.value)||3)">
    <input class="ei" value="${ej.reps}" placeholder="8-10" style="text-align:center"
      oninput="ejUpd(${ei},'reps',this.value)"
      onblur="ejSave(${ei},'reps',this.value)">
    <input class="ei rir" type="number" min="0" max="5" value="${ej.rir}" style="text-align:center"
      oninput="ejUpd(${ei},'rir',parseInt(this.value)||0)"
      onblur="ejSave(${ei},'rir',parseInt(this.value)||0)">
    <select class="es" onchange="ejSave(${ei},'rest',parseInt(this.value))">${restOpts}</select>
    <button class="edel" onclick="delEj(${ei})">✕</button>
  </div>`;
}

// Live update without undo (while typing)
function ejUpd(ei,k,v){
  const ejes=getRut(RUT_CLI,RUT_SEM,RUT_DIA);
  if(ejes[ei])ejes[ei][k]=v;
}
// Save to undo on blur/change (when leaving field)
function ejSave(ei,k,v){
  if(_blockEjSave)return;
  rutPush();
  const ejes=getRut(RUT_CLI,RUT_SEM,RUT_DIA);
  if(ejes[ei])ejes[ei][k]=v;
  clearTimeout(window._ejSaveBD);
  window._ejSaveBD=setTimeout(()=>{
    if(API_TOKEN&&RUT_CLI){guardarRutinaEnBD(RUT_CLI);registrarCambio(RUT_CLI,'Entreno S'+RUT_SEM+' modificado');}
  },1500);
}
function guardarRutinaEnBD(cliId){
  if(!RUTINAS[cliId])return;
  // Build rutina_base and rutina_semanas from RUTINAS[cliId]
  const rutinaSemanas={};
  Object.keys(RUTINAS[cliId]).forEach(function(key){
    if(key==='__logs')return;
    const sem=parseInt(key);
    if(!isNaN(sem))rutinaSemanas[sem]=RUTINAS[cliId][sem];
  });
  apiCall('PATCH','/api/entreno/rutina',{
    cliente_id:cliId,
    rutina_semanas:rutinaSemanas
  }).catch(function(e){console.warn('[Rutina] Error guardando:',e.message);});
}

function acSearch(inp,ei){
  const q=inp.value.toLowerCase().trim();
  const list=document.getElementById('ac-'+ei);if(!list)return;
  if(!q||q.length<2){list.style.display='none';return;}
  const ms=EJ.filter(e=>e.nombre.toLowerCase().includes(q)).slice(0,8);
  if(!ms.length){list.style.display='none';return;}
  list.innerHTML=ms.map(e=>`<div class="ac-item" onmousedown="acSel(${ei},'${e.nombre.replace(/'/g,"\\'")}')"><span>${e.nombre}</span><small>${e.grupo||''}</small></div>`).join('');
  list.style.display='block';
}
function acHide(ei){const l=document.getElementById('ac-'+ei);if(l)l.style.display='none';}
function acSel(ei,nom){
  const ej=EJ.find(e=>e.nombre===nom);if(!ej)return;
  rutPush();
  const ejes=getRut(RUT_CLI,RUT_SEM,RUT_DIA);
  if(ejes[ei]){
    ejes[ei].nom=ej.nombre;ejes[ei].sets=parseInt(ej.series)||3;
    ejes[ei].reps=ej.reps||'8-10';ejes[ei].rir=parseInt(ej.rir)||2;
    ejes[ei].url=ej.url||'';
    const restMap={compound:180,maquina:120,aislamiento:90,abdomen:60,gemelos:60};
    ejes[ei].rest=restMap[ej.tipo?.toLowerCase()]||90;
  }
  acHide(ei);
  // Patch just this row
  const row=document.getElementById('ejr-'+ei);
  if(row)row.outerHTML=ejRow(ejes[ei],ei);
  toast(nom+' ✓','vd');
}

function addEj(){
  _blockEjSave=true;
  setTimeout(()=>{_blockEjSave=false;},200);
  rutPush();
  const ejes=getRut(RUT_CLI,RUT_SEM,RUT_DIA);
  ejes.push({nom:'',sets:3,reps:'8-10',rir:2,rest:120,url:''});
  rutRefresh();
  setTimeout(()=>{
    const inputs=document.querySelectorAll('.ei');
    if(inputs.length)inputs[inputs.length-1].focus();
  },50);
}
function delEj(ei){
  _blockEjSave=true;
  setTimeout(()=>{_blockEjSave=false;},200);
  rutPush();
  const ejes=getRut(RUT_CLI,RUT_SEM,RUT_DIA);
  ejes.splice(ei,1);
  rutRefresh();
}
function convTrain(dia){
  rutPush();
  if(!RUTINAS[RUT_CLI])RUTINAS[RUT_CLI]={};
  if(!RUTINAS[RUT_CLI][RUT_SEM])RUTINAS[RUT_CLI][RUT_SEM]={};
  RUTINAS[RUT_CLI][RUT_SEM][dia]=JSON.parse(JSON.stringify(EJ_DEF[0]||[]));
  DIAS_BASE[dia].rest=false;DIAS_BASE[dia].tipo='Entreno';
  if(VIEW==='client')setTab('entreno');else render(); // full re-render needed (day structure changed)
}
function convRest(dia){
  rutPush();
  if(!RUTINAS[RUT_CLI])RUTINAS[RUT_CLI]={};
  if(!RUTINAS[RUT_CLI][RUT_SEM])RUTINAS[RUT_CLI][RUT_SEM]={};
  RUTINAS[RUT_CLI][RUT_SEM][dia]=[];
  DIAS_BASE[dia].rest=true;DIAS_BASE[dia].tipo='Descanso';
  if(VIEW==='client')setTab('entreno');else render(); // full re-render needed (day structure changed)
}

// Destination week selection set
const _cpDest=new Set();

function cpCancel(){CP_MODE=null;CP_DATA=null;_cpDest.clear();if(VIEW==='client')setTab('entreno');else render();}

function cpSem(sem){
  const data={};
  DIAS_BASE.forEach((_,di)=>{data[di]=JSON.parse(JSON.stringify(getRut(RUT_CLI,sem,di)));});
  CP_MODE='semana';CP_DATA={sem,data};_cpDest.clear();
  if(VIEW==='client')setTab('entreno');else render();
  toast('S'+sem+' copiada — selecciona semanas destino','vd');
}

function cpDia(sem,dia){
  CP_MODE='dia';CP_DATA={sem,dia,ejes:JSON.parse(JSON.stringify(getRut(RUT_CLI,sem,dia)))};
  if(VIEW==='client')setTab('entreno');else render();
  toast(DIAS_BASE[dia].nom+' copiado — ve a la semana destino y pulsa Pegar','vd');
}

function cpToggleDest(s){
  if(_cpDest.has(s))_cpDest.delete(s);else _cpDest.add(s);
  // Update button state without re-render
  const btn=document.getElementById('cpd-'+s);
  if(btn)btn.classList.toggle('on',_cpDest.has(s));
  // Update paste button label
  const pasteBtns=document.querySelectorAll('.cp-btn.on[onclick*="cpPegarSel"]');
  pasteBtns.forEach(b=>{b.textContent='📌 Pegar en '+_cpDest.size+' semana'+(_cpDest.size!==1?'s':'');b.style.opacity=_cpDest.size===0?'0.5':'1';});
}

function cpPegarSel(){
  if(!CP_DATA||!_cpDest.size){toast('Selecciona al menos una semana destino','rj');return;}
  rutPush();
  _cpDest.forEach(s=>{
    if(!RUTINAS[RUT_CLI])RUTINAS[RUT_CLI]={};
    if(!RUTINAS[RUT_CLI][s])RUTINAS[RUT_CLI][s]={};
    Object.keys(CP_DATA.data).forEach(d=>{
      RUTINAS[RUT_CLI][s][parseInt(d)]=JSON.parse(JSON.stringify(CP_DATA.data[d]));
    });
  });
  toast('S'+CP_DATA.sem+' pegada en semanas: '+[..._cpDest].sort((a,b)=>a-b).join(', ') +' ✓','vd');
  CP_MODE=null;CP_DATA=null;_cpDest.clear();
  if(VIEW==='client')setTab('entreno');else render();
}

function cpPegar(sem,dia){
  // Paste a single day
  if(!CP_DATA||CP_MODE!=='dia')return;
  rutPush();
  if(!RUTINAS[RUT_CLI])RUTINAS[RUT_CLI]={};
  if(!RUTINAS[RUT_CLI][sem])RUTINAS[RUT_CLI][sem]={};
  RUTINAS[RUT_CLI][sem][dia]=JSON.parse(JSON.stringify(CP_DATA.ejes));
  toast('Pegado en '+DIAS_BASE[dia].nom+' S'+sem+' ✓','vd');
  CP_MODE=null;CP_DATA=null;
  rutRefresh();
}

// Import a template routine into selected week
function cpImport(sem){
  // Show picker of the 34 routines
  const RUTS=[
    {code:'2D.FB.SINMAT',nom:'2 días · Full Body · En casa sin material'},
    {code:'2D.FB.GYM',nom:'2 días · Full Body · Gimnasio'},
    {code:'3D.FB.SINMAT',nom:'3 días · Full Body · En casa sin material'},
    {code:'3D.FB.BAND',nom:'3 días · Full Body · En casa con bandas'},
    {code:'3D.FB.ByM',nom:'3 días · Full Body · En casa con bandas y mancuernas'},
    {code:'3D.FB.GYM',nom:'3 días · Full Body · Gimnasio'},
    {code:'3D.TP,FB.SINMAT',nom:'3 días · Torso-Pierna-FB · En casa sin material'},
    {code:'3D.TP,FB.BAND',nom:'3 días · Torso-Pierna-FB · En casa con bandas'},
    {code:'3D.TP,FB.B,M',nom:'3 días · Torso-Pierna-FB · En casa bandas y mancuernas'},
    {code:'3D.TP,FB.GYM.C',nom:'3 días · Torso-Pierna-FB · Gimnasio circuito 45 min'},
    {code:'3D.TP,FB.GYM',nom:'3 días · Torso-Pierna-FB · Gimnasio'},
    {code:'3D.TP,FB.GYM+',nom:'3 días · Torso-Pierna-FB · Gimnasio avanzado'},
    {code:'3D.TP,FB.GYM.1h',nom:'3 días · Torso-Pierna-FB · Gimnasio superseries 1h'},
    {code:'3D.PTE',nom:'3 días · Pierna-Tracción-Empuje · Gimnasio'},
    {code:'3D.PTE2',nom:'3 días · Pierna-Tracción-Empuje · Gimnasio avanzado'},
    {code:'4D.TP.SINMAT',nom:'4 días · Torso-Pierna · En casa sin material'},
    {code:'4D.TP.CIRCUIT.BAND',nom:'4 días · Torso-Pierna circuito · En casa bandas'},
    {code:'4D.TP.B,MyB',nom:'4 días · Torso-Pierna · En casa bandas, mancuernas y barra'},
    {code:'4D.TP3.B,MyB',nom:'4 días · Torso-Pierna preactivación · En casa bandas, mancuernas y barra'},
    {code:'4D.TP',nom:'4 días · Torso-Pierna · Gimnasio básico'},
    {code:'4D.TP2',nom:'4 días · Torso-Pierna · Gimnasio medio'},
    {code:'4D.TP3',nom:'4 días · Torso-Pierna preactivación · Gimnasio avanzado'},
    {code:'4D.TE.SINMAT',nom:'4 días · Tracción-Empuje · En casa sin material'},
    {code:'4D.TE.BAND',nom:'4 días · Tracción-Empuje · En casa con bandas'},
    {code:'4D.TE.M,ByTRX',nom:'4 días · Tracción-Empuje · En casa mancuernas, bandas y TRX'},
    {code:'4D.TE',nom:'4 días · Tracción-Empuje · Gimnasio básico'},
    {code:'4D.TE2',nom:'4 días · Tracción-Empuje · Gimnasio medio'},
    {code:'4D.TE.GYM30',nom:'4 días · Tracción-Empuje biseries · Gimnasio 30-40 min'},
    {code:'4ETP,TB',nom:'4 días · Empuje-Tracción-Pierna-Torso y Brazo · Gimnasio v1'},
    {code:'4ET,PiernayBrazo.GYM2',nom:'4 días · Empuje-Tracción-Pierna-Torso y Brazo · Gimnasio v2'},
    {code:'4ETP,TB.CASA',nom:'4 días · Empuje-Tracción-Pierna-Torso y Brazo · En casa'},
    {code:'5D.TPAH',nom:'5 días · Pierna-Torso-Abdomen-Hombro · Gimnasio'},
    {code:'5D-TPHB',nom:'5 días · Pierna-Torso-Hombro-Brazo · Gimnasio'},
    {code:'5D.TPAH.',nom:'5 días · Pierna-Torso-Abdomen-Hombro · Gimnasio v2'},
  ];
  const pickerId='rut-import-picker';
  let el=document.getElementById(pickerId);
  if(el){el.remove();return;}
  const container=document.getElementById('ej-list')?.closest('.card')||document.querySelector('.card');
  if(!container)return;
  const div=document.createElement('div');
  // Overlay to close on click outside
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999';
  overlay.onclick=()=>{overlay.remove();div.remove();};
  document.body.appendChild(overlay);
  
  div.id=pickerId;
  div.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:2px solid var(--az2);border-radius:12px;padding:16px;z-index:1000;max-width:520px;width:90%;max-height:75vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.2)';
  div.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-weight:700;font-size:14px;color:var(--az)">📥 Importar rutina plantilla</div>
      <button onclick="this.closest('[id=rut-import-picker]')?.remove();document.querySelector('[style*=rgba]')?.remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--t3)">✕</button>
    </div>
    <div style="font-size:11.5px;color:var(--t3);margin-bottom:8px">Aplicar a:</div>
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="radio" name="imp-target" value="sem" checked> Solo S${sem}</label>
      <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="radio" name="imp-target" value="all"> Todas las semanas</label>
      <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="radio" name="imp-target" value="from"> Desde S${sem} hasta el final</label>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px">
      ${RUTS.map((r,i)=>`<button onclick="cpImportConfirm(${sem},${i})" style="text-align:left;padding:8px 11px;border:1.5px solid var(--bor);border-radius:7px;background:#fff;cursor:pointer;font-family:inherit;font-size:12.5px;transition:all .15s" onmouseover="this.style.background='var(--az3)'" onmouseout="this.style.background='#fff'"><b>${r.code}</b> — ${r.nom}</button>`).join('')}
    </div>
    <button onclick="document.getElementById('${pickerId}').remove()" style="margin-top:12px;width:100%;padding:8px;border:1.5px solid var(--bor);border-radius:7px;background:#fff;cursor:pointer;font-family:inherit;color:var(--t3)">Cancelar</button>`;
  // Store RUTS for use in confirm
  div._ruts=RUTS;window._importPickerRuts=RUTS;
  document.body.appendChild(div);
}

// Store globally for the import confirm
let _importRuts=null;
function cpImportConfirm(sem,idx){
  const picker=document.getElementById('rut-import-picker');
  if(!picker)return;
  const RUTS_ALL=picker._ruts||window._importPickerRuts;
  if(!RUTS_ALL||!RUTS_ALL[idx])return;
  const code=RUTS_ALL[idx].code;
  const rutData=RUTINAS_PARSED[code];
  if(!rutData){toast('Rutina no encontrada: '+code,'rj');picker.remove();return;}
  const cliId=RUT_CLI||CLI_ID;
  if(!cliId){toast('No hay cliente seleccionado','rj');picker.remove();return;}
  RUT_CLI=cliId;
  
  if(!RUTINAS[cliId])RUTINAS[cliId]={__logs:{}};
  const c=byId(cliId);
  const totalSems=c?.semTotal||14;

  // Save current state for undo BEFORE any changes
  // Only save what's currently in memory (don't pre-populate other semanas)
  UNDO_RUT.push({cli:cliId,sem:RUT_SEM,dia:RUT_DIA,
    data:JSON.stringify(RUTINAS[cliId])});
  if(UNDO_RUT.length>UNDO_MAX)UNDO_RUT.shift();

  // Determine target semanas
  const targetRadio=document.querySelector('input[name="imp-target"]:checked');
  const target=targetRadio?targetRadio.value:'sem';
  let semsToApply=[];
  if(target==='all'){semsToApply=Array.from({length:totalSems},(_,i)=>i+1);}
  else if(target==='from'){semsToApply=Array.from({length:totalSems-sem+1},(_,i)=>sem+i);}
  else{semsToApply=[sem];}

  // Apply rutina ONLY to selected semanas
  // Write ALL 7 days explicitly so tEntrenoGrid knows which are rest days
  semsToApply.forEach(s=>{
    RUTINAS[cliId][s]={};
    for(let di=0;di<7;di++){
      const dayEjs=rutData[String(di)];
      if(!dayEjs||dayEjs.length===0){
        // Not in rutina or empty = rest day
        RUTINAS[cliId][s][di]=[];
      } else {
        RUTINAS[cliId][s][di]=dayEjs.map(e=>({
          nom:e.nom,sets:e.sets,reps:String(e.reps),
          rir:e.rir,rest:e.rest,url:e.url||'',acl:e.acl||''
        }));
      }
    }
  });

  // Update DIAS_BASE ONLY for the semana currently being viewed
  // Reset all days first, then apply rutData for current sem
  const currSemData=RUTINAS[cliId][sem]||{};
  DIAS_BASE.forEach((d,di)=>{
    const ejes=currSemData[di];
    if(ejes===undefined){
      // Day not in rutina — leave as is
    } else {
      d.rest=ejes.length===0;
      if(d.rest){d.tipo='Descanso';}
    }
  });
  // Assign generic training names
  var tn=0;
  DIAS_BASE.forEach((d)=>{
    if(!d.rest){tn++;d.tipo='Entreno '+tn;}
  });

  picker.remove();
  document.querySelectorAll('[style*="rgba(0,0,0,.4)"]').forEach(el=>el.remove());
  ENT_VIEW='grid';RUT_SEM=sem;
  // Update DIAS_BASE to reflect the new rutina's training days
  if(semsToApply.includes(RUT_SEM)){
    const semData=RUTINAS[cliId][RUT_SEM]||{};
    DIAS_BASE.forEach(function(d,i){
      const ejes=semData[i];
      d.rest=!ejes||ejes.length===0;
      if(!d.rest&&ejes&&ejes.length>0){
        // Use tipo from rutData if available
        const rutDayData=rutData[String(i)];
        if(rutDayData&&rutDayData.tipo)d.tipo=rutDayData.tipo;
      }
    });
  }
  guardarRutinaEnBD(cliId);
  if(VIEW==='client')setTab('entreno');else render();
  toast('✅ '+code+' en '+(semsToApply.length>1?semsToApply.length+' semanas':'S'+sem)+' — Ctrl+Z para deshacer','vd');
}

// ═══ TAB: EDITAR ═══

function borrarCliente(id, nom){
  if(!confirm('¿Eliminar a '+nom+'?\n\nEsta acción borrará todos sus datos (nutrición, entrenos, revisiones, fotos). No se puede deshacer.'))return;
  if(!confirm('Confirma: ¿seguro que quieres eliminar a '+nom+' definitivamente?'))return;
  apiCall('DELETE','/api/clientes/'+id).then(function(){
    toast('Cliente eliminado','vd');
    VIEW='list';CLI_ID=null;
    C.splice(C.findIndex(function(c){return c.id===id;}),1);
    render();
  }).catch(function(e){toast('Error: '+e.message,'rj');});
}

function tEditar(c){
  const ed=EDITING;
  // On entering edit mode, save a snapshot for cancel
  if(ed&&!window._editSnapshot){
    window._editSnapshot={id:c.id,data:JSON.stringify({
      pesoAct:c.pesoAct,obj:c.obj,pesoIni:c.pesoIni,
      pasosObj:c.pasosObj,diasSemana:c.diasSemana,semana:c.semana,
      inicioBloque:c.inicioBloque,lesiones:c.lesiones,intolerancias:c.intolerancias,
      macros:{...c.macros}
    })};
  }
  const inp=(k,v,t='number',extra='')=>ed
    ?`<input class="dato-inp" type="${t}" value="${v??''}" onchange="editC('${c.id}','${k}',this.value)" ${extra}>`
    :`<span style="font-weight:700">${v??'—'}</span>`;
  const inpM=(k,v)=>ed
    ?`<input class="dato-inp" type="number" value="${v??0}" onchange="editM('${c.id}','${k}',this.value)">`
    :`<span style="font-weight:700">${v??0}</span>`;

  return`<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <div style="font-size:13px;color:var(--t2)">${ed?'Modo edición activo':'Datos del plan'}</div>
    <div style="display:flex;gap:8px">
      ${ed?`<button class="btn bo bs" onclick="cancelEditar('${c.id}')">Cancelar</button>
             <button class="btn bp bs" onclick="guardarEditar('${c.id}')">Guardar ✓</button>`
         :`<button class="btn bp bs" onclick="EDITING=true;var _sc=byId(CLI_ID);window._editSnapshot=_sc?{actividad:_sc.actividad}:{};setTab('editar')">✏️ Editar</button>`}
    </div>
  </div>
  <div class="rg">
    <div>
      <div class="sec-t">Composición corporal</div>
      <div class="card" style="margin-bottom:12px"><div class="cb" style="padding:0 14px">
        ${[['pesoAct','Peso actual (kg)'],['obj','Objetivo (kg)'],['pesoIni','Peso inicial (kg)']].map(([k,l])=>`<div class="dato"><label>${l}</label>${inp(k,c[k],'number','step=0.1')}</div>`).join('')}
      </div></div>
      <div class="sec-t">Plan</div>
      <div class="card" style="margin-bottom:12px"><div class="cb" style="padding:0 14px">
        <div class="dato"><label>Factor actividad</label>${inp('actividad',c.actividad,'number','step=0.01 min=1.2 max=2.0 placeholder="1.375"')}</div>
        <div class="dato"><label>Pasos/día</label>${inp('pasosObj',c.pasosObj)}</div>
        <div class="dato"><label>Días entreno/sem</label>${inp('diasSemana',c.diasSemana,'number','min=1 max=6')}</div>
        <div class="dato"><label>Semana actual</label>${inp('semana',c.semana,'number','min=1 max='+c.semTotal)}</div>
        <div class="dato"><label>Inicio bloque</label>${ed?`<input class="dato-inp" type="date" value="${c.inicioBloque||''}" onchange="editC('${c.id}','inicioBloque',this.value)">`:`<span style="font-weight:700">${c.inicioBloque?c.inicioBloque.split('-').reverse().join('/'):'—'}</span>`}</div>
        <div class="dato"><label>Entrenador</label>${ed?`<select class="dato-inp" onchange="editC('${c.id}','entrenador',this.value)"><option value="alvaro" ${c.entrenador==='alvaro'?'selected':''}>Álvaro Casal</option><option value="gerard" ${c.entrenador==='gerard'?'selected':''}>Gerard Sala</option></select>`:`<span style="font-weight:700">${c.entrenador==='gerard'?'Gerard Sala':'Álvaro Casal'}</span>`}</div>
      </div></div>
      <div class="sec-t">Publicación</div>
      <div class="card" style="margin-bottom:12px"><div class="cb" style="padding:10px 14px">
        <div style="font-size:13px;color:var(--t2);margin-bottom:10px">Estado del plan visible para el cliente.</div>
        <div style="display:flex;gap:8px">
          <button class="btn ${c.planPublicado?'bo':'bp'}" onclick="togglePublicar('${c.id}')">
            ${c.planPublicado?'⬇️ Despublicar':'🚀 Publicar al cliente'}
          </button>
        </div>
        <div style="font-size:12px;color:var(--t3);margin-top:8px">${c.planPublicado?'El cliente puede ver su plan en la app.':'El plan está en modo borrador — el cliente no lo ve.'}</div>
      </div></div>
    </div>
    <div>
      <div class="sec-t">Fase y objetivo semanal</div><div class="card" style="margin-bottom:12px"><div class="cb" style="padding:0 14px"><div class="dato"><label>Fase actual</label><select id="fase-${c.id}" style="font-size:14px;padding:4px 8px;border:1px solid var(--bor);border-radius:6px;background:#fff"><option value="deficit" ${(c.fase||'deficit')==='deficit'?'selected':''}>📉 Déficit</option><option value="reconstruccion" ${(c.fase||'')=='reconstruccion'?'selected':''}>🔄 Reconstrucción metabólica</option><option value="superavit" ${(c.fase||'')=='superavit'?'selected':''}>📈 Superávit</option></select></div><div class="dato" style="margin-top:8px"><label>Objetivo semanal (kg)</label><input type="number" step="0.1" id="obj-sem-${c.id}" value="${c.objSemKg!=null?c.objSemKg:''}" placeholder="ej: -0.5" style="width:120px;font-size:14px;padding:4px 8px;border:1px solid var(--bor);border-radius:6px"></div></div></div><div class="sec-t">Macros objetivo <span style="font-size:9px;font-weight:400;color:var(--t3)">(independientes de Nutrición)</span></div>
      <div class="card" style="margin-bottom:12px"><div class="cb" style="padding:0 14px">
        <div class="dato">
        <label>Calorías <span style="font-size:9px;color:var(--vd)">(calculadas automáticamente)</span></label>
        <span style="font-weight:800;font-size:16px;color:var(--nr)" data-kcal-id="${c.id}">${c.macros.kcal}</span>
      </div>
      ${[['p','Proteína (g)'],['c','Carbos (g)'],['g','Grasa (g)']].map(([k,l])=>`<div class="dato"><label>${l}</label>${inpM(k,c.macros[k])}</div>`).join('')}
      </div></div>
      <div class="sec-t">Lesiones y notas</div>
      <div class="card"><div class="cb" style="padding:10px 14px">
        <div style="margin-bottom:10px">
          <div class="sec-t">Lesiones / molestias</div>
          ${ed?`<textarea style="width:100%;border:1.5px solid var(--az2);border-radius:7px;padding:8px;font-family:inherit;font-size:13px;outline:none;resize:none;min-height:60px" onchange="editC('${c.id}','lesiones',this.value)">${c.lesiones||''}</textarea>`:`<div style="font-size:13px;color:var(--t2)">${c.lesiones||'Ninguna'}</div>`}
        </div>
        <div>
          <div class="sec-t">Intolerancias</div>
          ${ed?`<textarea style="width:100%;border:1.5px solid var(--az2);border-radius:7px;padding:8px;font-family:inherit;font-size:13px;outline:none;resize:none;min-height:50px" onchange="editC('${c.id}','intolerancias',this.value)">${c.intolerancias||''}</textarea>`:`<div style="font-size:13px;color:var(--t2)">${c.intolerancias||'Ninguna'}</div>`}
        </div>
      </div></div>
    </div>
  </div></div>
  <div style="margin-top:32px;padding-top:20px;border-top:2px solid #fee2e2;text-align:center"><div style="font-size:12px;color:var(--t3);margin-bottom:10px">⚠️ Zona de peligro</div><button onclick="borrarCliente('${c.id}','${c.nom}')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">🗑️ Eliminar cliente permanentemente</button></div>`;
}
function cancelEditar(id){
  if(window._editSnapshot&&window._editSnapshot.id===id){
    const c=byId(id);
    if(c){
      const snap=JSON.parse(window._editSnapshot.data);
      Object.assign(c,snap);
      c.macros=snap.macros;
    }
  }
  window._editSnapshot=null;
  EDITING=false;
  setTab('editar');
}
function editUndo(){
  if(!UNDO_EDIT.length){toast('Nada que deshacer en editar','');return;}
  const s=UNDO_EDIT.pop();
  const c=byId(s.id);if(!c)return;
  if(s.k.startsWith('macros.')){
    const mk=s.k.replace('macros.','');
    REDO_EDIT.push({id:s.id,k:s.k,v:c.macros[mk]});
    c.macros[mk]=s.v;
    c.macros.kcal=Math.round((c.macros.p||0)*4+(c.macros.c||0)*4+(c.macros.g||0)*9);
  } else {
    REDO_EDIT.push({id:s.id,k:s.k,v:c[s.k]});
    c[s.k]=s.v;
  }
  toast('↩ Deshecho','vd');
  setTab('editar');
}
function editRedo(){
  if(!REDO_EDIT.length){toast('Nada que rehacer en editar','');return;}
  const s=REDO_EDIT.pop();
  const c=byId(s.id);if(!c)return;
  if(s.k.startsWith('macros.')){
    const mk=s.k.replace('macros.','');
    UNDO_EDIT.push({id:s.id,k:s.k,v:c.macros[mk]});
    c.macros[mk]=s.v;
    c.macros.kcal=Math.round((c.macros.p||0)*4+(c.macros.c||0)*4+(c.macros.g||0)*9);
  } else {
    UNDO_EDIT.push({id:s.id,k:s.k,v:c[s.k]});
    c[s.k]=s.v;
  }
  toast('↪ Rehecho','vd');
  setTab('editar');
}
async function guardarEditar(id){
  window._editSnapshot=null;
  EDITING=false;
  const c=byId(id);
  if(!c){setTab('editar');return;}
  const patch={};
  if(c.actividad!==undefined){
    patch.actividad=parseFloat(c.actividad);
    // Only recalculate if actividad changed from the snapshot (original value)
    const snapActividad=window._editSnapshot&&window._editSnapshot.actividad;
    if(snapActividad&&Math.abs(parseFloat(c.actividad)-parseFloat(snapActividad))>0.001){
      patch.recalcular_nutri=true;
    }
  }
  if(c.semana!==undefined)patch.semana_actual=c.semana;
  if(c.nivel!==undefined)patch.nivel=c.nivel;
  if(c.rutina!==undefined)patch.rutina_actual=c.rutina;
  if(c.pasos!==undefined)patch.pasos_objetivo=c.pasos;
  if(c.obj!==undefined&&c.obj!==null)patch.objetivo_kg=parseFloat(c.obj);

  if(c.obj!==undefined&&c.obj!==null)patch.objetivo_kg=parseFloat(c.obj);

  if(c.inicioBloque){patch.fecha_inicio=c.inicioBloque;patch.bloque_fecha_inicio=c.inicioBloque;}
  if(c.macros){
    patch.kcal_asignadas=c.macros.kcal;
    // Also save full macros to planes_nutricion
    apiCall('PATCH','/api/bd/plan-nutricion/'+id,{
      kcal_total: c.macros.kcal,
      proteina_g: c.macros.p,
      carbos_g: c.macros['c'],
      grasas_g: c.macros.g
    }).catch(function(e){console.warn('Error guardando macros en plan:',e);});
  }
  // Fase y objetivo semanal
  const faseEl=document.getElementById('fase-'+id);
  const objSemEl=document.getElementById('obj-sem-'+id);
  if(faseEl){const fv=faseEl.value;c.fase=fv;patch.fase=fv;}
  if(objSemEl&&objSemEl.value!==''){const osv=parseFloat(objSemEl.value);c.objSemKg=osv;patch.obj_sem_kg=osv;}
  try{
    const resp = await apiCall('PATCH',`/api/clientes/${id}`,patch);
    // If nutrition was recalculated, update local macros
    if(resp && resp._nutri_recalculada && c){
      const nr = resp._nutri_recalculada;
      const newMacros = {kcal: nr.kcal, p: nr.p, g: nr.g};
      newMacros['c'] = nr.c;
      c.macros = newMacros;
      toast('✅ Cambios guardados · Nutrición recalculada','vd');
      render();
    } else {
      toast('✅ Cambios guardados','vd');
    }
  }catch(e){
    toast('⚠️ Error guardando: '+e.message,'nr');
  }
  setTab('editar');
}
function editC(id,k,v){
  const c=byId(id);if(!c)return;
  const prev=c[k];
  const newVal=(k==='inicioBloque'||isNaN(+v))?v:parseFloat(v);
  if(prev===newVal)return;
  UNDO_EDIT.push({id,k,v:prev});REDO_EDIT.length=0;
  if(UNDO_EDIT.length>UNDO_MAX)UNDO_EDIT.shift();
  c[k]=newVal;
}
function editM(id,k,v){
  const c=byId(id);if(!c||!c.macros)return;
  const prev=c.macros[k];
  const newVal=parseFloat(v)||0;
  if(prev===newVal)return;
  UNDO_EDIT.push({id,k:'macros.'+k,v:prev});REDO_EDIT.length=0;
  if(UNDO_EDIT.length>UNDO_MAX)UNDO_EDIT.shift();
  c.macros[k]=newVal;
  // Recalcular kcal automáticamente: P×4 + C×4 + G×9
  c.macros.kcal=Math.round((c.macros.p||0)*4+(c.macros.c||0)*4+(c.macros.g||0)*9);
  // Update kcal input if visible
  const kInp=document.querySelector(`input[onchange*="editM('${id}','kcal'"]`);
  if(kInp)kInp.value=c.macros.kcal;
  // Update kcal display
  const kEl=document.querySelector(`[data-kcal-id="${id}"]`);
  if(kEl)kEl.textContent=c.macros.kcal;
}

// ═══ LÓGICAS ═══
function rLogicas(){
  const secs=[
    {t:'📊 Adherencia',rows:[['Fórmula','Entrenos×45% + Nutrición×35% + Pasos×20%'],['🟢 Verde','≥ 80%'],['🟡 Naranja','60–79%'],['🔴 Rojo','< 60%']]},
    {t:'📅 Revisiones',rows:[['1:1 (13 sem)','S3, S7, S11 · S13 buffer'],['Programa (14 sem)','S4, S8, S12 · S14 buffer']]},
    {t:'🚶 Pasos',rows:[['Déficit + sedentario','8.000/día'],['Déficit + activo','10.000/día'],['Volumen','8.000 máximo']]},
    {t:'💪 Descanso entre series',rows:[['Compound grandes (SQ/DL)','3 min'],['Máquinas','2 min'],['Aislamiento','90 seg'],['Abdomen/gemelos','60 seg']]},
    {t:'🍽️ Nutrición — grasas',rows:[['Proteína magra','Añadir grasa'],['Proteína grasa','Sin grasa adicional'],['Snack en déficit','Sin grasa extra'],['Snack en superávit','Grasa disponible']]},
    {t:'⚖️ Pérdida de peso',rows:[['Ritmo óptimo','0.5–1 kg/semana'],['Máximo seguro','1.2 kg/semana']]},
    {t:'📋 Bloques',rows:[['Al terminar S13/S14','Crear nuevo bloque desde Editar → historial queda guardado'],['Flujo plan','Form → generador → entrenador revisa → Publicar']]},
  ];
  return secs.map(s=>`<div class="card"><div class="ch"><h2>${s.t}</h2></div><div class="cb" style="padding:0 14px">
    ${s.rows.map(([l,v])=>`<div class="dato"><label>${l}</label><span style="font-size:12.5px;font-weight:600;text-align:right;max-width:60%;color:var(--t1)">${v}</span></div>`).join('')}
  </div></div>`).join('');
}

// ═══ NUEVO CLIENTE ═══
function rNuevo(){
  return`<div class="card" style="max-width:560px">
  <div class="ch"><h2>➕ Nuevo cliente</h2></div>
  <div class="cb">
    <div class="fg">
      <div class="fg-item"><div class="flbl">Nombre completo *</div><input class="finp" id="nc-nom" type="text" placeholder="Nombre Apellido"></div>
      <div class="fg-item"><div class="flbl">Email *</div><input class="finp" id="nc-email" type="email" placeholder="email@ejemplo.com"></div>
      <div class="fg-item"><div class="flbl">Tipo *</div><select class="finp" id="nc-tipo"><option value="uno">1:1 Coaching</option><option value="programa">Programa grupal</option></select></div>
      <div class="fg-item"><div class="flbl">Fecha nacimiento</div><input class="finp" id="nc-fnac" type="date"></div>
      <div class="fg-item"><div class="flbl">Peso inicial (kg) *</div><input class="finp" id="nc-peso" type="number" step="0.1"></div>
      <div class="fg-item"><div class="flbl">Objetivo (kg) *</div><input class="finp" id="nc-obj" type="number" step="0.1"></div>
      <div class="fg-item"><div class="flbl">Altura (cm)</div><input class="finp" id="nc-altura" type="number"></div>
      <div class="fg-item"><div class="flbl">Días entreno/sem</div><input class="finp" id="nc-dias" type="number" min="1" max="6" value="4"></div>
      <div class="fg-item"><div class="flbl">Kcal objetivo</div><input class="finp" id="nc-kcal" type="number" placeholder="2000"></div>
      <div class="fg-item"><div class="flbl">Pasos/día</div><input class="finp" id="nc-pasos" type="number" placeholder="10000"></div>
      <div class="fg-item"><div class="flbl">Equipamiento</div><select class="finp" id="nc-equip"><option>Gimnasio completo</option><option>Casa con mancuernas, bandas y banco</option><option>Casa con mancuernas y bandas (sin banco)</option><option>Sin material</option></select></div>
      <div class="fg-item"><div class="flbl">Fecha inicio bloque</div><input class="finp" id="nc-inicio" type="date"></div>
      <div class="fg-item full"><div class="flbl">Lesiones / molestias</div><textarea class="finp" id="nc-lesiones" rows="2" placeholder="Ninguna"></textarea></div>
      <div class="fg-item full"><div class="flbl">Intolerancias / alergias</div><textarea class="finp" id="nc-intol" rows="2" placeholder="Ninguna"></textarea></div>
      <div class="fg-item full"><div class="flbl">Notas adicionales</div><textarea class="finp" id="nc-notas" rows="2"></textarea></div>
    </div>
    <button class="btn bp bf" style="margin-top:12px" onclick="crearCliente()">Crear cliente ✓</button>
  </div></div>
  
  `;
}

function crearCliente(){
  const g=id=>document.getElementById(id)?.value?.trim();
  const nom=g('nc-nom'),email=g('nc-email'),tipo=g('nc-tipo')||'uno';
  if(!nom||!email){toast('Nombre y email son obligatorios','rj');return;}
  const peso=parseFloat(g('nc-peso'))||80;
  const obj=parseFloat(g('nc-obj'))||Math.round(peso*0.9);
  const dias=parseInt(g('nc-dias'))||4;
  const kcal=parseInt(g('nc-kcal'))||2000;
  const pasos=parseInt(g('nc-pasos'))||(tipo==='uno'?10000:8000);
  const p=Math.round(peso*1.73),gf=60,c=p;
  const kcalReal=p*4+gf*9+c*4;
  const init=nom.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const id=nom.toLowerCase().replace(/\s+/g,'_').replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n').replace(/[^a-z_]/g,'')+'_'+Date.now().toString().slice(-4);
  const rs=tipo==='programa'?[4,8,12,14]:[3,7,11,13];
  const inicio=g('nc-inicio')||new Date().toISOString().split('T')[0];
  const nuevo={
    id,nom,init,tipo,email,
    fechaNac:g('nc-fnac')||'',
    altura:parseInt(g('nc-altura'))||175,
    lesiones:g('nc-lesiones')||'',intolerancias:g('nc-intol')||'',
    comentario:g('nc-notas')||'',
    objetivo:'Perder grasa y definir',actividad:'moderado',
    equipamiento:g('nc-equip')||'Gimnasio completo',
    diasSemana:dias,comidas:'3 comidas',
    semana:1,semTotal:tipo==='programa'?14:13,
    pesoIni:peso,pesoAct:peso,obj,pasosObj:pasos,
    adh:0,checkInDone:false,revDone:false,nextRev:rs[0],
    diasSinPeso:0,inicioBloque:inicio,
    macros:{kcal:kcal||kcalReal,p,c,g:gf},
    bajanSem:0.7,histPesos:[{f:inicio,v:peso}],
    checkIn:null,revision:null,
    entrenador:'alvaro',bloque:1,bloqueHistorial:[],
    planPublicado:false,
  };
  C.push(nuevo);updateBadges();
  // Also create in BD
  if(API_TOKEN){
    apiCall('POST','/api/clientes',{
      nombre:nom,email:email,tipo:tipo==='uno'?'1a1':'programa',
      peso:peso,altura:parseInt(g('nc-altura'))||175,
      objetivo:'def',actividad:1.375,comidas:3,
      dias_entreno:dias,lugar:g('nc-equip')||'gym',nivel:1,
      lesiones:g('nc-lesiones')||'',
      fecha_inicio:g('nc-inicio')||new Date().toISOString().split('T')[0],
      semanas_bloque:tipo==='uno'?13:14,
    }).then(r=>toast('✅ '+nom+' creado en BD también','vd'))
      .catch(e=>console.warn('[API] crear cliente:',e.message));
  }
  toast('✅ '+nom+' añadido','vd');
  nav(tipo==='uno'?'uno':'prog');
}

// ═══ INIT ═══
window.addEventListener('DOMContentLoaded',async()=>{
  updateBadges();
  // Always show login — token validated server-side
  // This prevents auto-login when sharing device or switching trainers
  if(API_TOKEN){
    try{
      // Validate token is still valid before auto-logging in
      await apiCall('GET','/api/clientes?limit=1');
      // Token valid — auto-login ok
      nav('ci');
      await loadClientesFromAPI();
      // Restore last open client only if trainer matches
      try{
        const savedCli=localStorage.getItem('ef_cli');
        const savedTab=localStorage.getItem('ef_tab')||'resumen';
        if(savedCli&&byId(savedCli)){
          CLI_ID=savedCli;CLI_TAB=savedTab;
          VIEW='client';
          const ct=document.getElementById('ct');
          if(ct)renderClient(ct);
        }
      }catch(e){}
    }catch(e){
      // Token invalid or expired — force login
      API_TOKEN=null;
      localStorage.removeItem('ef_token');
      localStorage.removeItem('ef_role');
      localStorage.removeItem('ef_cli');
      showLogin();
    }
  } else {
    showLogin();
  }
});

function logout(){
  API_TOKEN=null;API_ROLE=null;
  window.ENTRENADOR_ACTIVO=null;
  localStorage.removeItem('ef_token');
  localStorage.removeItem('ef_role');
  localStorage.removeItem('ef_cli');
  localStorage.removeItem('ef_tab');
  location.reload();
}
