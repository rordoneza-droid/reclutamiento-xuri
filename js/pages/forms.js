// ══════════════════════════════════════════════════════
// FORMS.JS — Formularios, Tests (Big5, SCL, Cargo, Entrevista)
// ══════════════════════════════════════════════════════

var formsTab=0;
var fcargoConv='';
var entFormConv='';

function pgForms(){
  document.getElementById('tb-act').innerHTML='';
  var tabs=['🧠 Psicométrico (Big Five)','💭 Psicológico (Screening)','📋 Por Cargo','🎤 Entrevista Estándar'];
  var tabsH=tabs.map(function(t,i){return'<div class="tab'+(formsTab===i?' on':'')+'" onclick="formsTab='+i+';pgForms()">'+t+'</div>';}).join('');
  var body='';
  if(formsTab===0)body=renderBig5Panel();
  else if(formsTab===1)body=renderSCLPanel();
  else if(formsTab===2)body=renderCargoPanelForms();
  else if(formsTab===3)body=renderEntPanel();
  document.getElementById('ct').innerHTML='<div class="tabs">'+tabsH+'</div>'+body;
}

// ── BIG FIVE ─────────────────────────────────────────
function renderBig5Panel(){
  var cands=DB.cands().filter(function(c){return['en_seleccion','en_entrevista','finalista','seleccionado'].indexOf(c.etapa)>=0;});
  var res=DB.resultados();
  var rows=cands.map(function(c){
    var r=res.find(function(x){return x.candId===c.id&&x.tipo==='big5';});
    var scores=r?Object.keys(B5_DIM).map(function(d){return'<span class="bdg b-gr" style="margin:1px">'+d+':'+(r.dims[d]||0)+'</span>';}).join(''):'<span class="tgr txs">Sin aplicar</span>';
    return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong></td>'
      +'<td>'+(c.convocatoriaId?(DB.convs().find(function(x){return x.id===c.convocatoriaId;})||{titulo:'-'}).titulo:'-')+'</td>'
      +'<td>'+scores+'</td>'
      +'<td><button class="btn bp bxs" onclick="abrirTest(\''+c.id+'\',\'big5\')">'+( r?'🔄 Repetir':'▶ Aplicar')+'</button></td></tr>';
  }).join('');
  return'<div class="al al-i"><strong>Test Big Five (BFI-2 adaptado, 20 preguntas)</strong> — Mide personalidad en 5 dimensiones.</div>'
    +'<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Convocatoria</th><th>Resultados</th><th></th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="4" class="tgr" style="text-align:center;padding:20px">No hay candidatos en proceso activo</td></tr>')
    +'</tbody></table></div></div>';
}

// ── SCL SCREENING ────────────────────────────────────
function renderSCLPanel(){
  var cands=DB.cands().filter(function(c){return['en_seleccion','en_entrevista','finalista','seleccionado'].indexOf(c.etapa)>=0;});
  var res=DB.resultados();
  var rows=cands.map(function(c){
    var r=res.find(function(x){return x.candId===c.id&&(x.tipo==='scl'||x.tipo==='screening');});
    var flag=r&&r.dims?calcSCLFlag(r.dims):'';
    return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong></td>'
      +'<td>'+(c.convocatoriaId?(DB.convs().find(function(x){return x.id===c.convocatoriaId;})||{titulo:'-'}).titulo:'-')+'</td>'
      +'<td>'+(r?flag:'<span class="tgr txs">Sin aplicar</span>')+'</td>'
      +'<td><button class="btn bw bxs" onclick="abrirTest(\''+c.id+'\',\'scl\')">'+( r?'🔄 Repetir':'▶ Aplicar')+'</button></td></tr>';
  }).join('');
  return'<div class="al al-w"><strong>Screening Psicológico (basado en SCL-90-R, 25 preguntas)</strong> — Detecta alertas: ansiedad, hostilidad, paranoia.</div>'
    +'<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Convocatoria</th><th>Resultado</th><th></th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="4" class="tgr" style="text-align:center;padding:20px">No hay candidatos en proceso activo</td></tr>')
    +'</tbody></table></div></div>';
}
function calcSCLFlag(dims){
  var flags=[];
  Object.keys(dims).forEach(function(d){if(dims[d]>=(SCL_UMBRAL[d]||1.0))flags.push(SCL_DIM[d]||d);});
  if(!flags.length)return'<span class="bdg b-gn">✓ Sin alertas</span>';
  return flags.map(function(f){return'<span class="bdg b-rd" style="margin:1px">⚠ '+f+'</span>';}).join('');
}

// ── FORMULARIO POR CARGO ─────────────────────────────
function renderCargoPanelForms(){
  var convs=DB.convs();
  var opts=convs.map(function(c){return'<option value="'+c.id+'"'+(fcargoConv===c.id?' selected':'')+'>'+c.titulo+'</option>';}).join('');
  var body='';
  if(fcargoConv){
    var conv=convs.find(function(c){return c.id===fcargoConv;});
    var perf=conv?DB.perfiles().find(function(p){return p.id===conv.perfilId;}):null;
    var forms=DB.forms().filter(function(f){return f.tipo==='cargo'&&(f.convId===fcargoConv||f.perfilId===(perf&&perf.id));});
    var cands=DB.cands().filter(function(c){return c.convocatoriaId===fcargoConv&&['en_seleccion','en_entrevista','finalista'].indexOf(c.etapa)>=0;});
    var res=DB.resultados();
    var fsel=forms.length?forms[0]:null;
    var formSelector=forms.length?'<select onchange="selFormCargo(this.value)" id="fsel_cargo">'+forms.map(function(f){return'<option value="'+f.id+'">'+f.nombre+'</option>';}).join('')+'</select>':'';
    var candRows=cands.map(function(c){
      var r=fsel?res.find(function(x){return x.candId===c.id&&x.tipo==='cargo'&&x.formId===fsel.id;}):null;
      return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong></td>'
        +'<td>'+(r?'<span class="bdg b-gn">'+r.puntaje+'%</span>':'<span class="tgr txs">Pendiente</span>')+'</td>'
        +'<td>'+(fsel?'<button class="btn bp bxs" onclick="abrirFormCargo(\''+c.id+'\',\''+fsel.id+'\')">'+( r?'🔄 Repetir':'▶ Aplicar')+'</button>':'<span class="tgr txs">Sin form.</span>')+'</td></tr>';
    }).join('');
    body='<div class="flex g2 mb3" style="flex-wrap:wrap">'
      +(formSelector?formSelector:'<span class="tgr txs">No hay formularios para esta convocatoria</span>')
      +'<button class="btn bp bxs" onclick="modalNuevoFormCargo(\''+fcargoConv+'\')">+ Nuevo formulario</button></div>'
      +(cands.length?'<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Puntaje</th><th></th></tr></thead><tbody>'+candRows+'</tbody></table></div></div>':'<div class="al al-i">No hay candidatos activos en esta convocatoria.</div>');
  }
  return'<div class="al al-i">Crea formularios específicos para cada cargo. Se reutilizan en futuras convocatorias del mismo perfil.</div>'
    +'<div class="fg" style="max-width:380px"><label>Convocatoria</label><select onchange="fcargoConv=this.value;pgForms()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+body;
}
function modalNuevoFormCargo(convId){
  var nom=prompt('Nombre del formulario:');
  if(!nom||!nom.trim())return;
  var conv=DB.convs().find(function(c){return c.id===convId;});
  var f={id:uid(),tipo:'cargo',nombre:nom.trim(),convId:convId,perfilId:conv&&conv.perfilId,preguntas:[],creado:today()};
  var all=DB.forms();all.push(f);DB.sForms(all);
  toast('Formulario creado','ok');
  setTimeout(function(){editFormCargo(f.id);},300);
}
function editFormCargo(formId){
  var f=DB.forms().find(function(x){return x.id===formId;});if(!f)return;
  var pRows=f.preguntas.map(function(p,i){
    return'<div class="flex ic g2 mb2"><span style="flex:1;font-size:12px">'+p.txt+'</span>'
      +'<span class="bdg b-gr txs">'+p.tipo+'</span>'
      +'<button class="btn br bxs" onclick="delPregFormCargo(\''+formId+'\','+i+')">✕</button></div>';
  }).join('');
  openM('Editar: '+f.nombre,
    (pRows?'<div class="mb3">'+pRows+'</div><div class="div"></div>':'<div class="tgr txs mb3">Sin preguntas aún.</div>')
    +'<div class="fr fr2"><div class="fg"><label>Tipo</label><select id="nfp_t"><option value="abierta">Respuesta abierta</option><option value="escala">Escala 1-5</option><option value="sino">Sí / No</option><option value="multiple">Opción múltiple</option></select></div>'
    +'<div class="fg" style="flex:2"><label>Pregunta</label><input id="nfp_txt" placeholder="Escriba la pregunta..."></div></div>'
    +'<div class="fg" id="nfp_ops_wrap" style="display:none"><label>Opciones (separadas por |)</label><input id="nfp_ops" placeholder="Opción A|Opción B|Opción C"></div>',
    '<button class="btn bo" onclick="closeM()">Cerrar</button><button class="btn bp" onclick="addPregFormCargo(\''+formId+'\')">+ Agregar pregunta</button>',true);
  setTimeout(function(){
    var sel=document.getElementById('nfp_t');
    if(sel)sel.addEventListener('change',function(){document.getElementById('nfp_ops_wrap').style.display=this.value==='multiple'?'block':'none';});
  },60);
}
function addPregFormCargo(formId){
  var txt=(document.getElementById('nfp_txt')||{}).value.trim();
  var tipo=(document.getElementById('nfp_t')||{}).value||'abierta';
  var ops=(document.getElementById('nfp_ops')||{}).value.trim();
  if(!txt){toast('Escribe la pregunta','err');return;}
  var all=DB.forms();var idx=all.findIndex(function(x){return x.id===formId;});if(idx<0)return;
  var p={txt:txt,tipo:tipo};
  if(tipo==='multiple'&&ops)p.opciones=ops.split('|').map(function(x){return x.trim();}).filter(Boolean);
  all[idx].preguntas.push(p);
  DB.sForms(all);toast('Pregunta agregada','ok');editFormCargo(formId);
}
function delPregFormCargo(formId,i){
  var all=DB.forms();var idx=all.findIndex(function(x){return x.id===formId;});if(idx<0)return;
  all[idx].preguntas.splice(i,1);DB.sForms(all);editFormCargo(formId);
}
function abrirFormCargo(candId,formId){
  var f=DB.forms().find(function(x){return x.id===formId;});
  var c=DB.cands().find(function(x){return x.id===candId;});
  if(!f||!c){toast('No encontrado','err');return;}
  if(!f.preguntas.length){toast('Este formulario no tiene preguntas. Edítalo primero.','w');return;}
  var pregs=f.preguntas.map(function(p,i){
    var inp='';
    if(p.tipo==='escala'){
      inp='<div class="rw"><input type="range" id="fcr_'+i+'" min="1" max="5" value="3" oninput="document.getElementById(\'fcv_'+i+'\').textContent=this.value"><span class="rv" id="fcv_'+i+'">3</span></div>';
    }else if(p.tipo==='sino'){
      inp='<select id="fcr_'+i+'"><option value="si">Sí</option><option value="no">No</option></select>';
    }else if(p.tipo==='multiple'&&p.opciones){
      inp='<select id="fcr_'+i+'">'+p.opciones.map(function(o){return'<option>'+o+'</option>';}).join('')+'</select>';
    }else{
      inp='<textarea id="fcr_'+i+'" rows="2" placeholder="Respuesta..."></textarea>';
    }
    return'<div class="fg"><label>'+(i+1)+'. '+p.txt+'</label>'+inp+'</div>';
  }).join('');
  openM('Formulario: '+f.nombre+' — '+c.apellidos+', '+c.nombres,
    '<div class="al al-i">Completa todas las respuestas.</div>'+pregs,
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bp" onclick="guardarFormCargo(\''+candId+'\',\''+formId+'\')">Guardar</button>',true);
}
function guardarFormCargo(candId,formId){
  var f=DB.forms().find(function(x){return x.id===formId;});if(!f)return;
  var resps=f.preguntas.map(function(p,i){var el=document.getElementById('fcr_'+i);return{txt:p.txt,tipo:p.tipo,resp:el?el.value:''};});
  var puntuables=resps.filter(function(r){return r.tipo==='escala';});
  var puntaje=puntuables.length?Math.round(puntuables.reduce(function(s,r){return s+((parseInt(r.resp)||3)-1)*25;},0)/puntuables.length):null;
  var all=DB.resultados();
  var idx=all.findIndex(function(x){return x.candId===candId&&x.tipo==='cargo'&&x.formId===formId;});
  var reg={candId:candId,tipo:'cargo',formId:formId,formNombre:f.nombre,resps:resps,puntaje:puntaje,fecha:today()};
  if(idx>=0)all[idx]=reg;else all.push(reg);
  DB.sResultados(all);closeM();toast('Formulario guardado','ok');pgForms();
}

// ── ENTREVISTA ESTÁNDAR (RRHH) ───────────────────────
function renderEntPanel(){
  var convs=DB.convs();
  var opts=convs.map(function(c){return'<option value="'+c.id+'"'+(entFormConv===c.id?' selected':'')+'>'+c.titulo+'</option>';}).join('');
  var body='';
  if(entFormConv){
    var cands=DB.cands().filter(function(c){return c.convocatoriaId===entFormConv&&['en_entrevista','finalista'].indexOf(c.etapa)>=0;});
    var res=DB.resultados();
    var rows=cands.map(function(c){
      var r=res.find(function(x){return x.candId===c.id&&x.tipo==='entrevista';});
      return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong></td>'
        +'<td>'+(r?'<span class="bdg b-gn">Completada</span>':'<span class="tgr txs">Pendiente</span>')+'</td>'
        +'<td>'+(r?'<span class="bdg b-bl">'+r.recomendacion+'</span>':'-')+'</td>'
        +'<td><button class="btn bp bxs" onclick="abrirEntEstandar(\''+c.id+'\')">'+( r?'🔄 Ver/Editar':'▶ Iniciar')+'</button></td></tr>';
    }).join('');
    body='<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Estado</th><th>Recomendación</th><th></th></tr></thead><tbody>'
      +(rows||'<tr><td colspan="4" class="tgr" style="text-align:center;padding:20px">No hay candidatos en entrevistas</td></tr>')+'</tbody></table></div></div>';
  }
  return'<div class="al al-i"><strong>Entrevista estándar (14 preguntas)</strong> — Aplicable a todos los cargos. Registra observaciones y recomendación del entrevistador.</div>'
    +'<div class="fg" style="max-width:380px"><label>Convocatoria</label><select onchange="entFormConv=this.value;pgForms()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+body;
}
function abrirEntEstandar(candId){
  var c=DB.cands().find(function(x){return x.id===candId;});if(!c)return;
  var prev=DB.resultados().find(function(x){return x.candId===candId&&x.tipo==='entrevista';});
  var cats=[...new Set(ENT_PREGUNTAS.map(function(p){return p.cat;}))];
  var pregs=cats.map(function(cat){
    var ps=ENT_PREGUNTAS.filter(function(p){return p.cat===cat;});
    return'<div class="mb3"><div class="txs tbold tgr mb2" style="text-transform:uppercase;letter-spacing:.05em">'+cat+'</div>'
      +ps.map(function(p){
        var val=prev&&prev.resps?((prev.resps.find(function(r){return r.id===p.id;})||{}).resp||''):'';
        return'<div class="fg"><label>'+p.txt+'</label><textarea id="ep_'+p.id+'" rows="2" placeholder="Observaciones del entrevistador...">'+val+'</textarea></div>';
      }).join('')+'</div>';
  }).join('<div class="div"></div>');
  var prevRec=prev&&prev.recomendacion||'recomendar';
  openM('Entrevista Estándar — '+c.apellidos+', '+c.nombres,
    '<div class="fg"><label>Entrevistador</label><input id="ep_ent" value="'+(prev&&prev.entrevistador||getCfg().dirRRHH||'')+'"></div>'
    +'<div class="div"></div>'+pregs+'<div class="div"></div>'
    +'<div class="fg"><label>Recomendación final</label><select id="ep_rec"><option value="recomendar"'+(prevRec==='recomendar'?' selected':'')+'>Recomendar</option><option value="reserva"'+(prevRec==='reserva'?' selected':'')+'>Reserva</option><option value="no recomendar"'+(prevRec==='no recomendar'?' selected':'')+'>No recomendar</option></select></div>'
    +'<div class="fg"><label>Observaciones generales</label><textarea id="ep_obs" rows="3">'+(prev&&prev.obs||'')+'</textarea></div>',
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bp" onclick="guardarEntEstandar(\''+candId+'\')">Guardar</button>',true);
}
function guardarEntEstandar(candId){
  var ent=document.getElementById('ep_ent');var rec=document.getElementById('ep_rec');var obs=document.getElementById('ep_obs');
  var resps=ENT_PREGUNTAS.map(function(p){var el=document.getElementById('ep_'+p.id);return{id:p.id,txt:p.txt,resp:el?el.value.trim():''};});
  var all=DB.resultados();
  var idx=all.findIndex(function(x){return x.candId===candId&&x.tipo==='entrevista';});
  var reg={candId:candId,tipo:'entrevista',entrevistador:ent?ent.value:'',resps:resps,recomendacion:rec?rec.value:'recomendar',obs:obs?obs.value:'',fecha:today()};
  if(idx>=0)all[idx]=reg;else all.push(reg);
  DB.sResultados(all);closeM();toast('Entrevista guardada','ok');pgForms();
}

// ── APLICAR TEST (Big5 / SCL) ────────────────────────
function abrirTest(candId,tipo){
  var c=DB.cands().find(function(x){return x.id===candId;});if(!c)return;
  var pregs=tipo==='big5'?BIG5_PREGUNTAS:SCL_PREGUNTAS;
  var escala=tipo==='big5'
    ?['1 - Muy en desacuerdo','2','3 - Neutro','4','5 - Muy de acuerdo']
    :['0 - Nunca','1 - Poco','2 - Moderadamente','3 - Bastante','4 - Mucho'];
  var prev=DB.resultados().find(function(x){return x.candId===candId&&x.tipo===tipo;});
  var header=tipo==='big5'
    ?'<div class="al al-i">Indique su grado de acuerdo con cada afirmación. No hay respuestas correctas o incorrectas.</div>'
    :'<div class="al al-w">Este cuestionario es CONFIDENCIAL. Indique con qué frecuencia ha experimentado cada situación en los últimos 30 días.</div>';
  var form=pregs.map(function(p,i){
    var prevVal=prev&&prev.resps?((prev.resps.find(function(r){return r.id===p.id;})||{}).val||''):tipo==='big5'?3:0;
    return'<div class="fg"><label style="font-size:12px;font-weight:500">'+(i+1)+'. '+p.txt+'</label>'
      +'<div class="rw"><input type="range" id="tr_'+p.id+'" min="'+(tipo==='big5'?1:0)+'" max="'+(tipo==='big5'?5:4)+'" value="'+prevVal+'" oninput="document.getElementById(\'tv_'+p.id+'\').textContent=this.value">'
      +'<span class="rv" id="tv_'+p.id+'">'+prevVal+'</span></div>'
      +'<div class="txs tgr flex jb"><span>'+(escala[0])+'</span><span>'+(escala[escala.length-1])+'</span></div></div>';
  }).join('');
  openM((tipo==='big5'?'Test Big Five — ':'Screening Psicológico — ')+c.apellidos+', '+c.nombres,
    header+form,
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bp" onclick="guardarTest(\''+candId+'\',\''+tipo+'\')">Guardar resultados</button>',true);
}
function guardarTest(candId,tipo){
  var pregs=tipo==='big5'?BIG5_PREGUNTAS:SCL_PREGUNTAS;
  var resps=pregs.map(function(p){
    var el=document.getElementById('tr_'+p.id);
    return{id:p.id,dim:p.dim,val:el?parseInt(el.value):(tipo==='big5'?3:0),inv:p.inv||false};
  });
  var dims={};
  if(tipo==='big5'){
    ['E','A','C','N','O'].forEach(function(d){
      var items=resps.filter(function(r){return r.dim===d;});
      var sum=items.reduce(function(s,r){return s+(r.inv?(6-r.val):r.val);},0);
      dims[d]=items.length?Math.round(sum/items.length*10)/10:0;
    });
  }else{
    Object.keys(SCL_DIM).forEach(function(d){
      var items=resps.filter(function(r){return r.dim===d;});
      dims[d]=items.length?Math.round(items.reduce(function(s,r){return s+r.val;},0)/items.length*10)/10:0;
    });
  }
  var all=DB.resultados();
  var idx=all.findIndex(function(x){return x.candId===candId&&x.tipo===tipo;});
  var reg={candId:candId,tipo:tipo,resps:resps,dims:dims,fecha:today()};
  if(idx>=0)all[idx]=reg;else all.push(reg);
  DB.sResultados(all);closeM();toast('Resultados guardados','ok');pgForms();
}

function abrirTestCandidato(){window.open('test.html','_blank');}
