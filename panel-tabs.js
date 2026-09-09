var MEAL_NOMS_MAP={desayuno:'☀️ Desayuno',comida:'🌞 Comida',cena:'🌙 Cena',snack:'🍎 Snack',snack_am:'🍎 Snack mañana',snack_pm:'🍎 Snack tarde',post_entreno:'💪 Post-entreno',desayuno_extra:'☀️ Desayuno extra',comida_extra:'🌞 Comida extra',cena_extra:'🌙 Cena extra'};

// ═══ TAB: FORMULARIO INICIAL ═══
function tFormulario(c){
  const n=c.notas||{};
  const NIVEL_NOM={0:'Principiante (0-1 año)',1:'Intermedio (1-3 años)',2:'Avanzado (3+ años)'};
  const LUGAR_NOM={gym:'Gimnasio completo',sinmat:'Casa sin material',casa_sin:'Casa sin material',band:'Casa con bandas',casa_bandas:'Casa con bandas',bym:'Casa con bandas y mancuernas',casa_mancuernas:'Casa con mancuernas'};
  const ACT_NOM={'1.2':'Sedentario','1.375':'Ligeramente activo','1.55':'Moderadamente activo','1.725':'Muy activo'};

  function row(label, val){
    if(!val&&val!==0)return'';
    return'<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--bor)">'+
      '<div style="width:160px;font-size:11px;font-weight:700;color:var(--t3);flex-shrink:0">'+label+'</div>'+
      '<div style="font-size:13px;color:var(--t1)">'+val+'</div>'+
    '</div>';
  }

  function section(title, rows){
    const content=rows.filter(Boolean).join('');
    if(!content)return'';
    return'<div class="card" style="margin-bottom:12px">'+
      '<div class="ch"><span style="font-weight:700;font-size:13px">'+title+'</span></div>'+
      '<div class="cb" style="padding:0 14px">'+content+'</div>'+
    '</div>';
  }

  // Parse datos personales
  const fechaNac=c.fechaNac?c.fechaNac.split('T')[0].split('-').reverse().join('/'):'—';
  const edad=c.fechaNac?Math.floor((new Date()-new Date(c.fechaNac))/31557600000)+'años':'—';

  const personal=section('👤 Datos personales',[
    row('Nombre',c.nom),
    row('Email',c.email),
    row('Tipo de plan',c.tipo==='uno'?'1:1 Coaching':'Programa Grupal'),
    row('Fecha nacimiento',fechaNac+' ('+edad+')'),
    row('Peso inicial',c.pesoIni?c.pesoIni+'kg':'—'),
    row('Altura',c.altura?c.altura+'cm':'—'),
    row('Objetivo peso',c.obj?c.obj+'kg':'—'),
  ]);

  const entreno=section('🏋️ Entrenamiento',[
    row('Días entreno/sem',c.diasSemana||n.dias_entreno),
    row('Lugar',LUGAR_NOM[n.lugar]||LUGAR_NOM[c.equipamiento]||n.lugar||c.equipamiento),
    row('Tiempo por sesión',(c.tiempoEnt||n.tiempo_ent)?(c.tiempoEnt||n.tiempo_ent)+'min':'—'),
    row('Nivel',NIVEL_NOM[c.nivel]||NIVEL_NOM[n.nivel]||n.nivel),
    row('Material libre',n.material_libre||'—'),
  ]);

  const actVal=c.actividad||n.actividad;
  const nutri=section('🥗 Nutrición y salud',[
    row('Nº comidas/día',c.comidas||n.comidas),
    row('Actividad diaria',ACT_NOM[String(actVal)]||String(actVal)),
    row('Objetivo',n.objetivo==='def'?'Bajar grasa (déficit)':n.objetivo==='sup'?'Ganar músculo (superávit)':n.objetivo||'—'),
    row('Fecha inicio deseada',n.fecha_inicio_deseada||'—'),
  ]);

  const salud=section('🩺 Salud',[
    row('Lesiones/molestias',c.lesiones||'Ninguna'),
    row('Alimentos a excluir',n.excluir_alimentos&&n.excluir_alimentos.length?n.excluir_alimentos.join(', '):'Ninguno'),
    row('Patología',n.patologia||'Ninguna'),
    row('Comentarios',n.comentarios||'—'),
  ]);

  const medidas=c.medidasS0&&Object.keys(c.medidasS0).length?section('📏 Medidas S0',
    Object.entries(c.medidasS0).map(([k,v])=>row(k,typeof v==='object'?Object.values(v)[0]+' cm':v+' cm'))
  ):'';

  const fotos=n.fotos_count>0?'<div class="alert aaz" style="margin-bottom:12px">📸 '+n.fotos_count+' foto(s) enviadas con el formulario</div>':'';

  if(!personal&&!entreno&&!nutri&&!salud){
    return'<div style="padding:20px;color:var(--t3);text-align:center">Este cliente no fue creado mediante formulario o no hay datos del formulario disponibles.</div>';
  }

  return'<div style="padding:16px">'+fotos+personal+entreno+nutri+salud+medidas+'</div>';
}

// ═══ TAB: RESUMEN ═══
function tResumen(c){
  const now=new Date();
  const hist=c.histPesos||[];
  const last7=hist.filter(p=>{const d=new Date(p.f);return(now-d)/(1000*60*60*24)<=7;});
  const pesoMedio=last7.length?+(last7.reduce((s,p)=>s+p.v,0)/last7.length).toFixed(1):c.pesoAct;
  const cambio=+(pesoMedio-c.pesoIni).toFixed(1);
  const objKg=Math.round(c.obj*10)/10;
  const left=+(pesoMedio-objKg).toFixed(1);
  const sems=Math.max(c.semana-1,1);
  const bajaSem=sems>0?+(((c.pesoIni-pesoMedio)/sems)).toFixed(2):0;
  const totalDiff=Math.abs(c.pesoIni-c.obj)||1;
  const pct=Math.min(100,Math.round(Math.abs(cambio)/totalDiff*100));
  return`
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div>
      <div class="sec-t">Peso corporal</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
        <div class="rs-box"><div class="rs-v" style="color:var(--az2);font-size:16px">${c.pesoIni}</div><div class="rs-l">Inicio kg</div></div>
        <div class="rs-box" style="border:2px solid var(--az)"><div class="rs-v" style="color:var(--az);font-size:18px">${pesoMedio}</div><div class="rs-l">Actual kg<br><span style="font-size:8px;color:var(--t3)">media 7d</span></div></div>
        <div class="rs-box"><div class="rs-v" style="color:${cambio<0?'var(--vd)':'var(--rj)'};font-size:16px">${cambio}</div><div class="rs-l">Cambio kg</div></div>
        <div class="rs-box"><div class="rs-v" style="color:var(--vd);font-size:16px">${objKg}</div><div class="rs-l">Objetivo kg</div></div>
        <div class="rs-box"><div class="rs-v" style="color:var(--az);font-size:16px">${bajaSem}</div><div class="rs-l">Ritmo kg/sem</div></div>
        <div class="rs-box" style="min-width:120px">
          <div class="rs-v" style="color:var(--az);font-size:13px">${{deficit:'📉 Déficit',reconstruccion:'🔄 Reconstrucción',superavit:'📈 Superávit'}[c.fase||'deficit']||'📉 Déficit'}</div>
          <div class="rs-l">Fase actual</div>
        </div>
        ${c.objSemKg!=null?`<div class="rs-box"><div class="rs-v" style="color:${c.objSemKg<0?'var(--vd)':c.objSemKg>0?'var(--rj)':'var(--t3)'}">${c.objSemKg>0?'+':''}${c.objSemKg} kg</div><div class="rs-l">Objetivo sem.</div></div>`:''}
      </div>
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--t3);margin-bottom:4px">
          <span>Progreso hacia objetivo</span>
          <span style="font-weight:700;color:var(--vd)">${pct}%</span>
        </div>
        <div class="pb" style="height:8px"><div class="pf" style="width:${pct}%;background:var(--vd)"></div></div>
        <div style="font-size:10px;color:var(--t3);margin-top:3px">${left>0?left+' kg restantes':'✅ Objetivo alcanzado'} · ${bajaSem} kg/sem</div>
      </div>
      <div style="margin-bottom:12px">${miniChart(c)}</div>
      <div class="sec-t">Adherencia</div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:32px;font-weight:800;color:${adhCol(c.adh)}">${Math.round(c.adh*100)}%</div>
        <div style="flex:1">
          <div class="pb" style="height:8px"><div class="pf" style="width:${Math.round(c.adh*100)}%;background:${adhCol(c.adh)}"></div></div>
          <div style="font-size:10px;color:var(--t3);margin-top:3px">${c.adh>=0.8?'🟢 Excelente':c.adh>=0.6?'🟡 Mejorable':'🔴 Baja'}</div>
        </div>
      </div>
    </div>
    <div>
      <div class="sec-t">Estado del plan</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
        <div class="rs-box"><div class="rs-v" style="color:var(--az2);font-size:20px">S${c.semana}</div><div class="rs-l">Semana actual</div></div>
        <div class="rs-box"><div class="rs-v" style="color:var(--t2);font-size:18px">S${c.nextRev}</div><div class="rs-l">Próx. revisión</div></div>
        <div class="rs-box"><div class="rs-v" style="color:var(--az);font-size:18px">B${c.bloque||1}</div><div class="rs-l">Bloque actual</div></div>
        <div class="rs-box"><div class="rs-v" style="color:var(--t2);font-size:18px">${c.diasSemana||4}d</div><div class="rs-l">Días entreno</div></div>
      </div>
      <div class="sec-t">Objetivos diarios</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
        <div class="rs-box"><div style="font-size:16px;font-weight:800;color:var(--vd)">${c.pasosObj?.toLocaleString('es')||'—'}</div><div class="rs-l">Pasos/día</div></div>
        <div class="rs-box"><div style="font-size:11px;font-weight:700;color:var(--t2);line-height:1.3">${c.equipamiento?.split(' ').slice(0,4).join(' ')||'—'}</div><div class="rs-l">Material</div></div>
      </div>
      ${c.lesiones?`<div style="background:var(--am2);border-left:3px solid var(--am);border-radius:0 8px 8px 0;padding:9px 12px;font-size:12.5px;margin-bottom:8px">🩹 <b>Lesiones:</b> ${c.lesiones}</div>`:''}
      ${c.intolerancias?`<div style="background:var(--rj2);border-left:3px solid var(--rj);border-radius:0 8px 8px 0;padding:9px 12px;font-size:12.5px;margin-bottom:8px">⚠️ <b>Intolerancias:</b> ${c.intolerancias}</div>`:''}
      ${c.comentario?`<div style="background:var(--bg);border-left:3px solid var(--az2);border-radius:0 8px 8px 0;padding:9px 12px;font-size:12px;color:var(--t2);margin-bottom:8px;font-style:italic">"${c.comentario}"</div>`:''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn ${c.planPublicado?'bo':'bp'}" onclick="togglePublicar('${c.id}')">
          ${c.planPublicado?'⬇️ Despublicar':'🚀 Publicar al cliente'}
        </button>

      </div>
    </div>
  </div>`;
}
function buildCambiosLog(c){
  const cambios=c.cambiosLog||[];
  if(!cambios.length){
    return'<div style="margin-top:14px"><div class="sec-t">Historial de cambios</div><div style="font-size:12px;color:var(--t3);padding:8px 0">Sin cambios registrados aún. Los cambios se registran automáticamente al guardar.</div></div>';
  }
  let h='<div style="margin-top:14px"><div class="sec-t">Historial de cambios</div><div style="border:1px solid var(--bor);border-radius:8px;overflow:hidden">';
  cambios.slice().reverse().forEach(function(c,i){
    h+='<div style="padding:9px 12px;'+(i>0?'border-top:1px solid var(--bor2)':'')+'display:flex;gap:10px;align-items:flex-start">';
    h+='<div style="font-size:10px;color:var(--t3);white-space:nowrap;min-width:80px">'+c.fecha+'</div>';
    h+='<div style="font-size:12px;color:var(--t2)">'+c.descripcion+'</div>';
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

function registrarCambio(cliId, descripcion){
  const c=byId(cliId);if(!c)return;
  if(!c.cambiosLog)c.cambiosLog=[];
  const fecha=new Date().toLocaleDateString('es-ES');
  c.cambiosLog.push({fecha,descripcion});
  if(c.cambiosLog.length>50)c.cambiosLog.shift();
  // Sync to API
  if(API_TOKEN)apiCall('POST','/api/clientes/'+cliId+'/cambio',{descripcion}).catch(()=>{});
}

function togglePublicar(id){
  const c=byId(id);if(!c)return;
  c.planPublicado=!c.planPublicado;
  toast(c.planPublicado?'✅ Plan publicado — el cliente ya puede verlo':'Plan despublicado',c.planPublicado?'vd':'');
  // Sync to API
  if(API_TOKEN)apiCall('PATCH',`/api/clientes/${id}`,{plan_publicado:c.planPublicado}).catch(e=>console.warn('[API] toggle:',e));
  render();
}

// ═══ TAB: CHECK-IN ═══
function tCheckin(c){
  // Load checkins from BD if not loaded
  if(!c._ciLoaded&&API_TOKEN){
    c._ciLoaded=true;
    apiCall('GET','/api/entreno/checkins/'+c.id).then(function(rows){
      if(rows&&rows.length){
        c.checkIns=rows;
        c.checkIn=rows[0]; // most recent
        c.checkInDone=true;
        // Calculate adherencia from last check-in
        var ci=rows[0];
        var ne=c.diasSemana||4;
        var pEnt=Math.min(1,(ci.dias_entreno_real||0)/ne)*40;
        var pNut=Math.min(1,(ci.dias_nutricion||0)/7)*40;
        var pPas=Math.min(1,(ci.dias_pasos||0)/7)*20;
        c.adh=Math.round(pEnt+pNut+pPas);
        setTab('checkin');
      }
    }).catch(function(){});
  }

  if(!c.checkInDone||!c.checkIn){
    return'<div style="text-align:center;padding:40px;color:var(--t3)">'
      +'<div style="font-size:48px;margin-bottom:12px">⏳</div>'
      +'<div style="font-size:16px;font-weight:700">Check-in pendiente</div>'
      +'<div style="font-size:13px;margin-top:6px">El cliente aún no lo ha enviado esta semana.</div>'
    +'</div>';
  }

  var ci=c.checkIn;
  var ne=c.diasSemana||4;
  var diasEnt=ci.dias_entreno_real||ci.diasEnt||0;
  var diasNut=ci.dias_nutricion||ci.diasNut||0;
  var diasPas=ci.dias_pasos||ci.diasPasos||0;
  var pEnt=Math.min(1,diasEnt/ne)*40;
  var pNut=Math.min(1,diasNut/7)*40;
  var pPas=Math.min(1,diasPas/7)*20;
  var adh=Math.round(pEnt+pNut+pPas);
  var adhCol=adh>=80?'var(--vd)':adh>=50?'var(--nr)':'var(--rj)';

  var html='<div style="padding:4px">';

  // Adherencia header
  html+='<div style="background:var(--az3);border-radius:12px;padding:16px;text-align:center;margin-bottom:14px">'
    +'<div style="font-size:11px;color:var(--t3);margin-bottom:4px">ADHERENCIA SEMANAL</div>'
    +'<div style="font-size:42px;font-weight:900;color:'+adhCol+'">'+adh+'%</div>'
    +'<div style="display:flex;justify-content:center;gap:6px;margin-top:8px">'
      +'<div class="badge" style="background:var(--az2)">🏋️ '+diasEnt+'/'+ne+'</div>'
      +'<div class="badge" style="background:var(--vd)">🥗 '+diasNut+'/7</div>'
      +'<div class="badge" style="background:var(--nr)">👟 '+diasPas+'/7</div>'
    +'</div>'
  +'</div>';

  // Desglose barras
  html+='<div class="sec-t" style="margin-bottom:8px">Desglose</div>';
  var bars=[
    ['🏋️ Entrenos',diasEnt,ne,adh>=0],
    ['🥗 Nutrición',diasNut,7,true],
    ['👟 Pasos',diasPas,7,true],
  ];
  bars.forEach(function(b){
    var pct=Math.round(b[1]/b[2]*100);
    var col=pct>=80?'var(--vd)':pct>=50?'var(--nr)':'var(--rj)';
    html+='<div style="margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">'
        +'<span>'+b[0]+'</span><span style="font-weight:700">'+b[1]+'/'+b[2]+' ('+pct+'%)</span>'
      +'</div>'
      +'<div style="background:var(--bor);border-radius:4px;height:8px">'
        +'<div style="background:'+col+';height:8px;border-radius:4px;width:'+Math.min(100,pct)+'%"></div>'
      +'</div>'
    +'</div>';
  });

  // Respuestas del 1:1
  if(c.tipo==='uno'){
    html+='<div class="sec-t" style="margin-top:14px;margin-bottom:8px">Respuestas</div>';
    var pregs=[
      ['¿Cómo fue la semana?', ci.como_semana||ci.como||''],
      ['Orgullo de la semana', ci.orgullos||ci.orgullo||''],
      ['Compromiso esta semana', ci.compromisos||ci.compromiso||''],
      ['Sensaciones generales', ci.sensaciones||''],
    ];
    pregs.forEach(function(p){
      if(!p[1])return;
      html+='<div style="background:var(--bg);border-radius:8px;padding:10px;margin-bottom:8px">'
        +'<div style="font-size:10px;font-weight:700;color:var(--t3);margin-bottom:4px">'+p[0].toUpperCase()+'</div>'
        +'<div style="font-size:13px;color:var(--t1)">'+p[1]+'</div>'
      +'</div>';
    });
  }

  // Historial de check-ins
  if(c.checkIns&&c.checkIns.length>1){
    html+='<div class="sec-t" style="margin-top:14px;margin-bottom:8px">Historial (últimas semanas)</div>';
    c.checkIns.slice(0,8).forEach(function(r,i){
      var dE=r.dias_entreno_real||0;
      var dN=r.dias_nutricion||0;
      var dP=r.dias_pasos||0;
      var a=Math.round(Math.min(1,dE/ne)*40+Math.min(1,dN/7)*40+Math.min(1,dP/7)*20);
      var col=a>=80?'var(--vd)':a>=50?'var(--nr)':'var(--rj)';
      var fecha=r.semana_inicio?new Date(r.semana_inicio).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'}):'S?';
      html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bor2)">'
        +'<div style="font-size:11px;color:var(--t3);min-width:40px">'+fecha+'</div>'
        +'<div style="flex:1;background:var(--bor);border-radius:3px;height:6px">'
          +'<div style="background:'+col+';height:6px;border-radius:3px;width:'+a+'%"></div>'
        +'</div>'
        +'<div style="font-size:12px;font-weight:700;color:'+col+';min-width:36px;text-align:right">'+a+'%</div>'
      +'</div>';
    });
  }

  html+='</div>';
  return html;
}


function tRevision(c){
  const nextRev=c.nextRev,rev=c.revision;
  const sems=Math.max(c.semana-1,1);
  const bajaTot=(c.pesoIni-c.pesoAct).toFixed(1);
  const bajaSem=((c.pesoIni-c.pesoAct)/sems).toFixed(2);
  const isFinalRev=(c.tipo==='programa'&&c.nextRev===12)||(c.tipo==='uno'&&c.nextRev===11);
  const PP=c.tipo==='programa'?(isFinalRev?PP_PROG_FINAL:PP_PROG):(isFinalRev?PP_UNO_FINAL:PP_UNO);

  // Build peso grid table: días en filas, semanas en columnas
  const pesoRows=c.histPesos&&c.histPesos.length?c.histPesos:[];
  const pesoTableHTML=buildPesoGrid(pesoRows,c.inicioBloque);

  const statsH=`<div class="rs4" style="margin-bottom:10px">
    <div class="rs-box"><div class="rs-v" style="color:var(--az2)">${c.pesoIni}kg</div><div class="rs-l">Peso inicial</div></div>
    <div class="rs-box"><div class="rs-v" style="color:var(--vd)">${bajaTot}kg</div><div class="rs-l">Bajada total</div></div>
    <div class="rs-box"><div class="rs-v" style="color:var(--nr)">${bajaSem}kg</div><div class="rs-l">Media/semana</div></div>
    <div class="rs-box"><div class="rs-v" style="color:var(--az)">${sems}</div><div class="rs-l">Semanas</div></div>
  </div>
  <div class="sec-t">Evolución del peso</div>
  <div style="margin-bottom:10px">${miniChart(c)}</div>
  <div class="sec-t" style="margin-bottom:6px">Registro de pesos <button class="btn bo bs" style="float:right;margin-top:-4px" onclick="loadPesosCliente('${c.id}')">🔄 Actualizar</button></div>
  ${buildPesoGrid(c.histPesos&&c.histPesos.length?c.histPesos:[],c.inicioBloque,c.semana,c.semTotal||13)}`;

  // Auto-load pesos if empty
    
    
  if(!c.histPesos||!c.histPesos.length){
    if(API_TOKEN)apiCall('GET','/api/entreno/pesos/'+c.id).then(rows=>{
      if(rows&&rows.length){c.histPesos=rows.map(r=>({f:new Date(r.fecha).toISOString().split('T')[0],v:parseFloat(r.peso)}));setTab('revision');}
    }).catch(()=>{});
  }
  // Auto-load revisiones y fotos si no están cargadas
  if(!c._revLoaded&&API_TOKEN){
    c._revLoaded=true;
    apiCall('GET','/api/entreno/revisiones/'+c.id).then(function(rows){
      if(!rows||!rows.length)return;
      if(!c.revision)c.revision={fotos:{},medidas:{}};
      if(!c.revision.fotos)c.revision.fotos={};
      var PM={frente:0,perfil_d:1,perfil_i:2,espalda:3};
      rows.forEach(function(r){
        var sem=r.semana;
        var fotos=typeof r.fotos==='string'?JSON.parse(r.fotos||'{}'):r.fotos||{};
        Object.entries(fotos).forEach(function(e){
          var pi=PM[e[0]];
          if(e[1])c.revision.fotos[pi!==undefined?'s'+sem+'_'+pi:'s'+sem+'_'+e[0]]=e[1];
        });
      });
      setTab('revision');
    }).catch(function(){});
  }


  // FOTOS: cada postura en su fila, S0 vs actual lado a lado
  // object-fit:cover + object-position: permite crop manual
  // All revision slots for this tipo
  const allRevSems=c.tipo==='programa'?[0,4,8,12]:[0,3,7,11];
  const revLabels={0:'S0 Inicio',4:'S4',8:'S8',12:'S12',3:'S3',7:'S7',11:'S11'};
  const revCols=['#0DBF6F','#2E6DA4','#9B59B6','#E74C3C'];
  const fotosH=`<div class="sec-t" style="margin-bottom:8px">Comparativa fotos — todas las revisiones <span style="font-weight:400;font-size:9.5px">(hover → ajustar crop)</span></div>
  <div style="margin-bottom:14px">
    ${POSES.map((pos,pi)=>`
    <div class="rev-pose-row">
      <div class="rev-pose-lbl">${pos}</div>
      <div class="rev-photos-row" style="grid-template-columns:repeat(${allRevSems.length},1fr)">
        ${allRevSems.map((rs,ri)=>{
          const isActive=rs===c.nextRev;
          const fotoKey='s'+rs+'_'+pi;
          const hasFoto=rev?.fotos?.[fotoKey];
          const locked=rs>c.semana&&rs!==0;
          return`<div>
            <div style="font-size:9px;font-weight:700;color:#fff;background:${revCols[ri]||'var(--az2)'};padding:3px 8px;border-radius:4px;display:inline-block;margin-bottom:4px;opacity:${locked?.5:1}">${revLabels[rs]||'S'+rs}${isActive?' ●':''}</div>
            <div class="photo-slot${hasFoto?' has':''}${locked?' locked':''}">
              ${hasFoto
                ?`<div class="ph-img-wrap" id="phw-${rs}-${pi}" style="cursor:grab"
                     onmousedown="phStartDrag(event,'ph-${rs}-${pi}')"
                     ontouchstart="phStartDrag(event,'ph-${rs}-${pi}')">
                     <img src="${hasFoto}" id="ph-${rs}-${pi}"
                       style="transform:scale(1) translateX(0px) translateY(0px)"
                       data-scale="1" data-tx="0" data-ty="0">
                   </div>
                   <div class="ph-zoom-bar">
                     <button class="ph-zoom-btn" onclick="phZoom('ph-${rs}-${pi}',0.15)" title="Zoom +">+</button>
                     <button class="ph-zoom-btn" onclick="phZoom('ph-${rs}-${pi}',-0.15)" title="Zoom −">−</button>
                     <button class="ph-zoom-btn" onclick="phZoom('ph-${rs}-${pi}',0,'up')" title="Subir">↑</button>
                     <button class="ph-zoom-btn" onclick="phZoom('ph-${rs}-${pi}',0,'down')" title="Bajar">↓</button>
                     <button class="ph-zoom-btn" onclick="phZoom('ph-${rs}-${pi}',0,'reset')" title="Reset" style="font-size:9px">↺</button>
                   </div>
                   <div class="ph-lbl">${revLabels[rs]||'S'+rs}</div>
                   <button onclick="deleteRevPhoto('${c.id}',${rs},${pi})" style="position:absolute;top:4px;left:4px;background:rgba(220,50,50,.85);border:none;border-radius:4px;color:#fff;font-size:11px;cursor:pointer;padding:2px 5px;z-index:20;opacity:0;transition:opacity .2s" class="ph-del-btn" title="Eliminar foto">🗑</button>`
                :`<div class="ph-empty" ${!locked?`onclick="uploadRevPhoto('${c.id}','${rs}',${pi})" style="cursor:pointer" title="Click para subir foto"`:''}><span style="font-size:20px">📷</span><span style="font-size:10px">${locked?'🔒':'📤 Subir'}</span></div>`
              }
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('')}
  </div>`;

  // Medidas en tabla horizontal comparativa
  const MEDS=[['peso','Peso','kg'],['pecho','Pecho','cm'],['cintura','Cintura','cm'],['cadera','Cadera','cm'],['biceps','Bíceps','cm'],['muslo','Muslo','cm'],['gemelo','Gemelo','cm']];
  const medsH=buildMedidasHTML(c);

  const respsH=`<div class="sec-t" style="margin-bottom:8px">Preguntas de revisión</div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
    ${PP.map((q,i)=>{
      const ans=rev?.preguntas?.[i]||'';
      return`<div style="background:var(--bg);border-radius:8px;padding:10px;border:1px solid var(--bor)">
        <div style="font-size:11px;font-weight:700;color:var(--t3);margin-bottom:4px">P${i+1}. ${q[0]}</div>
        <div style="font-size:13px;color:${ans?'var(--t1)':'var(--bor)'}">${ans||'Sin respuesta aún'}</div>
      </div>`;
    }).join('')}
  </div>`;

  const fbH=`<div class="sec-t" style="margin-bottom:6px">Notas del entrenador</div>
  <div style="border:1.5px solid var(--bor);border-radius:8px;padding:10px;margin-bottom:14px">
    <textarea id="notas-ent-${c.id}" placeholder="Observaciones privadas..."
      style="width:100%;border:none;outline:none;font-family:inherit;font-size:13px;resize:none;min-height:60px;background:transparent"
      onblur="guardarNotasEnt('${c.id}',this.value)">${c.notasRevision||''}</textarea>
  </div>`;

  return`${statsH}${medsH}${fotosH}${respsH}${fbH}`;
}

function uploadRevPhoto(cliId, rev, pose){
  // Create hidden file input
  const inp=document.createElement('input');
  inp.type='file';inp.accept='image/*';
  inp.onchange=async(e)=>{
    const file=e.target.files[0];if(!file)return;
    // Read as base64
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      const b64=ev.target.result;
      const c=byId(cliId);if(!c)return;
      if(!c.revision)c.revision={fotos:{},medidas:{},preguntas:{}};
      if(!c.revision.fotos)c.revision.fotos={};
      const key='s'+rev+'_'+pose;
      c.revision.fotos[key]=b64;
      toast('Foto guardada ✓','vd');
      setTab('revision');
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function deleteRevPhoto(cliId,rev,pose){
  if(!confirm('¿Eliminar esta foto? No se puede deshacer.'))return;
  const c=byId(cliId);if(!c||!c.revision?.fotos)return;
  delete c.revision.fotos['s'+rev+'_'+pose];
  toast('Foto eliminada','');setTab('revision');
}
function phStartDrag(e,id){
  const img=document.getElementById(id);if(!img)return;
  e.preventDefault();const it=e.touches;
  const sx=it?e.touches[0].clientX:e.clientX;const sy=it?e.touches[0].clientY:e.clientY;
  const tx=parseFloat(img.dataset.tx||0);const ty=parseFloat(img.dataset.ty||0);
  const sc=parseFloat(img.dataset.scale||1);
  const wrap=img.closest('.ph-img-wrap');if(wrap)wrap.style.cursor='grabbing';
  function mv(ev){
    const cx=it?ev.touches[0].clientX:ev.clientX;const cy=it?ev.touches[0].clientY:ev.clientY;
    const nx=tx+(cx-sx);const ny=ty+(cy-sy);
    img.dataset.tx=nx;img.dataset.ty=ny;
    img.style.transform='scale('+sc+') translateX('+nx+'px) translateY('+ny+'px)';
  }
  function up(){
    document.removeEventListener(it?'touchmove':'mousemove',mv);
    document.removeEventListener(it?'touchend':'mouseup',up);
    if(wrap)wrap.style.cursor='grab';
  }
  document.addEventListener(it?'touchmove':'mousemove',mv,{passive:false});
  document.addEventListener(it?'touchend':'mouseup',up);
}
function phZoom(id,delta,dir){
  const img=document.getElementById(id);if(!img)return;
  let sc=parseFloat(img.dataset.scale)||1;
  let tx=parseFloat(img.dataset.tx)||0;
  let ty=parseFloat(img.dataset.ty)||0;
  if(dir==='reset'){sc=1;tx=0;ty=0;}
  else if(dir==='up'){ty-=20;}
  else if(dir==='down'){ty+=20;}
  else if(dir==='left'){tx-=20;}
  else if(dir==='right'){tx+=20;}
  else{sc=Math.max(0.5,Math.min(4,sc+delta));}
  img.dataset.scale=sc;img.dataset.tx=tx;img.dataset.ty=ty;
  img.style.transform=`scale(${sc}) translateX(${tx/sc}px) translateY(${ty/sc}px)`;
}

function editPesoCell(td, cliId, semana, dia){
  var current=td.textContent==='—'?'':td.textContent;
  var inp=document.createElement('input');
  inp.type='number';inp.step='0.1';inp.value=current;
  inp.style.cssText='width:52px;font-size:11px;text-align:center;border:1px solid var(--az);border-radius:4px;padding:2px 4px;background:#fff';
  td.innerHTML='';td.appendChild(inp);inp.focus();inp.select();
  function save(){
    var val=parseFloat(inp.value);
    if(isNaN(val)||val<=0){td.textContent=current||'—';return;}
    td.textContent=val;
    // Save to BD: find the date for this semana+dia and post peso
    var c=byId(cliId);
    if(!c||!c.inicioBloque){toast('Sin fecha de inicio de bloque','rj');return;}
    var fi=new Date(c.inicioBloque);
    // semana 1 = week starting at fi, dia 0=lunes
    var d=new Date(fi);d.setDate(d.getDate()+(semana-1)*7+dia);
    var fecha=d.toISOString().split('T')[0];
    apiCall('POST','/api/entreno/peso',{peso:val,fecha:fecha}).then(function(){
      toast('Peso guardado','vd');
      // Update histPesos in memory
      if(!c.histPesos)c.histPesos=[];
      var existing=c.histPesos.findIndex(function(p){return p.f===fecha;});
      if(existing>=0)c.histPesos[existing].v=val;
      else c.histPesos.push({f:fecha,v:val});
    }).catch(function(e){toast('Error: '+e.message,'rj');});
  }
  inp.addEventListener('blur',save);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')inp.blur();if(e.key==='Escape'){td.textContent=current||'—';}});
}

function buildPesoGrid(pesoRows,inicioBloque,semanaActual,semTotal){
  var DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  var fi=inicioBloque?new Date(inicioBloque):null;
  var pm={};
  var maxSem=semTotal||semanaActual||13; // Show all semanas of the block
  (pesoRows||[]).forEach(function(p){
    var d=new Date(p.f);var sem=1;
    if(fi){var diff=Math.floor((d-fi)/(7*24*60*60*1000));sem=Math.max(0,diff+1);}
    var dw=d.getDay();var di=dw===0?6:dw-1;
    if(!pm[sem])pm[sem]={};pm[sem][di]=p.v;
  });
  var sa=Array.from({length:maxSem},function(_,i){return i+1;}); // start from S1, skip S0
  var md={};
  sa.forEach(function(s){
    var vs=Object.values(pm[s]||{}).filter(function(v){return v>0;});
    md[s]=vs.length?+(vs.reduce(function(a,b){return a+b;},0)/vs.length).toFixed(1):null;
  });
  var h='<div style="overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;font-size:11px;min-width:'+(52+sa.length*54)+'px;width:100%">';
  h+='<thead><tr style="background:var(--az)"><th style="padding:4px 8px;text-align:left;color:rgba(255,255,255,.8);font-size:10px;position:sticky;left:0;background:var(--az)">Día</th>';
  sa.forEach(function(s){h+='<th style="padding:4px 8px;text-align:center;color:#fff;font-size:10px;min-width:50px">'+(s===0?'S0':'S'+s)+'</th>';});
  h+='</tr></thead><tbody>';
  DIAS.forEach(function(dia,di){
    h+='<tr><td style="padding:4px 8px;font-weight:700;font-size:10px;color:var(--t2);background:var(--bg);position:sticky;left:0">'+dia+'</td>';
    sa.forEach(function(s){
      var v=pm[s]&&pm[s][di]!=null?pm[s][di]:null;var m=md[s];
      var bg=v==null?'transparent':m&&v>m?'rgba(255,26,26,.1)':m&&v<m?'rgba(13,191,111,.1)':'transparent';
      var col=v==null?'#ccc':m&&v>m?'var(--rj)':m&&v<m?'var(--vd)':'var(--t1)';
      var cliIdForPeso=typeof CLI_ID!=='undefined'?CLI_ID:'';
      h+='<td style="padding:4px 6px;text-align:center;background:'+bg+';color:'+col+';font-weight:'+(v?'700':'400')+';cursor:pointer" onclick="editPesoCell(this,\''+cliIdForPeso+'\','+s+','+di+')">'+(v!=null?v:'—')+'</td>';
    });
    h+='</tr>';
  });
  h+='<tr style="background:var(--az3);border-top:2px solid var(--az4)"><td style="padding:4px 8px;font-weight:700;font-size:10px;color:var(--az);background:var(--az3);position:sticky;left:0">Media</td>';
  sa.forEach(function(s){h+='<td style="padding:4px 6px;text-align:center;font-weight:800;font-size:11px;color:var(--az)">'+(md[s]!=null?md[s]:'—')+'</td>';});
  h+='</tr><tr><td style="padding:4px 8px;font-weight:700;font-size:10px;color:var(--t3);background:#fff;position:sticky;left:0">Cambio</td>';
  sa.forEach(function(s,i){
    var c=md[s];var p=i>0?md[sa[i-1]]:null;var str='—',col='var(--t3)';
    if(c!=null&&p!=null){var dif=+(c-p).toFixed(1);str=(dif>0?'+':'')+dif;col=dif<0?'var(--vd)':dif>0?'var(--rj)':'var(--t3)';}
    h+='<td style="padding:4px 6px;text-align:center;font-weight:700;color:'+col+'">'+str+'</td>';
  });
  h+='</tr></tbody></table></div>';return h;
}


function buildMedidasHTML(c){
  const medRev=c.revision?.medidas&&Object.keys(c.revision.medidas).length>0?c.revision.medidas:null;
  const medS0=c.medidasS0&&Object.keys(c.medidasS0).length>0?c.medidasS0:null;
  const medidas=medRev||medS0;
  const s0badge=(!medRev&&medS0)?'<span style="font-size:9px;background:var(--vd);color:#fff;border-radius:4px;padding:1px 5px;margin-left:6px">S0 formulario</span>':'';
  const btn='<div style="text-align:right;margin-bottom:8px"><button class="btn bo bs" onclick="loadMedidasCliente(this.dataset.id)" data-id="'+c.id+'">📏 Cargar medidas</button></div>';
  // Always show table — empty if no data
  return'<div id="medidas-'+c.id+'">'+
    '<div style="text-align:right;margin-bottom:4px">'+s0badge+'</div>'+
    renderMedidasTable(medidas||{},c.id)+
    '</div>';
}

function renderMedidasTable(medidas,cliId){
  if(!medidas||typeof medidas!=='object')return'';
  // Canonical order with all key format mappings
  var CANONICAL=[
    {label:'Hombros',     keys:['hombros','hombros (zona más amplia)','hombros (zona mas amplia)','hombros']},
    {label:'Pecho',       keys:['pecho','pecho (altura de pezones)']},
    {label:'Brazo izq.',  keys:['brazoi','brazo izquierdo (zona más amplia)','brazo izquierdo (zona mas amplia)','brazo izq.']},
    {label:'Brazo dcho.', keys:['brazod','brazo derecho (zona más amplia)','brazo derecho (zona mas amplia)','brazo dcho.']},
    {label:'Cintura ombligo', keys:['cintura','abdomen (altura del ombligo)','cintura ombligo']},
    {label:'Muslo izq.',  keys:['musloi','muslo izquierdo (zona más amplia)','muslo izquierdo (zona mas amplia)','muslo izq.']},
    {label:'Muslo dcho.', keys:['muslod','muslo derecho (zona más amplia)','muslo derecho (zona mas amplia)','muslo dcho.']},
    {label:'Gemelo izq.', keys:['gemeloi','gemelo_i','gemelo izq.']},
    {label:'Gemelo dcho.',keys:['gemelod','gemelo_d','gemelo dcho.']},
  ];
  var sems=new Set(['S0','S4','S8','S12']);
  Object.values(medidas).forEach(function(v){if(typeof v==='object')Object.keys(v).forEach(function(k){sems.add(k);});});
  var sa=[...sems].sort(function(a,b){return parseInt(a.replace('S',''))-parseInt(b.replace('S',''));});
  var mf={};
  CANONICAL.forEach(function(c){
    var found=null;
    Object.keys(medidas).forEach(function(k){
      if(c.keys.indexOf(k.toLowerCase())>=0)found=k;
    });
    mf[c.label]=found?medidas[found]:{};
  });
  var rows='';
  Object.entries(mf).forEach(function(e,i){
    var nom=e[0],vals=e[1];
    var bg=i%2===0?'#fff':'var(--bg)';
    var cells='';
    var nums=[];
    sa.forEach(function(s){
      var v=typeof vals==='object'&&vals[s]!=null?vals[s]:null;
      nums.push(v);
      if(cliId){
        cells+='<td style="padding:3px 5px;text-align:center">'
          +'<input type="number" step="0.1" value="'+(v!=null?v:'')+'" placeholder="—" '
          +'data-cli="'+cliId+'" data-nom="'+nom.replace(/"/g,'&quot;')+'" data-sem="'+s+'" '
          +'style="width:50px;text-align:center;border:1px solid var(--bor);border-radius:4px;padding:3px;font-size:12px;font-weight:700" '
          +'onchange="editMedidaInput(this)"></td>';
      } else {
        cells+='<td style="padding:5px 10px;text-align:center;font-weight:700">'+(v!=null?v:'<span style="color:var(--bor2)">—</span>')+'</td>';
      }
    });
    var first=nums.find(function(v){return v!=null;});
    var last=[...nums].reverse().find(function(v){return v!=null;});
    var cambio=first!=null&&last!=null&&first!==last?+(last-first).toFixed(1):null;
    var col=cambio===null?'var(--t3)':cambio<0?'var(--vd)':cambio>0?'var(--rj)':'var(--t3)';
    rows+='<tr style="border-bottom:1px solid var(--bor2);background:'+bg+'">'
      +'<td style="padding:5px 10px;font-size:12px;font-weight:600;color:var(--t2)">'+nom+'</td>'
      +cells
      +'<td style="padding:5px 8px;text-align:center;font-weight:700;color:'+col+'">'+(cambio!==null?(cambio>0?'+':'')+cambio:'—')+'</td></tr>';
  });
  var hdrs=sa.map(function(s){return'<th style="padding:5px 10px;text-align:center;color:#fff;font-size:11px;min-width:58px">'+s+'</th>';}).join('');
  var saveBtn=cliId?'<button class="btn bo bs" style="float:right;margin-top:-2px;font-size:10px" data-cid="'+cliId+'" onclick="guardarMedidasBD(this.dataset.cid)">💾 Guardar</button>':'';
  return'<div class="sec-t" style="margin-bottom:6px">Medidas (cm)'+saveBtn+'</div>'
    +'<div style="overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;font-size:12px;width:100%">'
    +'<thead><tr style="background:var(--az)"><th style="padding:5px 10px;text-align:left;color:rgba(255,255,255,.8);font-size:10px;min-width:120px">Medida</th>'
    +hdrs+'<th style="padding:5px 8px;text-align:center;color:rgba(255,255,255,.8);font-size:10px">Δ</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>';
}

function editMedidaInput(inp){
  var cliId=inp.dataset.cli,nom=inp.dataset.nom,sem=inp.dataset.sem;
  var c=byId(cliId);if(!c)return;
  if(!c.revision)c.revision={medidas:{},preguntas:{},fotos:{}};
  if(!c.revision.medidas)c.revision.medidas={};
  if(!c.revision.medidas[nom])c.revision.medidas[nom]={};
  var prev=c.revision.medidas[nom][sem];
  var v=parseFloat(inp.value);
  var newVal=(!isNaN(v)&&v>0)?v:null;
  if(prev===newVal)return;
  UNDO_MED.push({cliId:cliId,nom:nom,sem:sem,v:prev!=null?prev:null});
  REDO_MED.length=0;
  if(UNDO_MED.length>50)UNDO_MED.shift();
  if(newVal!=null)c.revision.medidas[nom][sem]=newVal;
  else delete c.revision.medidas[nom][sem];
}
function medUndo(){
  if(!UNDO_MED.length){toast('Nada que deshacer en medidas','');return;}
  var s=UNDO_MED.pop();
  var c=byId(s.cliId);if(!c||!c.revision)return;
  var cur=c.revision.medidas[s.nom]?c.revision.medidas[s.nom][s.sem]:null;
  REDO_MED.push({cliId:s.cliId,nom:s.nom,sem:s.sem,v:cur});
  if(!c.revision.medidas[s.nom])c.revision.medidas[s.nom]={};
  if(s.v!=null)c.revision.medidas[s.nom][s.sem]=s.v;
  else delete c.revision.medidas[s.nom][s.sem];
  // Update input field
  var inp=document.querySelector('input[data-cli="'+s.cliId+'"][data-nom="'+s.nom+'"][data-sem="'+s.sem+'"]');
  if(inp)inp.value=s.v!=null?s.v:'';
  toast('↩ Medida deshecha','vd');
}
function medRedo(){
  if(!REDO_MED.length){toast('Nada que rehacer en medidas','');return;}
  var s=REDO_MED.pop();
  var c=byId(s.cliId);if(!c||!c.revision)return;
  var cur=c.revision.medidas[s.nom]?c.revision.medidas[s.nom][s.sem]:null;
  UNDO_MED.push({cliId:s.cliId,nom:s.nom,sem:s.sem,v:cur});
  if(!c.revision.medidas[s.nom])c.revision.medidas[s.nom]={};
  if(s.v!=null)c.revision.medidas[s.nom][s.sem]=s.v;
  else delete c.revision.medidas[s.nom][s.sem];
  var inp=document.querySelector('input[data-cli="'+s.cliId+'"][data-nom="'+s.nom+'"][data-sem="'+s.sem+'"]');
  if(inp)inp.value=s.v!=null?s.v:'';
  toast('↪ Medida rehecha','vd');
}


function editMedida(cliId,nom,semLabel,val){
  var c=byId(cliId);if(!c)return;
  if(!c.revision)c.revision={medidas:{},preguntas:{},fotos:{}};
  if(!c.revision.medidas)c.revision.medidas={};
  if(!c.revision.medidas[nom])c.revision.medidas[nom]={};
  var v=parseFloat(val);
  if(!isNaN(v)&&v>0)c.revision.medidas[nom][semLabel]=v;
  else delete c.revision.medidas[nom][semLabel];
}

function guardarMedidasBD(cliId){
  var c=byId(cliId);if(!c||!c.revision?.medidas)return;
  // Save each semana as a separate revision entry
  var medidas=c.revision.medidas;
  var semanas=new Set();
  Object.values(medidas).forEach(function(v){if(typeof v==='object')Object.keys(v).forEach(function(k){semanas.add(k);});});
  
  var promises=[...semanas].map(function(semLabel){
    var semNum=parseInt(semLabel.replace('S',''))||0;
    var medidasSem={};
    Object.entries(medidas).forEach(function(e){
      if(e[1][semLabel]!=null)medidasSem[e[0]]={[semLabel]:e[1][semLabel]};
    });
    return apiCall('POST','/api/entreno/revision-cliente',{
      cliente_id:cliId,semana:semNum,medidas:JSON.stringify(medidasSem),estado:'revisada'
    });
  });
  Promise.all(promises).then(function(){
    toast('Medidas guardadas ✓','vd');
    registrarCambio(cliId,'Medidas actualizadas');
  }).catch(function(e){toast('Error guardando: '+e.message,'rj');});
}


function loadMedidasCliente(cliId){
  apiCall('GET','/api/entreno/revisiones/'+cliId)
    .then(rows=>{
      if(!rows||!rows.length){toast('Sin medidas en BD','');return;}
      const c=byId(cliId);
      if(c){
        // Load fotos from all revisions into c.revision.fotos
        if(!c.revision)c.revision={fotos:{}};
        if(!c.revision.fotos)c.revision.fotos={};
        rows.forEach(function(rev){
          const sem=rev.semana;
          const fotos=typeof rev.fotos==='string'?JSON.parse(rev.fotos||'{}'):rev.fotos||{};
          Object.entries(fotos).forEach(([pose,url])=>{
            if(url)c.revision.fotos['s'+sem+'_'+pose]=url;
          });
        });
      }
      const s0=rows.find(r=>r.semana===0);
      if(!s0||!s0.medidas){
        const el=document.getElementById('medidas-'+cliId);
        if(el)el.innerHTML='<div style="padding:12px;color:var(--t3);font-size:12px">Sin medidas S0 registradas</div>';
        return;
      }
      const el=document.getElementById('medidas-'+cliId);
      if(el)el.innerHTML=renderMedidasTable(
        typeof s0.medidas==='string'?JSON.parse(s0.medidas):s0.medidas, rows);
      toast('Medidas y fotos cargadas','vd');
      render();
    }).catch(e=>toast('Error: '+e.message,'rj'));
}

function loadPesosCliente(cliId){
  apiCall('GET',`/api/entreno/pesos/${cliId}`)
    .then(rows=>{
      const c=byId(cliId);if(!c)return;
      c.histPesos=rows.map(r=>({f:new Date(r.fecha).toISOString().split('T')[0],v:parseFloat(r.peso)}));
      setTab('revision');
      toast('Pesos actualizados','vd');
    }).catch(e=>toast('Error: '+e.message,'rj'));
}

function guardarNotasEnt(cliId,txt){const c=byId(cliId);if(c){c.notasRevision=txt;}}
function guardarFeedback(id){
  const ta=document.getElementById('fb-'+id);
  const c=byId(id);
  if(c&&c.revision&&ta)c.revision.feedback=ta.value;
  toast('Feedback guardado ✓','vd');
}

// ═══ NUTRICIÓN ═══
// Estado: NE[cliId] = { meals: [{id,nom,items:[{cat,catNom,nom,cantidad,p100,c100,g100,k100,u}]}] }
// Orden fijo de categorías: hidratos → proteina → verd/fruta → grasa

const CAT_ORDER_NUT=['hidrat','prot','verd','fat','fruta'];
const CAT_NOM_NUT={prot:'Proteína',hidrat:'Hidratos',fat:'Grasa',verd:'Verdura',fruta:'Fruta'};
const CAT_KEY_NUT={prot:'proteinas_magras',hidrat:'hidratos',fat:'grasas',verd:'verduras',fruta:'frutas'};
const MEAL_ORDER_NUT=['desayuno','comida','cena','snack'];
const MEAL_NOM_NUT={desayuno:'☀️ Desayuno',comida:'🌞 Comida',cena:'🌙 Cena',snack:'🍎 Snack'};

function autoGenerarMeals(c){
  // Generar comidas automáticamente desde MENU ajustando a macros del cliente
  const macros=c.macros||{kcal:2000,p:160,c:200,g:60};
  const numComidas=c.comidas||3;
  const isDeficit=c.obj<c.pesoAct;
  const isSuperavit=!isDeficit;
  // Repartos por comida (igual que el generador Python)
  const repartos={
    2:{'desayuno':0.45,'cena':0.55},
    3:{'desayuno':0.30,'comida':0.40,'cena':0.30},
    4:{'desayuno':0.25,'comida':0.35,'cena':0.25,'snack':0.15},
    5:{'desayuno':0.20,'comida':0.30,'cena':0.25,'snack':0.15,'snack2':0.10},
  };
  const reparto=repartos[numComidas]||repartos[3];
  const mealOrder=['desayuno','comida','cena','snack'];
  const mealNoms={desayuno:'☀️ Desayuno',comida:'🌞 Comida',cena:'🌙 Cena',snack:'🍎 Snack'};
  
  function pickItem(menuCat,targetGrams,unit){
    const items=menuCat||[];
    if(!items.length)return null;
    const it=items[0];
    // Calcular cantidad para alcanzar targetGrams de proteína/hidratos
    let cantidad=it.cantidad||100;
    if(targetGrams>0&&it.p_100>0&&unit==='p')cantidad=Math.round(targetGrams*100/it.p_100/10)*10;
    else if(targetGrams>0&&it.c_100>0&&unit==='c')cantidad=Math.round(targetGrams*100/it.c_100/10)*10;
    cantidad=Math.max(50,Math.min(cantidad,400));
    return{nom:it.nom,cantidad,u:it.u||'g',cat:'prot',
      p100:it.p_100||0,c100:it.c_100||0,g100:it.g_100||0,k100:it.kcal_100||0};
  }

  const meals=[];
  mealOrder.forEach(mKey=>{
    const pct=reparto[mKey];
    if(!pct)return;
    const mP=Math.round(macros.p*pct);
    const mC=Math.round(macros.c*pct);
    const mG=Math.round(macros.g*pct);
    const items=[];
    const md=MENU[mKey]||MENU['comida']||{};
    const isSnack=mKey==='snack';

    // Proteína magra
    const protItem=pickItem(md.proteinas_magras,mP,'p');
    if(protItem){items.push({...protItem,cat:'prot',catNom:'Proteína magra'});}

    if(!isSnack){
      // Hidrato (reducido 20g para dejar espacio a fruta)
      const hidC=Math.max(0,mC-20);
      const hidItem=pickItem(md.hidratos,hidC,'c');
      if(hidItem){items.push({...hidItem,cat:'hidrat',catNom:'Hidrato'});}
      // Verdura siempre
      const verd=(md.verduras||[])[0];
      if(verd)items.push({nom:verd.nom,cantidad:verd.cantidad||200,u:verd.u||'g',
        cat:'verd',catNom:'Verdura',p100:verd.p_100||0,c100:verd.c_100||0,g100:verd.g_100||0,k100:verd.kcal_100||0});
      // Fruta

      // Grasa saludable: solo en superávit o si sobra margen de grasa
      if(isSuperavit&&mG>5){
        const grasaItem=(md.grasas_saludables||[])[0];
        if(grasaItem)items.push({nom:grasaItem.nom,cantidad:grasaItem.cantidad||15,u:grasaItem.u||'g',
          cat:'grasa',catNom:'Grasa saludable',p100:grasaItem.p_100||0,c100:grasaItem.c_100||0,g100:grasaItem.g_100||0,k100:grasaItem.kcal_100||0});
      }
    } else {
      // Snack en déficit: solo fruta + proteína, sin grasas

    }
    meals.push({id:mKey,nom:MEAL_NOMS_MAP[mKey]||mKey,items});
  });
  return meals;
}

function getNutState(c){
  if(NE[c.id]&&NE[c.id].meals)return NE[c.id];
  // If client has alimentos from BD plan, use those
  if(c.alimentos&&Object.keys(c.alimentos).length>0){
    const bdMeals=[];
    // Use all keys from c.alimentos — includes custom meals like snack_pm, snack_am, etc.

    const MEAL_ORDER_BASE=['desayuno','desayuno_extra','snack_am','comida','comida_extra','post_entreno','cena','cena_extra','snack_pm','snack'];
    // Build ordered list: base order first, then any extra keys
    const allKeys=Object.keys(c.alimentos);
    const mealOrder=[...MEAL_ORDER_BASE.filter(k=>allKeys.includes(k)),...allKeys.filter(k=>!MEAL_ORDER_BASE.includes(k))];
    mealOrder.forEach(mKey=>{
      const items=c.alimentos[mKey];
      if(!items||!items.length)return;
      // Need p100,c100,g100,k100 for each item - get from MENU
      const enriched=items.map(it=>{
        // Find nutritional values from MENU
        let p100=0,c100=0,g100=0,k100=0;
        for(const mealKey of Object.keys(MENU)){
          for(const catKey of Object.values(CAT_KEY_NUT)){
            const found=(MENU[mealKey][catKey]||[]).find(m=>(m.nom||m.alimento||'').toLowerCase()===it.nom.toLowerCase());
            if(found){p100=found.p_100||0;c100=found.c_100||0;g100=found.g_100||0;k100=found.kcal_100||0;break;}
          }
          if(k100>0)break;
        }
        return{...it,p100,c100,g100,k100,catNom:CAT_NOM_NUT[it.cat]||it.cat};
      });
      bdMeals.push({id:mKey,nom:MEAL_NOMS_MAP[mKey]||mKey||mKey,items:enriched});
    });
    if(bdMeals.length>0){
      // Add fruta option to desayuno, comida, cena — reduce hidrat by 20g
      ;
      NE[c.id]={meals:bdMeals};
      return NE[c.id];
    }
  }
  
  // No BD alimentos — auto-generate from MENU based on client macros
  const autoMeals=autoGenerarMeals(c);
  NE[c.id]={meals:autoMeals};
  return NE[c.id];
}

function nutCalc(it){
  const r=it.cantidad/100;
  return{p:+(it.p100*r).toFixed(1),c:+(it.c100*r).toFixed(1),
         g:+(it.g100*r).toFixed(1),k:Math.round(it.k100*r)};
}

function nutSnapshot(cliId){
  return JSON.stringify(getNutState(byId(cliId)).meals);
}

// ── RENDER ──
function tNutricion(c){
  const state=getNutState(c);
  let totK=0,totP=0,totC=0,totG=0;
  state.meals.forEach(m=>m.items.forEach(it=>{
    const r=nutCalc(it);totK+=r.k;totP+=r.p;totC+=r.c;totG+=r.g;
  }));
  const diff=Math.round(totK-c.macros.kcal);
  const diffCol=Math.abs(diff)<100?'var(--vd)':Math.abs(diff)<200?'var(--am)':'var(--rj)';
  return`
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
    <div style="background:var(--az3);border:2px solid var(--az4);border-radius:10px;padding:11px 13px">
      <div style="font-size:9px;font-weight:700;color:var(--az2);text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px">🎯 Objetivo prescrito</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--nr)">${c.macros.kcal}</div><div style="font-size:9.5px;color:var(--t3)">kcal</div></div>
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--az2)">${c.macros.p}g</div><div style="font-size:9.5px;color:var(--t3)">prot</div></div>
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--vd)">${c.macros.c}g</div><div style="font-size:9.5px;color:var(--t3)">carbs</div></div>
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--am)">${c.macros.g}g</div><div style="font-size:9.5px;color:var(--t3)">grasa</div></div>
      </div>
    </div>
    <div style="background:#fff;border:2px solid var(--bor);border-radius:10px;padding:11px 13px">
      <div style="font-size:9px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px">📊 Actual <span style="font-weight:400;font-size:9px">· Ctrl+Z deshacer</span></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:${diffCol}" id="nt-k-${c.id}">${Math.round(totK)}</div><div style="font-size:9.5px;color:var(--t3)">kcal <span id="nt-d-${c.id}" style="color:${diffCol}">(${diff>0?'+':''}${diff})</span></div></div>
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--az2)" id="nt-p-${c.id}">${Math.round(totP)}g</div><div style="font-size:9.5px;color:var(--t3)">prot</div></div>
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--vd)" id="nt-c-${c.id}">${Math.round(totC)}g</div><div style="font-size:9.5px;color:var(--t3)">carbs</div></div>
        <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--am)" id="nt-g-${c.id}">${Math.round(totG)}g</div><div style="font-size:9.5px;color:var(--t3)">grasa</div></div>
      </div>
    </div>
  </div>
  <div id="nut-meals-${c.id}">${nutMealsHTML(c)}</div>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
    <button class="btn bo bs" onclick="nutAddMeal('${c.id}')">+ Comida</button>
    <span style="font-size:11px;color:var(--t3);margin-left:4px">Ctrl+Z deshace cualquier cambio</span>
    <button class="btn bo bs" style="margin-left:auto;color:var(--t3)" onclick="nutReset('${c.id}')">↺ Resetear</button>
  </div>`;
}

function nutMealsHTML(c){
  const state=getNutState(c);
  return state.meals.map((meal,mi)=>nutMealHTML(c.id,meal,mi)).join('');
}

function nutMealHTML(cliId,meal,mi){
  let mK=0,mP=0,mC=0,mG=0;
  meal.items.forEach(it=>{const r=nutCalc(it);mK+=r.k;mP+=r.p;mC+=r.c;mG+=r.g;});
  return`<div class="card" style="margin-bottom:10px">
    <div class="meal-hd">
      <span style="font-weight:700;font-size:13.5px">${meal.nom}</span>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="ms-${cliId}-${mi}" style="font-size:12px;color:var(--t3)">${Math.round(mK)} kcal · P:${Math.round(mP)}g C:${Math.round(mC)}g G:${Math.round(mG)}g</span>
        <button onclick="nutDelMeal('${cliId}',${mi})" class="edel" title="Eliminar comida">✕</button>
      </div>
    </div>
    <div style="overflow-x:auto">
    <table class="nut-tbl"><thead><tr>
      <th style="min-width:160px">Alimento</th>
      <th style="text-align:center;min-width:90px">Cantidad</th>
      <th style="text-align:center;color:var(--az2)">Prot</th>
      <th style="text-align:center;color:var(--vd)">Carbs</th>
      <th style="text-align:center;color:var(--am)">Grasa</th>
      <th style="text-align:center;color:var(--nr)">Kcal</th>
      <th style="width:28px"></th>
    </tr></thead>
    <tbody id="nutb-${cliId}-${mi}">
      ${meal.items.map((it,ii)=>nutItemRow(cliId,mi,ii,it)).join('')}
    </tbody></table></div>
    <div style="padding:8px 14px;border-top:1px solid var(--bor2);display:flex;gap:5px;flex-wrap:wrap">
      ${CAT_ORDER_NUT.map(cat=>`<button class="btn bo bs" style="font-size:11px" onclick="nutShowPicker('${cliId}',${mi},'${cat}')">+ ${CAT_NOM_NUT[cat]}</button>`).join('')}
    </div>
  </div>`;
}

function nutItemRow(cliId,mi,ii,it){
  const r=nutCalc(it);
  return`<tr id="nutr-${cliId}-${mi}-${ii}">
    <td style="font-weight:600;font-size:12.5px">${it.nom}<div style="font-size:10px;color:var(--t3)">${it.catNom}</div></td>
    <td style="text-align:center">
      <div style="display:flex;align-items:center;gap:4px;justify-content:center">
        <input type="number" value="${it.cantidad}" step="5" min="0" class="ni"
          data-cli="${cliId}" data-mi="${mi}" data-ii="${ii}" data-orig="${it.cantidad}"
          oninput="nutLive(this)" onblur="nutSave(this)"
          onkeydown="if(event.key==='-'||event.key==='e')event.preventDefault()">
        <span style="font-size:11px;color:var(--t3)">${it.u}</span>
      </div>
    </td>
    <td style="text-align:center;color:var(--az2);font-weight:600" id="np-${cliId}-${mi}-${ii}">${r.p}g</td>
    <td style="text-align:center;color:var(--vd);font-weight:600" id="nc-${cliId}-${mi}-${ii}">${r.c}g</td>
    <td style="text-align:center;color:var(--am);font-weight:600" id="ng-${cliId}-${mi}-${ii}">${r.g}g</td>
    <td style="text-align:center;color:var(--nr);font-weight:600" id="nk-${cliId}-${mi}-${ii}">${r.k}</td>
    <td><button class="edel" onclick="nutDelItem('${cliId}',${mi},${ii})">✕</button></td>
  </tr>`;
}

// ── PICKER (inline en el panel, sin prompt del navegador) ──
function nutShowPicker(cliId,mi,cat){
  // Get options sorted and deduplicated from MENU
  const opts=[];
  MEAL_ORDER_NUT.forEach(mk=>{
    (MENU[mk]?.[CAT_KEY_NUT[cat]]||[]).forEach(it=>{
      if(!opts.find(o=>o.nom===(it.nom||it.alimento)))
        opts.push({nom:it.nom||it.alimento||'',cantidad:it.cantidad||100,
          p100:it.p_100||0,c100:it.c_100||0,g100:it.g_100||0,k100:it.kcal_100||0,u:it.u||'g'});
    });
  });
  // Show inline picker below the button row
  const pickerId=`nut-picker-${cliId}-${mi}`;
  let el=document.getElementById(pickerId);
  if(el){el.remove();return;} // toggle off
  const card=document.getElementById(`nutb-${cliId}-${mi}`)?.closest('.card');
  if(!card)return;
  const div=document.createElement('div');
  div.id=pickerId;
  div.style.cssText='padding:10px 14px;border-top:1px solid var(--bor2);background:var(--az3)';
  div.innerHTML=`<div style="font-size:11px;font-weight:700;color:var(--az2);margin-bottom:8px">Añadir ${CAT_NOM_NUT[cat]} — elige:</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px">
      ${opts.map((o,oi)=>`<button class="btn bo bs" style="font-size:11px" onclick="nutPickItem('${cliId}',${mi},'${cat}',${oi},'${(o.nom||'').replace(/'/g,"\\'")}',${o.cantidad},${o.p100},${o.c100},${o.g100},${o.k100},'${o.u||'g'}')">${o.nom}</button>`).join('')}
    </div>
    <button class="btn bo bs" style="margin-top:8px;color:var(--t3)" onclick="document.getElementById('${pickerId}').remove()">Cancelar</button>`;
  card.appendChild(div);
}

function nutPickItem(cliId,mi,cat,oi,nom,cantidad,p100,c100,g100,k100,u){
  const state=getNutState(byId(cliId));
  if(!state.meals[mi])return;
  UNDO_NUT.push({cliId,structural:true,snap:nutSnapshot(cliId)});
  if(UNDO_NUT.length>UNDO_MAX)UNDO_NUT.shift();
  // Insert in correct position per CAT_ORDER_NUT
  const catIdx=CAT_ORDER_NUT.indexOf(cat);
  const insertAfter=state.meals[mi].items.reduce((last,it,i)=>{
    return CAT_ORDER_NUT.indexOf(it.cat)<=catIdx?i:last;
  },-1);
  state.meals[mi].items.splice(insertAfter+1,0,
    {cat,catNom:CAT_NOM_NUT[cat],nom,cantidad,p100,c100,g100,k100,u});
  // Close picker
  const pickerId=`nut-picker-${cliId}-${mi}`;
  document.getElementById(pickerId)?.remove();
  nutSaveBD(cliId);
  nutRepaint(cliId);
  toast(nom+' añadido ✓','vd');
}

// ── LIVE UPDATE (DOM only) ──
function nutLive(inp){
  const cliId=inp.dataset.cli,mi=+inp.dataset.mi,ii=+inp.dataset.ii;
  const g=parseFloat(inp.value)||0;
  const state=getNutState(byId(cliId));
  const it=state.meals[mi]?.items[ii];if(!it)return;
  const r=nutCalc({...it,cantidad:g});
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set(`np-${cliId}-${mi}-${ii}`,r.p+'g');
  set(`nc-${cliId}-${mi}-${ii}`,r.c+'g');
  set(`ng-${cliId}-${mi}-${ii}`,r.g+'g');
  set(`nk-${cliId}-${mi}-${ii}`,r.k);
  nutUpdateTotals(cliId);
}

function nutUpdateTotals(cliId){
  const c=byId(cliId);if(!c)return;
  const state=getNutState(c);
  let totK=0,totP=0,totC=0,totG=0;
  // Use DOM values where available (unsaved live edits)
  state.meals.forEach((meal,mi)=>{
    let mK=0,mP=0,mC=0,mG=0;
    meal.items.forEach((it,ii)=>{
      const inp=document.querySelector(`input[data-cli="${cliId}"][data-mi="${mi}"][data-ii="${ii}"]`);
      const g=inp?parseFloat(inp.value)||0:it.cantidad;
      const r=nutCalc({...it,cantidad:g});
      totK+=r.k;totP+=r.p;totC+=r.c;totG+=r.g;
      mK+=r.k;mP+=r.p;mC+=r.c;mG+=r.g;
    });
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set(`ms-${cliId}-${mi}`,`${Math.round(mK)} kcal · P:${Math.round(mP)}g C:${Math.round(mC)}g G:${Math.round(mG)}g`);
  });
  const diff=Math.round(totK-c.macros.kcal);
  const diffCol=Math.abs(diff)<100?'var(--vd)':Math.abs(diff)<200?'var(--am)':'var(--rj)';
  const set=(id,v,col)=>{const el=document.getElementById(id);if(el){el.textContent=v;if(col)el.style.color=col;}};
  set(`nt-k-${cliId}`,Math.round(totK),diffCol);
  set(`nt-p-${cliId}`,Math.round(totP)+'g');
  set(`nt-c-${cliId}`,Math.round(totC)+'g');
  set(`nt-g-${cliId}`,Math.round(totG)+'g');
  set(`nt-d-${cliId}`,'('+(diff>0?'+':'')+diff+')',diffCol);
}

// ── SAVE (state + undo, onblur) ──
function nutSave(inp){
  if(!inp.value.trim())return;
  const newVal=parseFloat(inp.value)||0;
  const prev=parseFloat(inp.dataset.orig??newVal);
  if(prev===newVal)return;
  const cliId=inp.dataset.cli,mi=+inp.dataset.mi,ii=+inp.dataset.ii;
  UNDO_NUT.push({cliId,mi,ii,g:prev});
  if(UNDO_NUT.length>UNDO_MAX)UNDO_NUT.shift();
  const state=getNutState(byId(cliId));
  if(state.meals[mi]?.items[ii])state.meals[mi].items[ii].cantidad=newVal;
  inp.dataset.orig=String(newVal);
  nutSaveBD(cliId);
}

// ── UNDO (handles both quantity changes and structural) ──
function nutRedo(){toast('Rehacer nutrición próximamente','');}
function nutUndo(){
  if(!UNDO_NUT.length){toast('Nada más que deshacer en nutrición','');return;}
  const last=UNDO_NUT.pop();
  if(last.structural){
    // Restore full meals snapshot
    const state=getNutState(byId(last.cliId));
    state.meals=JSON.parse(last.snap);
    nutRepaint(last.cliId);
    toast(`↩ Restaurado (${UNDO_NUT.length} más)`,'vd');
    return;
  }
  // Quantity change
  const state=getNutState(byId(last.cliId));
  if(state.meals[last.mi]?.items[last.ii])
    state.meals[last.mi].items[last.ii].cantidad=last.g;
  const inp=document.querySelector(`input[data-cli="${last.cliId}"][data-mi="${last.mi}"][data-ii="${last.ii}"]`);
  if(inp){inp.value=last.g;inp.dataset.orig=String(last.g);nutLive(inp);}
  toast(`↩ Deshecho (${UNDO_NUT.length} más)`,'vd');
}

// ── STRUCTURAL CHANGES ──
function nutSaveBD(cliId){
  if(!API_TOKEN||!cliId)return;
  // Build alimentos from current state
  const ns=getNutState(byId(cliId));
  const alimentos={};
  (ns.meals||[]).forEach(function(m){
    alimentos[m.id]=(m.items||[]).map(function(it){
      return {nom:it.nom,cantidad:it.cantidad,u:it.u||'g',cat:it.cat,
              p100:it.p100||0,c100:it.c100||0,g100:it.g100||0,k100:it.k100||0};
    });
  });
  // Update client object so reload shows correct data
  const c=byId(cliId);
  if(c)c.alimentos=alimentos;
  // Debounce save to BD
  clearTimeout(window['_nutSave_'+cliId]);
  window['_nutSave_'+cliId]=setTimeout(function(){
    apiCall('PATCH','/api/bd/plan-nutricion/'+cliId,{distribucion:JSON.stringify(alimentos)})
      .then(function(){console.log('[Nutri] Guardado OK');})
      .catch(function(e){console.warn('[Nutri] Error guardando:',e.message);});
  },800);
}

function nutDelItem(cliId,mi,ii){
  const state=getNutState(byId(cliId));
  if(!state.meals[mi])return;
  UNDO_NUT.push({cliId,structural:true,snap:nutSnapshot(cliId)});
  if(UNDO_NUT.length>UNDO_MAX)UNDO_NUT.shift();
  state.meals[mi].items.splice(ii,1);
  nutRepaint(cliId);
  nutSaveBD(cliId);
  toast('Eliminado — Ctrl+Z para deshacer','');
}

function nutDelMeal(cliId,mi){
  const state=getNutState(byId(cliId));
  if(!state.meals[mi])return;
  UNDO_NUT.push({cliId,structural:true,snap:nutSnapshot(cliId)});
  if(UNDO_NUT.length>UNDO_MAX)UNDO_NUT.shift();
  state.meals.splice(mi,1);
  nutSaveBD(cliId);
  nutRepaint(cliId);
  toast('Comida eliminada — Ctrl+Z para deshacer','');
}

function nutAddMeal(cliId){
  // Show inline panel instead of browser prompt
  const pickerId='nut-addmeal-picker-'+cliId;
  let el=document.getElementById(pickerId);
  if(el){el.remove();return;}
  const container=document.getElementById('nut-meals-'+cliId);
  if(!container)return;
  const MEAL_TEMPLATES=[
    {id:'desayuno_extra',nom:'☀️ Desayuno extra',tipo:'desayuno',
      desc:'Hidratos + proteína magra + grasa'},
    {id:'snack_am',nom:'🍎 Snack mañana',tipo:'snack',
      desc:'Proteína magra + hidratos (sin grasa)'},
    {id:'snack_pm',nom:'🍎 Snack tarde',tipo:'snack',
      desc:'Proteína magra + hidratos (sin grasa)'},
    {id:'post_entreno',nom:'💪 Post-entreno',tipo:'snack',
      desc:'Proteína magra + hidratos rápidos'},
    {id:'comida_extra',nom:'🌞 Comida extra',tipo:'comida',
      desc:'Hidratos + proteína magra + verdura + grasa'},
    {id:'cena_extra',nom:'🌙 Cena extra',tipo:'cena',
      desc:'Proteína magra + verdura + grasa (sin hidratos o mínimos)'},
    {id:'custom',nom:'✏️ Personalizada',tipo:null,
      desc:'Comida vacía — añade los grupos manualmente'},
  ];
  const div=document.createElement('div');
  div.id=pickerId;
  div.style.cssText='background:var(--az3);border:1.5px solid var(--az4);border-radius:10px;padding:12px 14px;margin-top:8px';
  div.innerHTML=`<div style="font-size:11px;font-weight:700;color:var(--az2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Añadir comida — elige el tipo:</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      ${MEAL_TEMPLATES.map(t=>`<button onclick="nutAddMealFromTemplate('${cliId}','${t.id}','${t.nom}','${t.tipo||''}')" 
        style="text-align:left;padding:8px 10px;border:1.5px solid var(--bor);border-radius:7px;background:#fff;cursor:pointer;font-family:inherit;transition:all .15s"
        onmouseover="this.style.borderColor='var(--az2)'" onmouseout="this.style.borderColor='var(--bor)'">
        <div style="font-size:12.5px;font-weight:700">${t.nom}</div>
        <div style="font-size:10.5px;color:var(--t3);margin-top:2px">${t.desc}</div>
      </button>`).join('')}
    </div>
    <button onclick="document.getElementById('${pickerId}').remove()" style="margin-top:8px;width:100%;padding:6px;border:1.5px solid var(--bor);border-radius:7px;background:none;cursor:pointer;font-family:inherit;color:var(--t3);font-size:12px">Cancelar</button>`;
  container.parentElement.insertBefore(div, container.nextSibling);
}

function nutAddMealFromTemplate(cliId,templateId,nom,tipo){
  const state=getNutState(byId(cliId));
  UNDO_NUT.push({cliId,structural:true,snap:nutSnapshot(cliId)});
  if(UNDO_NUT.length>UNDO_MAX)UNDO_NUT.shift();
  // Build items from MENU based on tipo
  let items=[];
  if(tipo&&MENU[tipo]){
    const md=MENU[tipo];
    // Only magras for protein (no grasas proteins), in CAT_ORDER_NUT order
    const CATS_TO_LOAD = tipo==='snack'
      ? ['hidrat','prot'] // snack: no fat by default
      : ['hidrat','prot','verd','fat']; // main meals: hidrat+prot+verd+fat
    CATS_TO_LOAD.forEach(cat=>{
      const arr=md[CAT_KEY_NUT[cat]];
      if(!arr||!arr.length)return;
      const def=arr[0];
      items.push({cat,catNom:CAT_NOM_NUT[cat],
        nom:def.nom||def.alimento||'',cantidad:def.cantidad||100,
        p100:def.p_100||0,c100:def.c_100||0,g100:def.g_100||0,k100:def.kcal_100||0,
        u:def.u||'g'});
    });
  }
  // Use stable ID: templateId, or templateId_2, _3 etc if already exists
  var mealId=templateId;
  var existingIds=state.meals.map(function(m){return m.id;});
  var counter=2;
  while(existingIds.indexOf(mealId)>=0){mealId=templateId+'_'+counter;counter++;}
  state.meals.push({id:mealId,nom,items});
  // Close picker
  document.querySelectorAll('[id^="nut-addmeal-picker-"]').forEach(el=>el.remove());
  nutSaveBD(cliId);
  nutRepaint(cliId);
  toast(nom+' añadida','vd');
}

function nutRepaint(cliId){
  const el=document.getElementById(`nut-meals-${cliId}`);
  const c=byId(cliId);
  if(el&&c){el.innerHTML=nutMealsHTML(c);nutUpdateTotals(cliId);}
}

function nutReset(cliId){
  if(!confirm('¿Resetear toda la nutrición al plan original?'))return;
  delete NE[cliId];
  setTab('nutricion');
  toast('Reseteado al plan original','');
}

// ═══ TAB: ENTRENO — grid semanal + editor ═══
function tEntreno(c){
  RUT_CLI=c.id;
  if(ENT_VIEW==='editor'){
    return`<div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn bo bs" onclick="ENT_VIEW='grid';setTab('entreno')">← Vista semana</button>
        <button class="btn bo bs" onclick="ENT_VIEW='historial';setTab('entreno')">📊 Historial completo</button>
      </div>
      ${rRutinas()}
    </div>`;
  }
  if(ENT_VIEW==='historial') return tEntrenoHistorial(c);
  return tEntrenoGrid(c);
}

function tEntrenoHistorial(c){
  // Load from API always for fresh data
  if(API_TOKEN){
    apiCall('GET','/api/entreno/historial/'+c.id)
      .then(rows=>{
        const el=document.getElementById('hist-body');
        if(!el)return;
        if(!rows||!rows.length){el.innerHTML='<div style="padding:20px;color:var(--t3);text-align:center">Sin registros de entrenamiento aún</div>';return;}
        // Build rutina order map from RUTINAS
          var rut=RUTINAS[c.id]||{};
          var rutSem=rut[RUT_SEM]||rut[1]||{};
          el.innerHTML=buildHistTable(rows,rutSem,c.semTotal||13);
      }).catch(e=>{
        const el=document.getElementById('hist-body');
        if(el)el.innerHTML='<div style="padding:20px;color:var(--rj)">Error: '+e.message+'</div>';
      });
  }
  return'<div>'+
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
      '<button class="btn bo bs" onclick="ENT_VIEW=&quot;grid&quot;;setTab(&quot;entreno&quot;)">← Vista semana</button>'+
    '</div>'+
    '<div class="card">'+
      '<div class="ch"><h2>📊 Historial de entrenamiento — '+c.nom.split(' ')[0]+'</h2></div>'+
      '<div class="cb" id="hist-body"><div style="text-align:center;padding:20px;color:var(--t3)">Cargando...</div></div>'+
    '</div>'+
  '</div>';
}

function buildHistTable(rows,rutinaOrder,semTotal){
  if(!rows||!rows.length)return'<div style="padding:20px;color:var(--t3);text-align:center">Sin registros aún</div>';
  var totalSems=semTotal||13;
  // All semanas S1..Stotal as fixed columns
  var allSems=Array.from({length:totalSems},function(_,i){return i+1;});
  // Build byDia from rutina first (all exercises), then add any from rows not in rutina
  var byDia={};
  if(rutinaOrder){
    Object.keys(rutinaOrder).forEach(function(dia){
      var rutDia=rutinaOrder[dia]||[];
      if(rutDia.length){
        byDia[dia]=rutDia.map(function(e){return e.nom;});
      }
    });
  }
  // Add any exercises from rows not already in byDia (edge case)
  rows.forEach(function(r){
    var dia=r.dia!=null?parseInt(r.dia):0;
    if(!byDia[dia])byDia[dia]=[];
    if(!byDia[dia].find(function(x){return x===r.ejercicio;}))
      byDia[dia].push(r.ejercicio);
  });
  var DIAS_NOM=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  var html='<div style="padding:14px">';
  html+='<div style="font-size:10px;color:var(--t3);margin-bottom:16px">Kg × reps por serie · — = sin registro</div>';
  Object.keys(byDia).sort(function(a,b){return parseInt(a)-parseInt(b);}).forEach(function(diaStr){
    var dia=parseInt(diaStr);
    var ejsInDia=byDia[diaStr];
    html+='<div style="margin-bottom:24px">';
    html+='<div style="background:var(--az);color:#fff;font-weight:700;font-size:12px;padding:8px 14px;border-radius:8px 8px 0 0;letter-spacing:.3px">'+(DIAS_NOM[dia]||'Día '+dia)+'</div>';
    ejsInDia.forEach(function(ej,ejIdx){
      var ejRows=rows.filter(function(r){return r.ejercicio===ej&&parseInt(r.dia)==dia;});
      // maxSeries: use rutina sets if available, else rows, else 3
      var rutEj=rutinaOrder&&rutinaOrder[dia]?rutinaOrder[dia].find(function(e){return e.nom===ej;}):null;
      var maxSeries=ejRows.length?Math.max.apply(null,ejRows.map(function(r){return r.serie;})):(rutEj?rutEj.sets:3);
      var bg=ejIdx%2===0?'#fff':'#f9fafc';
      html+='<div style="border:1px solid var(--bor);border-top:'+(ejIdx===0?'none':'1px solid var(--bor2)')+';background:'+bg+'">';
      html+='<div style="font-weight:600;font-size:12px;color:var(--t1);padding:7px 12px 4px;border-bottom:1px solid var(--bor2)">'+ej+'</div>';
      html+='<div style="overflow-x:auto">';
      html+='<table style="border-collapse:collapse;font-size:11px;width:100%;min-width:'+(allSems.length*56+60)+'px">';
      // Header row
      html+='<thead><tr style="background:#f0f4fa">';
      html+='<th style="padding:5px 8px;text-align:left;color:var(--t3);font-weight:600;font-size:10px;white-space:nowrap;border-right:1px solid var(--bor2);min-width:40px">Serie</th>';
      allSems.forEach(function(s){
        var hasDat=ejRows.some(function(r){return r.semana===s;});
        html+='<th style="padding:5px 6px;text-align:center;font-size:10px;white-space:nowrap;min-width:52px;color:'+(hasDat?'var(--az)':'var(--t3)')+'">';
        html+='S'+s+'</th>';
      });
      html+='</tr></thead><tbody>';
      for(var si=1;si<=maxSeries;si++){
        html+='<tr style="border-top:1px solid var(--bor2)">';
        html+='<td style="padding:5px 8px;color:var(--t3);font-size:10px;font-weight:600;border-right:1px solid var(--bor2);text-align:center">'+si+'</td>';
        allSems.forEach(function(s){
          var reg=ejRows.find(function(r){return r.semana===s&&r.serie===si;});
          if(!reg){
            html+='<td style="padding:5px 6px;text-align:center;color:var(--bor2);font-size:11px">—</td>';
          } else {
            var kg=parseFloat(reg.kg);
            var kgStr=kg===Math.floor(kg)?Math.floor(kg)+'':kg.toFixed(1).replace(/\.0$/,'');
            html+='<td style="padding:5px 6px;text-align:center">';
            html+='<span style="font-weight:700;color:var(--az);font-size:12px">'+kgStr+'</span>';
            html+='<span style="color:var(--t3);font-size:9px">×'+reg.reps_reales+'</span>';
            html+='</td>';
          }
        });
        html+='</tr>';
      }
      html+='</tbody></table></div></div>';
    });
    html+='</div>';
  });
  html+='</div>';
  return html;
}
function loadHistorialFromBD(cliId){
  apiCall('GET','/api/entreno/historial/'+cliId)
    .then(d=>loadHistorialAPI(d,cliId))
    .catch(e=>toast(e.message,'rj'));
}

function loadHistorialAPI(rows, cliId){
  if(!rows||!rows.length){toast('Sin registros en BD','');return;}
  if(!RUTINAS[cliId])RUTINAS[cliId]={};
  if(!RUTINAS[cliId].__logs)RUTINAS[cliId].__logs={};
  rows.forEach(r=>{
    const logs=RUTINAS[cliId].__logs;
    if(!logs[r.ejercicio])logs[r.ejercicio]={semanas:{}};
    const sem=String(r.semana);
    if(!logs[r.ejercicio].semanas[sem])logs[r.ejercicio].semanas[sem]={series:[]};
    const series=logs[r.ejercicio].semanas[sem].series;
    if(!series[r.serie-1])series[r.serie-1]={kg:String(r.kg),reps:String(r.reps_reales),done:r.completada};
  });
  toast('✅ '+rows.length+' registros cargados','vd');
  setTab('entreno');
}

function tEntrenoGrid(c){
  const rs=revSems(c.tipo),st=c.semTotal;
  const semH=Array.from({length:st},(_,i)=>{
    const s=i+1,isRev=rs.includes(s),isCur=s===c.semana;
    return`<button class="sem-btn${s===RUT_SEM?' on':''}${isRev&&s!==RUT_SEM?' rev':''}${isCur?' cur':''}" onclick="RUT_SEM=${s};setTab('entreno')">S${s}${isRev?'📋':''}${isCur?' 📍':''}</button>`;
  }).join('');

  // Derive training days from RUTINAS for this specific semana
  // so that different semanas can have different day structures
  const semRutData=RUTINAS[RUT_CLI]?.[RUT_SEM];
  const trainingDays=DIAS_BASE.map((d,di)=>{
    if(semRutData&&semRutData[di]!==undefined){
      // This semana has explicit data for this day
      const ejes=semRutData[di];
      return{...d,di,rest:ejes.length===0,ejes};
    }
    // No explicit data: use client's rutinaDias or DIAS_BASE
    const c=byId(RUT_CLI);
    if(c&&c.rutinaDias&&c.rutinaDias[String(di)]!==undefined){
      const ejes=c.rutinaDias[String(di)];
      return{...d,di,rest:ejes.length===0,ejes:ejes.length===0?[]:getRut(RUT_CLI,RUT_SEM,di)};
    }
    const ejes=d.rest?[]:getRut(RUT_CLI,RUT_SEM,di);
    return{...d,di,ejes};
  });
  const trainOnly=trainingDays.filter(d=>!d.rest);
  const restOnly=trainingDays.filter(d=>d.rest);
  const maxEj=Math.max(...trainOnly.map(d=>d.ejes.length),0);

  let grid=`<div class="ent-grid-wrap">
    <table class="ent-grid" style="width:100%">
      <thead><tr>
        <th class="ent-idx">#</th>
        ${trainOnly.map(d=>`<th style="min-width:150px">
          <div>${d.nom}</div>
          <div style="font-size:10px;opacity:.65;font-weight:400">${d.tipo}</div>
        </th>`).join('')}
      </tr></thead>
      <tbody>`;

  for(let ei=0;ei<maxEj;ei++){
    grid+=`<tr>
      <td class="ent-idx" style="text-align:center;font-size:11px;font-weight:700;color:var(--t3);background:var(--bg)">${ei+1}</td>
      ${trainOnly.map(d=>{
        const ej=d.ejes[ei];
        if(!ej)return`<td></td>`;
        const hasUrl=ej.url&&ej.url.trim();
        return`<td class="ent-cell" onclick="RUT_DIA=${d.di};ENT_VIEW='editor';setTab('entreno')" title="Click para editar ${d.nom}">
          <div class="ent-nom">${ej.nom||'—'}</div>
          <div class="ent-meta">${ej.sets}×${ej.reps} · <span class="ent-rir">RIR${ej.rir}</span> · ${REST_LABEL[ej.rest]||ej.rest+'s'}</div>
          ${hasUrl?`<a href="${ej.url}" target="_blank" onclick="event.stopPropagation()" style="font-size:10px;color:var(--rj);text-decoration:none">▶</a>`:''}
        </td>`;
      }).join('')}
    </tr>`;
  }

  if(maxEj===0)grid+=`<tr><td colspan="${trainOnly.length+1}" style="text-align:center;padding:20px;color:var(--t3);font-style:italic">Sin ejercicios — haz click en "Editar detalle" para añadir</td></tr>`;

  grid+=`</tbody></table></div>`;

  const restH=restOnly.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
    ${restOnly.map(d=>`<div class="badge bgr">😴 ${d.nom}</div>`).join('')}
  </div>`:'';

  return`
  <div class="card" style="margin-bottom:10px">
    <div class="ch"><h2>📅 Semanas</h2></div>
    <div class="cb" style="padding:10px 14px"><div class="sem-strip">${semH}</div></div>
  </div>
  ${restH}
  <div class="card">
    <div class="ch">
      <h2>💪 S${RUT_SEM} — Vista completa</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn bo bs" onclick="cpImport(${RUT_SEM})">📥 Importar rutina</button>
        <button class="btn bo bs" onclick="cpSem(${RUT_SEM})">📋 Copiar semana</button>
        <button class="btn bo bs" onclick="ENT_VIEW='historial';setTab('entreno')">📊 Historial</button>
        <button class="btn bp bs" onclick="ENT_VIEW='editor';RUT_DIA=0;setTab('entreno')">✏️ Editar detalle</button>
      </div>
    </div>
    <div class="cb" style="padding:10px 14px">${grid}</div>
  </div>`;
}

