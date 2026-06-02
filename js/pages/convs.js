// ══════════════════════════════════════════════════════
// CONVS.JS — Convocatorias
// ══════════════════════════════════════════════════════
function pgConvs(){
  var convs=DB.convs(),perfs=DB.perfiles();
  document.getElementById('tb-act').innerHTML='<button class="btn bp bs" onclick="modalConv()">+ Nueva</button>';
  if(!convs.length){
    document.getElementById('ct').innerHTML='<div class="es"><div class="es-ico">📢</div><h3>Sin convocatorias</h3>'+(perfs.length?'<button class="btn bp" onclick="modalConv()">+ Crear</button>':'<p>Primero crea un Perfil.</p><button class="btn bo" onclick="go(\'perfiles\')">Perfiles</button>')+'</div>';
    return;
  }
  var rows=convs.map(function(c){
    var p=perfs.find(function(x){return x.id===c.perfilId;});
    var n=DB.cands().filter(function(x){return x.convocatoriaId===c.id;}).length;
    return'<tr><td><strong>'+c.titulo+'</strong><br><span class="tgr txs">'+(p?p.area:'-')+' | '+c.vacantes+' vacante(s)</span></td>'
      +'<td>'+eBdg(c.estado)+'</td><td>'+fmtD(c.fAp)+'</td><td>'+fmtD(c.fCi)+'</td>'
      +'<td><span class="bdg b-bl">'+n+'</span></td>'
      +'<td><div class="flex g2">'
      +'<button class="btn bo bxs" onclick="modalConv(\''+c.id+'\')">✏️</button>'
      +'<button class="btn bo bxs" onclick="togConv(\''+c.id+'\')">'+(c.estado==='activa'?'⏸':'▶')+'</button>'
      +'<button class="btn bo bxs" onclick="delConv(\''+c.id+'\')">🗑️</button>'
      +'</div></td></tr>';
  }).join('');
  document.getElementById('ct').innerHTML='<div class="card"><div class="tw"><table><thead><tr><th>Cargo</th><th>Estado</th><th>Apertura</th><th>Cierre</th><th>Cands.</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function modalConv(id){
  var perfs=DB.perfiles();if(!perfs.length){toast('Crea un Perfil primero','w');return;}
  var c=id?DB.convs().find(function(x){return x.id===id;}):null;
  var v=c||{titulo:'',perfilId:'',vacantes:1,estado:'activa',fAp:today(),fCi:'',obs:''};
  var opts=perfs.map(function(p){return'<option value="'+p.id+'" '+(v.perfilId===p.id?'selected':'')+'>'+p.nombre+' ('+p.area+')</option>';}).join('');
  openM(id?'Editar Convocatoria':'Nueva Convocatoria',
    '<div class="fg"><label>Perfil Base <span class="rq">*</span></label><select id="cv_p"><option value="">-</option>'+opts+'</select></div>'
    +'<div class="fg"><label>Titulo <span class="rq">*</span></label><input id="cv_t" value="'+v.titulo+'"></div>'
    +'<div class="fr fr3"><div class="fg"><label>Vacantes</label><input id="cv_v" type="number" min="1" value="'+v.vacantes+'"></div>'
    +'<div class="fg"><label>Apertura</label><input id="cv_a" type="date" value="'+v.fAp+'"></div>'
    +'<div class="fg"><label>Cierre</label><input id="cv_c" type="date" value="'+(v.fCi||'')+'"></div></div>'
    +'<div class="fg"><label>Estado</label><select id="cv_e"><option value="activa" '+(v.estado==='activa'?'selected':'')+'>Activa</option><option value="pausada" '+(v.estado==='pausada'?'selected':'')+'>Pausada</option><option value="cerrada" '+(v.estado==='cerrada'?'selected':'')+'>Cerrada</option></select></div>'
    +'<div class="fg"><label>Observaciones</label><textarea id="cv_o" rows="2">'+(v.obs||'')+'</textarea></div>',
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bp" onclick="saveConv(\''+(id||'')+'\')">Guardar</button>');
  setTimeout(function(){
    var s=document.getElementById('cv_p'),t=document.getElementById('cv_t');
    if(s&&t)s.addEventListener('change',function(){var p=perfs.find(function(x){return x.id===this.value;},this);if(p&&!t.value)t.value=p.nombre;});
  },50);
}
function saveConv(id){
  function g(i){var e=document.getElementById(i);return e?e.value:'';}
  var c={id:id||uid(),titulo:g('cv_t').trim(),perfilId:g('cv_p'),vacantes:parseInt(g('cv_v')||1),
    estado:g('cv_e'),fAp:g('cv_a'),fCi:g('cv_c'),obs:g('cv_o').trim(),
    cre:id?(DB.convs().find(function(x){return x.id===id;})||{}).cre||today():today()};
  if(!c.titulo){toast('El titulo es requerido','err');return;}
  if(!c.perfilId){toast('Selecciona un perfil','err');return;}
  DB.sConvs(DB.convs().filter(function(x){return x.id!==c.id;}).concat([c]));
  closeM();toast('Convocatoria guardada','ok');pgConvs();
}
function togConv(id){var all=DB.convs();var c=all.find(function(x){return x.id===id;});if(!c)return;c.estado=c.estado==='activa'?'pausada':'activa';DB.sConvs(all);pgConvs();}
function delConv(id){if(!confirm('Eliminar convocatoria?'))return;DB.sConvs(DB.convs().filter(function(x){return x.id!==id;}));pgConvs();}
