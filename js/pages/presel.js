// ══════════════════════════════════════════════════════
// PRESEL.JS — Preselección de candidatos
// ══════════════════════════════════════════════════════
var preC='';

function pgPresel(){
  var convs=DB.convs();
  document.getElementById('tb-act').innerHTML='';
  var opts=convs.map(function(c){return'<option value="'+c.id+'" '+(preC===c.id?'selected':'')+'>'+c.titulo+'</option>';}).join('');
  var body='';
  if(preC){
    var conv=convs.find(function(c){return c.id===preC;}),perf=conv?DB.perfiles().find(function(p){return p.id===conv.perfilId;}):null;
    var all=DB.cands();var chg=false;
    all.forEach(function(c,i){if(c.convocatoriaId===preC&&c.puntajePreseleccion==null&&!c.decisionDirector){all[i].puntajePreseleccion=calcPre(c,perf);chg=true;}});
    if(chg)DB.sCands(all);
    var cands=DB.cands().filter(function(c){return c.convocatoriaId===preC&&['postulado','preseleccionado','descartado_pre'].indexOf(c.etapa)>=0;}).sort(function(a,b){return(b.puntajePreseleccion||0)-(a.puntajePreseleccion||0);});
    var aptos=cands.filter(function(c){return c.etapa==='preseleccionado';}).length;
    var desc=cands.filter(function(c){return c.etapa==='descartado_pre';}).length;

    var rows=cands.map(function(c){
      var s=c.puntajePreseleccion||0;
      return'<tr>'
        +'<td><div class="flex ic g2"><span class="sem '+(s>=75?'sg2':s>=50?'sy2':'sr2')+'"></span>'
        +'<strong>'+c.apellidos+', '+c.nombres+'</strong></div></td>'
        +'<td>'
        +'<div class="flex ic g2">'
        +'<div class="pb" style="width:70px"><div class="pf" style="width:'+s+'%;background:'+sCol(s)+'"></div></div>'
        +'<button class="bdg '+sCls(s)+'" onclick="verDesglosePre(\''+c.id+'\')" '
        +'style="cursor:pointer;border:none;font-size:12px" title="Ver desglose y editar">'+s+'% 🔍</button>'
        +(c.decisionDirector?'<span class="bdg b-yw">Dir.</span>':'')
        +'</div></td>'
        +'<td><span class="bdg '+(EB[c.etapa]||'b-gr')+'">'+(EL[c.etapa]||c.etapa)+'</span></td>'
        +'<td><div class="flex g2">'
        +'<button class="btn bg bxs" onclick="moverC(\''+c.id+'\',\'preseleccionado\')">✓ Aprobar</button>'
        +'<button class="btn br bxs" onclick="moverC(\''+c.id+'\',\'descartado_pre\')">✕ Descartar</button>'
        +'<button class="btn bo bxs" onclick="regresarEtapa(\''+c.id+'\')">← Regresar</button>'
        +'</div></td></tr>';
    }).join('');

    body='<div class="flex g2 mb3" style="flex-wrap:wrap">'
      +'<span class="bdg b-bl">'+cands.length+' candidatos</span>'
      +'<span class="bdg b-gn">'+aptos+' aptos</span>'
      +'<span class="bdg b-rd">'+desc+' desc.</span>'
      +'<button class="btn bo bxs" onclick="autoPre(\''+preC+'\')">⚡ Auto-clasificar</button>'
      +'<button class="btn bp bxs" onclick="pasarSel(\''+preC+'\')">→ Pasar a Selección</button>'
      +'</div>'
      +'<div class="al al-i" style="margin-bottom:12px">Haz clic en el <strong>% 🔍</strong> de cualquier candidato para ver el desglose del puntaje y ajustarlo manualmente.</div>'
      +'<div class="card"><div class="tw"><table><thead><tr>'
      +'<th>Candidato</th><th>Puntaje</th><th>Estado</th><th>Decisión</th>'
      +'</tr></thead><tbody>'
      +(rows||'<tr><td colspan="4" class="tgr" style="text-align:center;padding:20px">Sin candidatos</td></tr>')
      +'</tbody></table></div></div>';
  }
  document.getElementById('ct').innerHTML=
    '<div class="al al-i">El sistema puntúa automáticamente según el perfil de cargo. Puedes ajustar cualquier puntaje manualmente haciendo clic en el porcentaje.</div>'
    +'<div class="fg" style="max-width:380px"><label>Convocatoria</label>'
    +'<select onchange="preC=this.value;pgPresel()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+body;
}

// ── DESGLOSE DE PUNTAJE + EDICIÓN MANUAL ────────────────
function verDesglosePre(candId){
  var c=DB.cands().find(function(x){return x.id===candId;});if(!c)return;
  var conv=DB.convs().find(function(x){return x.id===preC;});
  var perf=conv?DB.perfiles().find(function(p){return p.id===conv.perfilId;}):null;
  var nombre=c.apellidos+', '+c.nombres;
  var score=c.puntajePreseleccion||0;

  // ── Calcular desglose componente a componente ──────────
  var niv=['Bachillerato','Tecnico','Tecnologo','Tercer Nivel','Cuarto Nivel'];
  var items=[];

  if(!perf){
    // Sin perfil: mostrar solo edición manual
    openM('📊 Puntaje — '+nombre,
      '<div class="al al-w">No hay perfil de cargo configurado. El desglose automático no está disponible.</div>'
      +'<div class="fg"><label>Puntaje manual (0 – 100)</label>'
      +'<input type="number" id="pre-manual" min="0" max="100" value="'+score+'" style="font-size:22px;font-weight:800;text-align:center;width:120px;padding:8px;border:2px solid #e2e8f0;border-radius:10px"></div>',
      '<button class="btn bo" onclick="closeM()">Cancelar</button>'
      +'<button class="btn bp" onclick="guardarPuntajePre(\''+candId+'\')">💾 Guardar</button>');
    return;
  }

  // 1. Educación (max 35 — educación pesa más)
  var reqN=niv.indexOf(perf.eduNiv||'Bachillerato');
  var candNs=(c.educacion||[]).map(function(e){return Math.max(0,niv.indexOf(e.nivel));});
  var candN=candNs.length?Math.max.apply(null,candNs):-1;
  var edPts=candN>=reqN?35:candN===reqN-1?22:candN===reqN-2?10:0;
  var candNivLbl=candN>=0?niv[candN]:'Sin registro';
  items.push({icon:'🎓',label:'Nivel Educativo',pts:edPts,max:35,
    detalle:'Requerido: '+(niv[reqN]||'Bachillerato')+' · Candidato: '+candNivLbl,
    tip:candN>=reqN?'Cumple o supera el nivel requerido':candN===reqN-1?'Un nivel por debajo':'Dos o más niveles por debajo'});

  // 2. Experiencia (max 35 — experiencia pesa igual que educación)
  var reqA=perf.expAnios||0;
  var expPts,expDet;
  if(reqA===0){expPts=35;expDet='No se requiere experiencia mínima';}
  else{
    var meses=(c.experiencia||[]).reduce(function(s,e){
      if(!e.inicio)return s;
      var i=new Date(e.inicio+'-01'),f=e.fin?new Date(e.fin+'-01'):new Date();
      return s+Math.max(0,(f-i)/(1000*60*60*24*30));
    },0);
    var anos=Math.round(meses/12*10)/10;
    expPts=anos>=reqA?35:anos>=reqA*.7?22:anos>0?10:0;
    expDet='Requerido: '+reqA+' años · Candidato: '+anos+' años ('+Math.round(meses)+' meses)';
  }
  items.push({icon:'💼',label:'Experiencia Laboral',pts:expPts,max:35,
    detalle:expDet,
    tip:expPts===35?'Experiencia suficiente':expPts>0?'Experiencia parcial':'Sin experiencia registrada'});

  // 3. Habilidades (max 15)
  var rH=(perf.habilidades||[]).map(function(h){return h.toLowerCase();});
  var cH=(c.habilidades||[]).map(function(h){return h.toLowerCase();});
  var skillPts,skillDet;
  if(!rH.length){skillPts=15;skillDet='Sin habilidades requeridas en el perfil';}
  else{
    var mH=rH.filter(function(h){return cH.some(function(ch){return ch.indexOf(h)>=0||h.indexOf(ch)>=0;});}).length;
    skillPts=Math.round(mH/rH.length*15);
    skillDet=mH+' de '+rH.length+' habilidades requeridas encontradas';
  }
  items.push({icon:'⚡',label:'Habilidades',pts:skillPts,max:15,detalle:skillDet,
    tip:skillPts>=12?'Perfil compatible':'Faltan habilidades clave'});

  // 4. Software / Herramientas (max 10)
  var rS=(perf.software||[]).map(function(s){return s.toLowerCase();});
  var cS=[].concat(c.habilidades||[]).concat(c.idiomas||[]).map(function(x){return x.toLowerCase();});
  var softPts,softDet;
  if(!rS.length){softPts=10;softDet='Sin herramientas requeridas en el perfil';}
  else{
    var mS=rS.filter(function(s){return cS.some(function(cs){return cs.indexOf(s)>=0||s.indexOf(cs)>=0;});}).length;
    softPts=Math.round(mS/rS.length*10);
    softDet=mS+' de '+rS.length+' herramientas encontradas';
  }
  items.push({icon:'💻',label:'Software / Herramientas',pts:softPts,max:10,detalle:softDet,
    tip:softPts>=8?'Dominio adecuado':'Conocimiento limitado de las herramientas'});

  // 5. Idiomas (max 5)
  var rI=(perf.idiomas||['Espanol']).map(function(i){return i.toLowerCase();});
  var cI=(c.idiomas||[]).map(function(i){return i.toLowerCase();});
  var mI=rI.filter(function(i){return cI.some(function(ci){return ci.indexOf(i)>=0||i.indexOf(ci)>=0;});}).length;
  var langPts=Math.round(mI/Math.max(1,rI.length)*5);
  items.push({icon:'🌐',label:'Idiomas',pts:langPts,max:5,
    detalle:mI+' de '+rI.length+' idiomas requeridos',
    tip:langPts===5?'Idiomas correctos':'Faltan idiomas requeridos'});

  var autoTotal=items.reduce(function(s,it){return s+it.pts;},0);
  var maxTotal=items.reduce(function(s,it){return s+it.max;},0); // 100

  // ── HTML del modal ──────────────────────────────────────
  var sc=barColor(autoTotal);
  var html='<div style="background:'+(autoTotal>=75?'#f0fdf4':autoTotal>=50?'#fffbeb':'#fff1f2')+';border:2px solid '+sc+';'
    +'border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">'
    +'<div>'
    +'<div style="font-size:11px;font-weight:700;color:'+sc+';text-transform:uppercase;margin-bottom:3px">Puntaje automático calculado</div>'
    +'<div style="font-size:11px;color:#64748b">Educación y experiencia tienen mayor peso (35% c/u)</div>'
    +'</div>'
    +'<div style="font-size:44px;font-weight:900;color:'+sc+'">'+autoTotal+'%</div>'
    +'</div>';

  // Tabla de desglose
  html+='<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px">'
    +'<thead><tr><th style="text-align:left;padding:8px 10px;background:#f8fafc;font-size:11px;text-transform:uppercase;color:#64748b">Criterio</th>'
    +'<th style="text-align:center;padding:8px 10px;background:#f8fafc;font-size:11px;text-transform:uppercase;color:#64748b">Puntos</th>'
    +'<th style="text-align:center;padding:8px 10px;background:#f8fafc;font-size:11px;text-transform:uppercase;color:#64748b">Máximo</th>'
    +'<th style="padding:8px 10px;background:#f8fafc;font-size:11px;text-transform:uppercase;color:#64748b">Detalle</th>'
    +'</tr></thead><tbody>';

  items.forEach(function(it){
    var pct=Math.round(it.pts/it.max*100);
    var col=it.pts>=it.max*.75?'#059669':it.pts>=it.max*.5?'#d97706':'#dc2626';
    html+='<tr style="border-bottom:1px solid #f1f5f9">'
      +'<td style="padding:10px"><strong>'+it.icon+' '+it.label+'</strong></td>'
      +'<td style="text-align:center;font-size:18px;font-weight:900;color:'+col+'">'+it.pts+'</td>'
      +'<td style="text-align:center;color:#94a3b8;font-size:13px">'+it.max+'</td>'
      +'<td style="font-size:12px;color:#475569">'
      +'<div>'+it.detalle+'</div>'
      +'<div style="font-size:11px;color:'+col+';font-weight:600;margin-top:2px">'+it.tip+'</div>'
      +'</td></tr>';
  });

  html+='<tr style="background:#f8fafc;font-weight:800">'
    +'<td style="padding:10px">TOTAL</td>'
    +'<td style="text-align:center;font-size:20px;color:'+sc+'">'+autoTotal+'</td>'
    +'<td style="text-align:center;color:#94a3b8">100</td>'
    +'<td></td></tr>';
  html+='</tbody></table>';

  // Edición manual
  html+='<div style="border-top:2px solid #e2e8f0;padding-top:16px">'
    +'<div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:10px">✏️ Ajustar puntaje manualmente</div>'
    +'<div style="font-size:12px;color:#64748b;margin-bottom:12px">Si consideras que el candidato merece otro puntaje basándote en otros factores, ingrésalo aquí. Este valor sobreescribirá el automático.</div>'
    +'<div style="display:flex;align-items:center;gap:12px">'
    +'<input type="number" id="pre-manual" min="0" max="100" value="'+score+'" '
    +'style="width:100px;font-size:28px;font-weight:800;text-align:center;padding:8px;'
    +'border:2px solid #e2e8f0;border-radius:12px;outline:none" '
    +'onfocus="this.style.borderColor=\'#4f46e5\'" onblur="this.style.borderColor=\'#e2e8f0\'">'
    +'<span style="font-size:18px;color:#64748b">/ 100</span>'
    +'<button class="btn bo bxs" onclick="usarAutoPre(\''+candId+'\','+autoTotal+')" '
    +'style="font-size:12px">↩ Usar automático ('+autoTotal+')</button>'
    +'</div></div>';

  openM('📊 Desglose — '+nombre, html,
    '<button class="btn bo" onclick="closeM()">Cancelar</button>'
    +'<button class="btn bp" onclick="guardarPuntajePre(\''+candId+'\')">💾 Guardar puntaje</button>',
    true);
}

function usarAutoPre(candId, autoVal){
  var el=document.getElementById('pre-manual');
  if(el)el.value=autoVal;
}

function guardarPuntajePre(candId){
  var el=document.getElementById('pre-manual');
  if(!el)return;
  var val=parseInt(el.value);
  if(isNaN(val)||val<0||val>100){toast('Ingresa un valor entre 0 y 100','err');return;}
  var all=DB.cands();
  var idx=-1;all.forEach(function(c,i){if(c.id===candId)idx=i;});if(idx<0)return;
  all[idx].puntajePreseleccion=val;
  all[idx].puntajeTotal=calcTot(all[idx]);
  DB.sCands(all);
  closeM();
  toast('Puntaje actualizado: '+val+'%','ok');
  pgPresel();
}

// ── AUTO-CLASIFICAR ──────────────────────────────────────
function autoPre(convId){
  var conv=DB.convs().find(function(c){return c.id===convId;}),perf=conv?DB.perfiles().find(function(p){return p.id===conv.perfilId;}):null;
  var all=DB.cands();
  all.forEach(function(c,i){
    if(c.convocatoriaId!==convId||c.decisionDirector)return;
    var s=calcPre(c,perf);all[i].puntajePreseleccion=s;
    if(['postulado','preseleccionado','descartado_pre'].indexOf(c.etapa)>=0)all[i].etapa=s>=50?'preseleccionado':'descartado_pre';
  });
  DB.sCands(all);toast('Clasificación aplicada','ok');pgPresel();
}

function pasarSel(convId){
  var all=DB.cands();var n=0;
  all.forEach(function(c,i){if(c.convocatoriaId===convId&&c.etapa==='preseleccionado'){all[i].etapa='en_seleccion';n++;}});
  DB.sCands(all);toast(n+' candidatos pasaron a Selección','ok');pgPresel();
}
