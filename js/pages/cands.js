// ══════════════════════════════════════════════════════
// CANDS.JS — Gestión de candidatos
// ══════════════════════════════════════════════════════
var filtC='';
function pgCands(){
  var convs=DB.convs(),cands=DB.cands();
  document.getElementById('tb-act').innerHTML='<button class="btn bp bs" onclick="modalCand()">+ Registrar</button>';
  var opts=convs.map(function(c){return'<option value="'+c.id+'" '+(filtC===c.id?'selected':'')+'>'+c.titulo+'</option>';}).join('');
  var list=filtC?cands.filter(function(c){return c.convocatoriaId===filtC;}):cands;
  var rows=list.map(function(c){
    var conv=convs.find(function(x){return x.id===c.convocatoriaId;});
    return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong><br><span class="tgr txs">'+(c.cedula||'-')+' | '+(c.ciudad||'-')+'</span></td>'
      +'<td><span class="txs">'+(conv?conv.titulo:'-')+'</span></td>'
      +'<td>'+fBdg(c.fuente)+'</td>'
      +'<td><span class="bdg '+(EB[c.etapa]||'b-gr')+'">'+(EL[c.etapa]||c.etapa)+'</span></td>'
      +'<td>'+(c.puntajeTotal!=null?'<span class="bdg '+sCls(c.puntajeTotal)+'">'+c.puntajeTotal+'%</span>':'-')+'</td>'
      +'<td><div class="flex g2">'
      +'<button class="btn bo bxs" onclick="modalCand(\''+c.id+'\')">✏️</button>'
      +'<button class="btn bo bxs" onclick="verCand(\''+c.id+'\')">👁</button>'
      +'<button class="btn bo bxs" onclick="delCand(\''+c.id+'\')">🗑️</button>'
      +'</div></td></tr>';
  }).join('');
  document.getElementById('ct').innerHTML=
    '<div class="flex jb ic mb3" style="flex-wrap:wrap;gap:10px">'
    +'<select style="max-width:300px" onchange="filtC=this.value;pgCands()"><option value="">- Todas las convocatorias -</option>'+opts+'</select>'
    +'<span class="tgr tsm">'+list.length+' candidato(s)</span></div>'
    +'<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Convocatoria</th><th>Fuente</th><th>Etapa</th><th>Puntaje</th><th></th></tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="6" class="tgr" style="text-align:center;padding:20px">Sin candidatos</td></tr>')+'</tbody></table></div></div>';
}

function modalCand(id){
  var convs=DB.convs();if(!convs.length){toast('Crea una convocatoria primero','w');return;}
  var c=id?DB.cands().find(function(x){return x.id===id;}):null;
  var v=c||{nombres:'',apellidos:'',cedula:'',email:'',telefono:'',ciudad:'',convocatoriaId:filtC||'',fuente:'correo',referidoPor:'',educacion:[],experiencia:[],habilidades:[],idiomas:[],notas:''};
  var opts=convs.map(function(x){return'<option value="'+x.id+'" '+(v.convocatoriaId===x.id?'selected':'')+'>'+x.titulo+'</option>';}).join('');
  var body='<div class="tabs"><div class="tab on" id="cat0" onclick="swTab(\'ca\',0)">Personal</div><div class="tab" id="cat1" onclick="swTab(\'ca\',1)">Formacion</div><div class="tab" id="cat2" onclick="swTab(\'ca\',2)">Experiencia</div></div>'
    +'<div id="cap0">'
    +'<div class="fr fr2"><div class="fg"><label>Nombres <span class="rq">*</span></label><input id="ca_nm" value="'+v.nombres+'"></div><div class="fg"><label>Apellidos <span class="rq">*</span></label><input id="ca_ap" value="'+v.apellidos+'"></div></div>'
    +'<div class="fr fr3"><div class="fg"><label>Cedula</label><input id="ca_ci" value="'+(v.cedula||'')+'"></div><div class="fg"><label>Telefono</label><input id="ca_tf" value="'+(v.telefono||'')+'"></div><div class="fg"><label>Ciudad</label><input id="ca_cd" value="'+(v.ciudad||'')+'"></div></div>'
    +'<div class="fg"><label>Email</label><input id="ca_em" type="email" value="'+(v.email||'')+'"></div>'
    +'<div class="fr fr2"><div class="fg"><label>Convocatoria <span class="rq">*</span></label><select id="ca_cv"><option value="">-</option>'+opts+'</select></div>'
    +'<div class="fg"><label>Fuente</label><select id="ca_fu" onchange="document.getElementById(\'ref_b\').style.display=this.value===\'referido\'?\'block\':\'none\'"><option value="correo" '+(v.fuente==='correo'?'selected':'')+'>Correo</option><option value="referido" '+(v.fuente==='referido'?'selected':'')+'>Referido</option><option value="otro" '+(v.fuente==='otro'?'selected':'')+'>Otro</option></select></div></div>'
    +'<div id="ref_b" style="display:'+(v.fuente==='referido'?'block':'none')+'" class="fg"><label>Referido por</label><input id="ca_rf" value="'+(v.referidoPor||'')+'"></div>'
    +'<div class="fg"><label>Notas</label><textarea id="ca_no" rows="2">'+(v.notas||'')+'</textarea></div></div>'
    +'<div id="cap1" class="dn"><div id="edu_l">'+eduRw(v.educacion||[])+'</div><button class="btn bo bs mt2" onclick="addEdu()">+ Formacion</button>'
    +'<div class="fg mt3"><label>Habilidades</label><div class="cc" id="chh_cc"><input type="hidden" id="chh_h"></div></div>'
    +'<div class="fg"><label>Idiomas</label><div class="cc" id="chi_cc"><input type="hidden" id="chi_h"></div></div></div>'
    +'<div id="cap2" class="dn"><div id="exp_l">'+expRw(v.experiencia||[])+'</div><button class="btn bo bs mt2" onclick="addExp()">+ Experiencia</button></div>';
  openM(id?'Editar Candidato':'Registrar Candidato',body,'<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bp" onclick="saveCand(\''+(id||'')+'\')">Guardar</button>',true);
  setTimeout(function(){mkCC('chh_cc','chh_h',v.habilidades||[]);mkCC('chi_cc','chi_h',v.idiomas||[]);},60);
}

function eduRw(arr){return arr.map(function(e){return'<div class="fr fr3 edu-r"><input class="ed_i" value="'+(e.institucion||'')+'" placeholder="Institucion"><input class="ed_t" value="'+(e.titulo||'')+'" placeholder="Titulo"><div class="flex g2"><select class="ed_n"><option '+(e.nivel==='Bachillerato'?'selected':'')+'>Bachillerato</option><option '+(e.nivel==='Tecnico'?'selected':'')+'>Tecnico</option><option '+(e.nivel==='Tecnologo'?'selected':'')+'>Tecnologo</option><option '+(e.nivel==='Tercer Nivel'?'selected':'')+'>Tercer Nivel</option><option '+(e.nivel==='Cuarto Nivel'?'selected':'')+'>Cuarto Nivel</option></select><button class="btn bo bxs" onclick="this.closest(\'.edu-r\').remove()">✕</button></div></div>';}).join('');}
function expRw(arr){return arr.map(function(e){return'<div class="exp-r" style="background:var(--g50);padding:10px;border-radius:6px;margin-bottom:8px"><div class="fr fr2"><input class="ex_e" value="'+(e.empresa||'')+'" placeholder="Empresa"><input class="ex_c" value="'+(e.cargo||'')+'" placeholder="Cargo"></div><div class="fr fr3"><input class="ex_a" value="'+(e.area||'')+'" placeholder="Area"><input type="month" class="ex_i" value="'+(e.inicio||'')+'"><div class="flex g2"><input type="month" class="ex_f" value="'+(e.fin||'')+'"><button class="btn bo bxs" onclick="this.closest(\'.exp-r\').remove()">✕</button></div></div></div>';}).join('');}
function addEdu(){var l=document.getElementById('edu_l');if(l)l.insertAdjacentHTML('beforeend',eduRw([{}]));}
function addExp(){var l=document.getElementById('exp_l');if(l)l.insertAdjacentHTML('beforeend',expRw([{}]));}
function getEdu(){return Array.from(document.querySelectorAll('.edu-r')).map(function(r){return{institucion:r.querySelector('.ed_i')&&r.querySelector('.ed_i').value||'',titulo:r.querySelector('.ed_t')&&r.querySelector('.ed_t').value||'',nivel:r.querySelector('.ed_n')&&r.querySelector('.ed_n').value||''};}).filter(function(e){return e.institucion||e.titulo;});}
function getExp(){return Array.from(document.querySelectorAll('.exp-r')).map(function(r){return{empresa:r.querySelector('.ex_e')&&r.querySelector('.ex_e').value||'',cargo:r.querySelector('.ex_c')&&r.querySelector('.ex_c').value||'',area:r.querySelector('.ex_a')&&r.querySelector('.ex_a').value||'',inicio:r.querySelector('.ex_i')&&r.querySelector('.ex_i').value||'',fin:r.querySelector('.ex_f')&&r.querySelector('.ex_f').value||''};}).filter(function(e){return e.empresa||e.cargo;});}

function saveCand(id){
  function g(i){var e=document.getElementById(i);return e?e.value:'';}
  var old=id?DB.cands().find(function(x){return x.id===id;})||{}:{};
  var c={id:id||uid(),nombres:g('ca_nm').trim(),apellidos:g('ca_ap').trim(),
    cedula:g('ca_ci'),email:g('ca_em'),telefono:g('ca_tf'),ciudad:g('ca_cd'),
    convocatoriaId:g('ca_cv'),fuente:g('ca_fu'),referidoPor:g('ca_rf'),notas:g('ca_no'),
    educacion:getEdu(),experiencia:getExp(),habilidades:gChips('chh_h'),idiomas:gChips('chi_h'),
    etapa:old.etapa||'postulado',
    puntajePreseleccion:old.puntajePreseleccion!=null?old.puntajePreseleccion:null,
    puntajeSeleccion:old.puntajeSeleccion!=null?old.puntajeSeleccion:null,
    puntajeEntrevista:old.puntajeEntrevista!=null?old.puntajeEntrevista:null,
    puntajeTotal:old.puntajeTotal!=null?old.puntajeTotal:null,
    decisionDirector:old.decisionDirector||null,notaDirector:old.notaDirector||'',
    justificacion:old.justificacion||'',pruebas:old.pruebas||[],entrevistas:old.entrevistas||[],
    cre:old.cre||today()};
  if(!c.nombres){toast('El nombre es requerido','err');return;}
  if(!c.convocatoriaId){toast('Selecciona una convocatoria','err');return;}
  DB.sCands(DB.cands().filter(function(x){return x.id!==c.id;}).concat([c]));
  closeM();toast('Candidato guardado','ok');pgCands();
}
function delCand(id){if(!confirm('Eliminar candidato?'))return;DB.sCands(DB.cands().filter(function(x){return x.id!==id;}));pgCands();}
function verCand(id){
  var c=DB.cands().find(function(x){return x.id===id;});if(!c)return;
  var conv=DB.convs().find(function(x){return x.id===c.convocatoriaId;});
  var edu=(c.educacion&&c.educacion.length)?c.educacion.map(function(e){return'<div>'+e.nivel+': <strong>'+(e.titulo||'-')+'</strong> - '+(e.institucion||'-')+'</div>';}).join(''):'<em class="tgr">Sin registros</em>';
  var exp=(c.experiencia&&c.experiencia.length)?c.experiencia.map(function(e){return'<div class="mb2"><strong>'+(e.cargo||'-')+'</strong> en '+(e.empresa||'-')+'<br><span class="tgr txs">'+(e.area||'')+' | '+(e.inicio||'-')+' → '+(e.fin||'Actual')+'</span></div>';}).join(''):'<em class="tgr">Sin registros</em>';
  openM(c.apellidos+', '+c.nombres,
    '<div class="flex g2 mb3">'+fBdg(c.fuente)+'<span class="bdg '+(EB[c.etapa]||'b-gr')+'">'+(EL[c.etapa]||c.etapa)+'</span>'+(c.puntajeTotal!=null?'<span class="bdg '+sCls(c.puntajeTotal)+'">'+c.puntajeTotal+'%</span>':'')+'</div>'
    +'<div class="fr fr2 mb3"><div><div class="txs tgr">Convocatoria</div><strong>'+(conv?conv.titulo:'-')+'</strong></div><div><div class="txs tgr">Ciudad</div><strong>'+(c.ciudad||'-')+'</strong></div></div>'
    +'<div class="div"></div><strong>Formacion</strong><div class="mt2">'+edu+'</div>'
    +'<div class="div"></div><strong>Experiencia</strong><div class="mt2">'+exp+'</div>'
    +(c.notaDirector?'<div class="div"></div><div style="background:#fefce8;border:1px solid #fcd34d;padding:10px;border-radius:6px"><strong>Nota Director:</strong> '+c.notaDirector+'</div>':''),
    '<button class="btn bo" onclick="closeM()">Cerrar</button><button class="btn bp" onclick="closeM();modalCand(\''+id+'\')">Editar</button>');
}
