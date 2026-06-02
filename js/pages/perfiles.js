// ══════════════════════════════════════════════════════
// PERFILES.JS — Perfiles de cargo y Manual de Funciones
// ══════════════════════════════════════════════════════
function pgPerfiles(){
  var perfs=DB.perfiles();
  document.getElementById('tb-act').innerHTML='<button class="btn bp bs" onclick="modalPerfil()">+ Nuevo</button>';
  if(!perfs.length){
    document.getElementById('ct').innerHTML='<div class="es"><div class="es-ico">📋</div><h3>Sin perfiles</h3><p>Los perfiles son reutilizables en multiples convocatorias.</p><button class="btn bp" onclick="modalPerfil()">+ Crear</button></div>';
    return;
  }
  var html='';
  perfs.forEach(function(p){
    var nc=DB.convs().filter(function(c){return c.perfilId===p.id;}).length;
    html+='<div class="card"><div class="cb">'
      +'<div class="flex jb ic" style="flex-wrap:wrap;gap:8px"><div>'
      +'<div class="flex ic g2 mb2"><strong style="font-size:15px">'+p.nombre+'</strong>'
      +'<span class="bdg b-bl">'+(p.nivel||'-')+'</span><span class="bdg b-gr">'+(p.modalidad||'')+'</span></div>'
      +'<div class="tsm tgr">'+(p.area||'-')+' | '+fmtM(p.salMin)+' - '+fmtM(p.salMax)+' | '+nc+' conv.</div>'
      +'</div><div class="flex g2">'
      +'<button class="btn bo bxs" onclick="modalPerfil(\''+p.id+'\')">✏️ Editar</button>'
      +'<button class="btn bo bxs" onclick="clonarP(\''+p.id+'\')">Clonar</button>'
      +'<button class="btn bo bxs" onclick="pdfManual(\''+p.id+'\')">PDF</button>'
      +'<button class="btn bo bxs" onclick="delP(\''+p.id+'\')">🗑️</button>'
      +'</div></div>'
      +(p.funciones&&p.funciones.length?'<div class="mt2 tsm tgr">'+p.funciones.slice(0,3).join(' | ')+(p.funciones.length>3?' ...':'')+'</div>':'')
      +'</div></div>';
  });
  document.getElementById('ct').innerHTML=html;
}

function modalPerfil(id){
  var p=id?DB.perfiles().find(function(x){return x.id===id;}):null;
  var v=p||{nombre:'',area:'',nivel:'Operativo',salMin:'',salMax:'',modalidad:'Presencial',
    jornada:'Tiempo completo',desc:'',eduNiv:'Tercer Nivel',eduCam:'',expAnios:0,
    expArea:'',funciones:[],habilidades:[],idiomas:['Espanol'],software:[],
    competencias:[{nombre:'Orientacion al logro',peso:25},{nombre:'Trabajo en equipo',peso:25},{nombre:'Comunicacion',peso:25},{nombre:'Proactividad',peso:25}]};
  var nivs=['Bachillerato','Tecnico','Tecnologo','Tercer Nivel','Cuarto Nivel'];
  var _initComps=v.competencias&&v.competencias.length?v.competencias:[{nombre:'Orientacion al logro',peso:25},{nombre:'Trabajo en equipo',peso:25},{nombre:'Comunicacion',peso:25},{nombre:'Proactividad',peso:25}];
  var compH='<div id="comp_list"></div><button class="btn bo bs mt2" onclick="addComp()" type="button">+ Agregar Competencia</button><div class="mt2 tsm tgr" id="comp_total">Calculando...</div>';
  var body='<div class="tabs"><div class="tab on" id="pft0" onclick="swTab(\'pf\',0)">General</div><div class="tab" id="pft1" onclick="swTab(\'pf\',1)">Requisitos</div><div class="tab" id="pft2" onclick="swTab(\'pf\',2)">Competencias</div></div>'
    +'<div id="pfp0">'
    +'<div class="fr fr2"><div class="fg"><label>Cargo <span class="rq">*</span></label><input id="pf_n" value="'+v.nombre+'"></div>'
    +'<div class="fg"><label>Area</label><input id="pf_a" value="'+v.area+'"></div></div>'
    +'<div class="fr fr3">'
    +'<div class="fg"><label>Nivel</label><select id="pf_nv"><option '+(v.nivel==='Directivo'?'selected':'')+'>Directivo</option><option '+(v.nivel==='Jefatura'?'selected':'')+'>Jefatura</option><option '+(v.nivel==='Tecnico'?'selected':'')+'>Tecnico</option><option '+(v.nivel==='Operativo'?'selected':'')+'>Operativo</option><option '+(v.nivel==='Auxiliar'?'selected':'')+'>Auxiliar</option></select></div>'
    +'<div class="fg"><label>Salario Min $</label><input id="pf_sm" type="number" value="'+v.salMin+'"></div>'
    +'<div class="fg"><label>Salario Max $</label><input id="pf_sx" type="number" value="'+v.salMax+'"></div></div>'
    +'<div class="fr fr2">'
    +'<div class="fg"><label>Modalidad</label><select id="pf_mo"><option '+(v.modalidad==='Presencial'?'selected':'')+'>Presencial</option><option '+(v.modalidad==='Remoto'?'selected':'')+'>Remoto</option><option '+(v.modalidad==='Hibrido'?'selected':'')+'>Hibrido</option></select></div>'
    +'<div class="fg"><label>Jornada</label><select id="pf_jo"><option '+(v.jornada==='Tiempo completo'?'selected':'')+'>Tiempo completo</option><option '+(v.jornada==='Medio tiempo'?'selected':'')+'>Medio tiempo</option></select></div></div>'
    +'<div class="fg"><label>Descripcion</label><textarea id="pf_de" rows="3">'+v.desc+'</textarea></div>'
    +'<div class="fg"><label>Funciones (Enter para agregar)</label><div class="cc" id="fn_cc"><input type="hidden" id="fn_h"></div></div>'
    +'</div>'
    +'<div id="pfp1" class="dn">'
    +'<div class="fr fr2"><div class="fg"><label>Nivel Educativo</label><select id="pf_en">'
    +nivs.map(function(n){return'<option '+(v.eduNiv===n?'selected':'')+'>'+n+'</option>';}).join('')
    +'</select></div><div class="fg"><label>Carrera</label><input id="pf_ec" value="'+(v.eduCam||'')+'"></div></div>'
    +'<div class="fr fr2"><div class="fg"><label>Experiencia (anos)</label><input id="pf_ea" type="number" min="0" value="'+(v.expAnios||0)+'"></div>'
    +'<div class="fg"><label>Area Experiencia</label><input id="pf_er" value="'+(v.expArea||'')+'"></div></div>'
    +'<div class="fg"><label>Habilidades</label><div class="cc" id="ha_cc"><input type="hidden" id="ha_h"></div></div>'
    +'<div class="fg"><label>Idiomas</label><div class="cc" id="id_cc"><input type="hidden" id="id_h"></div></div>'
    +'<div class="fg"><label>Software</label><div class="cc" id="so_cc"><input type="hidden" id="so_h"></div></div>'
    +'</div>'
    +'<div id="pfp2" class="dn"><div class="al al-i">Agrega las competencias que necesites. Suma de pesos debe ser 100%.</div>'+compH+'</div>';

  openM(id?'Editar Perfil':'Nuevo Perfil',body,
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bp" onclick="saveP(\''+(id||'')+'\')">Guardar</button>',true);

  setTimeout(function(){
    mkCC('fn_cc','fn_h',v.funciones||[]);
    mkCC('ha_cc','ha_h',v.habilidades||[]);
    mkCC('id_cc','id_h',v.idiomas||['Espanol']);
    mkCC('so_cc','so_h',v.software||[]);
    var list=document.getElementById('comp_list');
    if(list){_initComps.forEach(function(co,i){list.appendChild(compRow(i,co.nombre,co.peso));});updCompTotal();}
  },60);
}

function saveP(id){
  function g(i){var e=document.getElementById(i);return e?e.value:'';}
  var comps=[];
  document.querySelectorAll('.comp-row').forEach(function(row){
    var n=row.querySelector('.comp-n');var pp=row.querySelector('.comp-p');
    if(n&&n.value.trim())comps.push({nombre:n.value.trim(),peso:parseInt(pp&&pp.value||0)});
  });
  var p={id:id||uid(),nombre:g('pf_n').trim(),area:g('pf_a').trim(),nivel:g('pf_nv'),
    salMin:g('pf_sm'),salMax:g('pf_sx'),modalidad:g('pf_mo'),jornada:g('pf_jo'),
    desc:g('pf_de').trim(),eduNiv:g('pf_en'),eduCam:g('pf_ec').trim(),
    expAnios:parseInt(g('pf_ea')||0),expArea:g('pf_er').trim(),
    funciones:gChips('fn_h'),habilidades:gChips('ha_h'),idiomas:gChips('id_h'),software:gChips('so_h'),
    competencias:comps,upd:today(),cre:id?(DB.perfiles().find(function(x){return x.id===id;})||{}).cre||today():today()};
  if(!p.nombre){toast('El nombre es requerido','err');return;}
  DB.sPerfiles(DB.perfiles().filter(function(x){return x.id!==p.id;}).concat([p]));
  closeM();toast('Perfil guardado','ok');pgPerfiles();
}
function clonarP(id){var p=DB.perfiles().find(function(x){return x.id===id;});if(!p)return;DB.sPerfiles(DB.perfiles().concat([Object.assign({},p,{id:uid(),nombre:p.nombre+' (Copia)',cre:today()})]));toast('Clonado','ok');pgPerfiles();}
function delP(id){if(!confirm('Eliminar perfil?'))return;DB.sPerfiles(DB.perfiles().filter(function(x){return x.id!==id;}));pgPerfiles();}

function pdfManual(perfilId,candId){
  var p=DB.perfiles().find(function(x){return x.id===perfilId;});if(!p){toast('Perfil no encontrado','err');return;}
  var cfg=getCfg();
  var cand=candId?DB.cands().find(function(x){return x.id===candId;}):null;
  var emp=cfg.empresa||'[EMPRESA]',ruc=cfg.ruc||'',dir=cfg.direccion||'',ciu=cfg.ciudad||'';
  var dRRHH=cfg.dirRRHH||'______________________________';
  var repLeg=cfg.repLegal||'______________________________';
  var cNom=cand?(cand.nombres+' '+cand.apellidos):'______________________________';
  var cCed=cand?(cand.cedula||'-'):'-';
  var fecha=new Date().toLocaleDateString('es',{day:'2-digit',month:'long',year:'numeric'});
  var funH=(p.funciones||[]).map(function(f,i){return'<tr><td style="width:36px;text-align:center;color:#555">'+(i+1)+'</td><td>'+f+'</td></tr>';}).join('');
  var compH=(p.competencias||[]).filter(function(c){return c.nombre;}).map(function(c){return'<tr><td>'+c.nombre+'</td><td style="text-align:center">'+c.peso+'%</td></tr>';}).join('');
  var habH=[].concat(p.habilidades||[]).concat(p.idiomas||[]).concat(p.software||[]).map(function(h){return'<span style="display:inline-block;background:#eff6ff;color:#1e40af;padding:2px 8px;border-radius:10px;font-size:11px;margin:2px">'+h+'</span>';}).join('');
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Manual de Funciones</title>'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#222;padding:0}'
    +'.page{width:21cm;min-height:29.7cm;margin:0 auto;padding:1.8cm 2cm;display:flex;flex-direction:column}'
    +'.hdr{border-bottom:3px solid #1e40af;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}'
    +'.hdr-l{font-size:17px;font-weight:700;color:#1e40af}.hdr-sub{font-size:11px;color:#555;margin-top:3px}'
    +'.hdr-r{text-align:right}.doc-t{font-size:15px;font-weight:700;color:#1e293b}'
    +'.cargo-bdg{display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:4px 12px;border-radius:4px;font-weight:700;font-size:13px;margin-top:5px}'
    +'.sec{font-size:13px;font-weight:700;color:#1e40af;border-bottom:1px solid #bfdbfe;padding-bottom:4px;margin:16px 0 10px}'
    +'.info-t{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px}'
    +'.info-t td{padding:6px 10px;border:1px solid #e2e8f0;vertical-align:top}'
    +'.info-t td:first-child{background:#f8fafc;font-weight:600;width:34%;color:#334155}'
    +'.lst-t{width:100%;border-collapse:collapse;font-size:12px}'
    +'.lst-t th{background:#f1f5f9;padding:6px 10px;text-align:left;font-size:11px;font-weight:700;border:1px solid #e2e8f0;color:#475569}'
    +'.lst-t td{padding:7px 10px;border:1px solid #e2e8f0}'
    +'.lst-t tr:nth-child(even) td{background:#f8fafc}'
    +'.firmas{margin-top:auto;padding-top:24px;border-top:1px solid #e2e8f0}'
    +'.fgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:36px;margin-top:18px}'
    +'.fbox{text-align:center}.fline{border-bottom:1px solid #334155;height:48px;margin-bottom:8px}'
    +'.fnm{font-weight:700;font-size:12px}.frol{font-size:10px;color:#64748b;margin-top:2px}'
    +'.footer{margin-top:18px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;padding-top:7px}'
    +'@media print{body{padding:0}.page{margin:0;padding:1.5cm 1.8cm}}'
    +'</style></head><body>'
    +'<div class="page">'
    +'<div class="hdr"><div><div class="hdr-l">'+emp+'</div><div class="hdr-sub">'+(ruc?'RUC: '+ruc:'')+(dir?' | '+dir:'')+'</div></div>'
    +'<div class="hdr-r"><div class="doc-t">MANUAL DE FUNCIONES</div>'
    +'<div style="font-size:11px;color:#888">'+fecha+(ciu?' | '+ciu:'')+'</div>'
    +'<div class="cargo-bdg">'+p.nombre+'</div></div></div>'
    +'<div class="sec">1. IDENTIFICACION DEL CARGO</div>'
    +'<table class="info-t"><tr><td>Cargo</td><td><strong>'+p.nombre+'</strong></td></tr>'
    +'<tr><td>Area / Departamento</td><td>'+(p.area||'-')+'</td></tr>'
    +'<tr><td>Nivel Jerarquico</td><td>'+(p.nivel||'-')+'</td></tr>'
    +'<tr><td>Modalidad</td><td>'+(p.modalidad||'Presencial')+'</td></tr>'
    +'<tr><td>Jornada</td><td>'+(p.jornada||'Tiempo completo')+'</td></tr>'
    +'<tr><td>Remuneracion</td><td>'+fmtM(p.salMin)+(p.salMax?' - '+fmtM(p.salMax):'')+'</td></tr>'
    +(cand?'<tr><td>Colaborador</td><td><strong>'+cNom+'</strong> | C.I.: '+cCed+'</td></tr>':'')
    +'</table>'
    +(p.desc?'<div class="sec">2. OBJETIVO DEL CARGO</div><p style="font-size:12px;line-height:1.6;margin-bottom:14px">'+p.desc+'</p>':'')
    +'<div class="sec">'+(p.desc?'3':'2')+'. FUNCIONES PRINCIPALES</div>'
    +(funH?'<table class="lst-t"><thead><tr><th>#</th><th>Funcion / Actividad</th></tr></thead><tbody>'+funH+'</tbody></table>':'<p style="color:#888;font-style:italic">Sin funciones definidas.</p>')
    +'<div class="sec">'+(p.desc?'4':'3')+'. PERFIL Y REQUISITOS</div>'
    +'<table class="info-t"><tr><td>Nivel Educativo</td><td>'+(p.eduNiv||'-')+(p.eduCam?' en '+p.eduCam:'')+'</td></tr>'
    +'<tr><td>Experiencia</td><td>'+(p.expAnios||0)+' ano(s)'+(p.expArea?' en '+p.expArea:'')+'</td></tr>'
    +(habH?'<tr><td>Competencias y Habilidades</td><td>'+habH+'</td></tr>':'')+'</table>'
    +(compH?'<div class="sec">'+(p.desc?'5':'4')+'. COMPETENCIAS CLAVE</div><table class="lst-t"><thead><tr><th>Competencia</th><th style="width:80px;text-align:center">Peso %</th></tr></thead><tbody>'+compH+'</tbody></table>':'')
    +'<div class="firmas"><p style="font-size:11px;color:#475569;margin-bottom:10px">En aceptacion y conformidad con las funciones y condiciones del presente cargo, firman las partes:</p>'
    +'<div class="fgrid"><div class="fbox"><div class="fline"></div><div class="fnm">'+cNom+'</div><div class="frol">Colaborador / Trabajador</div></div>'
    +'<div class="fbox"><div class="fline"></div><div class="fnm">'+dRRHH+'</div><div class="frol">Director de RRHH</div></div>'
    +'<div class="fbox"><div class="fline"></div><div class="fnm">'+repLeg+'</div><div class="frol">Representante Legal</div></div>'
    +'</div></div>'
    +'<div class="footer">'+emp+(ruc?' | RUC '+ruc:'')+' | Generado: '+fecha+' | Confidencial</div>'
    +'</div><script>window.onload=function(){window.print();}<\/script></body></html>');
  win.document.close();
}
