// ══════════════════════════════════════════════════════
// UTILS.JS — Utilidades compartidas, modal, navegación, chips
// ══════════════════════════════════════════════════════

// ── TOAST ───────────────────────────────────────────
function toast(msg,type,ms){
  ms=ms||3000;
  var d=document.createElement('div');
  d.className='tn'+(type?' tn-'+type:'');
  d.textContent=msg;
  document.getElementById('tw').appendChild(d);
  setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},ms);
}

// ── CONFIG ──────────────────────────────────────────
function getCfg(){try{return JSON.parse(localStorage.getItem('rrhh_cfg')||'{}')}catch(e){return{};}}
function saveCfg(c){localStorage.setItem('rrhh_cfg',JSON.stringify(c));updateLogo();}

// ── UTILS GENÉRICOS ─────────────────────────────────
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function today(){return new Date().toISOString().split('T')[0];}
function fmtD(d){if(!d)return'-';try{return new Date(d+'T12:00:00').toLocaleDateString('es',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d;}}
function fmtM(n){return(n!=null&&n!=='')? '$'+Number(n).toLocaleString():'--';}
function sCol(s){return s>=75?'var(--g)':s>=50?'var(--w)':'var(--r)';}
function sCls(s){return s>=75?'b-gn':s>=50?'b-yw':'b-rd';}
function semCls(s){return s>=75?'sg2':s>=50?'sy2':'sr2';}

// ── CONSTANTES DE ETAPAS ────────────────────────────
var EL={postulado:'Postulado',preseleccionado:'Preseleccionado',descartado_pre:'Descartado',
  en_seleccion:'En Seleccion',descartado_sel:'Desc.Sel.',en_entrevista:'En Entrevista',
  finalista:'Finalista',seleccionado:'Seleccionado',reserva:'Reserva',descartado_final:'Desc.Final'};
var EB={postulado:'b-gr',preseleccionado:'b-bl',descartado_pre:'b-rd',en_seleccion:'b-cy',
  descartado_sel:'b-rd',en_entrevista:'b-pu',finalista:'b-yw',seleccionado:'b-gn',
  reserva:'b-bl',descartado_final:'b-rd'};

// ── BADGES ──────────────────────────────────────────
function eBdg(e){var m={activa:'b-gn',cerrada:'b-gr',pausada:'b-yw'};var l={activa:'Activa',cerrada:'Cerrada',pausada:'Pausada'};return'<span class="bdg '+(m[e]||'b-gr')+'">'+(l[e]||e)+'</span>';}
function fBdg(f){var m={correo:'b-cy',referido:'b-pu',otro:'b-gr'};var l={correo:'Correo',referido:'Referido',otro:'Otro'};return'<span class="bdg '+(m[f]||'b-gr')+'">'+(l[f]||f||'-')+'</span>';}

// ── MODAL ───────────────────────────────────────────
function openM(title,body,footer,lg){
  document.getElementById('mt2').textContent=title;
  document.getElementById('mbody').innerHTML=body||'';
  document.getElementById('mf').innerHTML=footer||'';
  document.getElementById('mb').className='mb'+(lg?' lg':'');
  document.getElementById('mo').classList.add('open');
}
function closeM(){document.getElementById('mo').classList.remove('open');}
function closeMO(e){if(e.target===document.getElementById('mo'))closeM();}

// ── NAVEGACIÓN ──────────────────────────────────────
var curPage='home';
var TITLES={home:'Dashboard',cfg:'Empresa y GitHub',perfiles:'Perfiles de Cargo',
  convs:'Convocatorias',cands:'Candidatos',presel:'Preseleccion',
  selec:'Seleccion',entrev:'Entrevistas',informe:'Informe Final'};

function go(page){
  curPage=page;
  document.querySelectorAll('.ni').forEach(function(el){el.classList.toggle('active',el.dataset.p===page);});
  document.getElementById('pt').textContent=TITLES[page]||page;
  document.getElementById('tb-act').innerHTML='';
  var fns={home:pgHome,cfg:pgCfg,perfiles:pgPerfiles,convs:pgConvs,
    cands:pgCands,presel:pgPresel,selec:pgSelec,entrev:pgEntrev,informe:pgInforme};
  if(fns[page]){
    try{fns[page]();}
    catch(err){document.getElementById('ct').innerHTML='<div style="padding:20px;color:red"><b>Error en '+page+':</b> '+err.message+'<br><small>'+err.stack+'</small></div>';}
  }
  closeSB();
}
function toggleSB(){document.getElementById('sb').classList.toggle('open');document.getElementById('ovl').classList.toggle('show');}
function closeSB(){document.getElementById('sb').classList.remove('open');document.getElementById('ovl').classList.remove('show');}
function updateLogo(){var c=getCfg();var e=document.getElementById('sb-emp');var r=document.getElementById('sb-ruc');if(e&&c.empresa)e.textContent='👥 '+c.empresa;if(r&&c.ruc)r.textContent='RUC: '+c.ruc;}

// ── CHIPS ────────────────────────────────────────────
function gChips(hid){
  var el=document.getElementById(hid);
  if(!el){var all=document.querySelectorAll('input[type=hidden]');for(var i=0;i<all.length;i++){if(all[i].id===hid){el=all[i];break;}}}
  try{return el?JSON.parse(el.value||'[]'):[];}catch(e){return[];}
}
function buildCC(cid,hid,arr){
  var c=document.getElementById(cid);if(!c)return;
  c.innerHTML='';
  var h=document.createElement('input');h.type='hidden';h.id=hid;h.value=JSON.stringify(arr);c.appendChild(h);
  arr.forEach(function(v){
    var sp=document.createElement('span');sp.className='chip';
    var txt=document.createTextNode(v+' ');sp.appendChild(txt);
    var btn=document.createElement('button');btn.type='button';btn.className='chip-x';btn.innerHTML='&times;';
    btn.addEventListener('click',function(e){e.stopPropagation();buildCC(cid,hid,gChips(hid).filter(function(x){return x!==v;}));});
    sp.appendChild(btn);c.appendChild(sp);
  });
  var inp=document.createElement('input');inp.type='text';inp.className='ci';inp.placeholder='Escribe y Enter...';
  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===','){
      e.preventDefault();
      var v=this.value.trim().replace(/,$/,'');
      if(v){var cur=gChips(hid);if(cur.indexOf(v)<0){cur.push(v);buildCC(cid,hid,cur);}this.value='';}
    }
  });
  c.appendChild(inp);
  c.addEventListener('click',function(){inp.focus();});
}
function updChips(cid,hid,arr){buildCC(cid,hid,arr);}
function initCC(cid,hid,arr){buildCC(cid,hid,arr);}
function rmChip(cid,hid,val){buildCC(cid,hid,gChips(hid).filter(function(v){return v!==val;}));}
function mkCC(cid,hid,arr){
  var c=document.getElementById(cid);
  if(c){buildCC(cid,hid,arr||[]);}
  else{setTimeout(function(){mkCC(cid,hid,arr);},60);}
}

// ── TAB SWITCHER ─────────────────────────────────────
function swTab(pfx,n){
  for(var i=0;i<8;i++){
    var t=document.getElementById(pfx+'t'+i);
    var p=document.getElementById(pfx+'p'+i);
    if(t)t.classList.toggle('on',i===n);
    if(p)p.classList.toggle('dn',i!==n);
  }
}

// ── COMPETENCIAS HELPERS ─────────────────────────────
var _compIdx=100;
function compRow(i,nombre,peso){
  var d=document.createElement('div');
  d.className='comp-row fr fr2';d.style.cssText='align-items:center;margin-bottom:10px';
  var inp=document.createElement('input');inp.className='comp-n';inp.value=nombre||'';inp.placeholder='Nombre de la competencia';inp.addEventListener('input',updCompTotal);
  var rw=document.createElement('div');rw.className='rw';rw.style.flex='1';
  var range=document.createElement('input');range.type='range';range.className='comp-p';range.min=0;range.max=100;range.value=peso||25;
  var span=document.createElement('span');span.className='rv';span.textContent=(peso||25)+'%';
  range.addEventListener('input',function(){span.textContent=this.value+'%';updCompTotal();});
  var btn=document.createElement('button');btn.type='button';btn.className='btn br bxs';btn.title='Eliminar';btn.innerHTML='&#10005;';
  btn.addEventListener('click',function(){d.parentNode&&d.parentNode.removeChild(d);updCompTotal();});
  rw.appendChild(range);rw.appendChild(span);rw.appendChild(btn);
  d.appendChild(inp);d.appendChild(rw);
  return d;
}
function addComp(){
  _compIdx++;
  var list=document.getElementById('comp_list');
  if(!list)return;
  list.appendChild(compRow(_compIdx,'',25));
  updCompTotal();
}
function updCompTotal(){
  var total=0;
  document.querySelectorAll('.comp-p').forEach(function(p){total+=parseInt(p.value||0);});
  var el=document.getElementById('comp_total');
  if(el){el.textContent='Total: '+total+'%';el.style.color=total===100?'var(--g)':'var(--r)';}
}

// ── SCORING ──────────────────────────────────────────
function calcPre(cand,perf){
  if(!perf)return 0;
  var score=0,max=0;
  var niv=['Bachillerato','Tecnico','Tecnologo','Tercer Nivel','Cuarto Nivel'];
  var reqN=niv.indexOf(perf.eduNiv||'Bachillerato');
  var candNs=(cand.educacion||[]).map(function(e){return Math.max(0,niv.indexOf(e.nivel));});
  var candN=candNs.length?Math.max.apply(null,candNs):-1;
  max+=25;if(candN>=reqN)score+=25;else if(candN===reqN-1)score+=15;
  max+=25;
  var reqA=perf.expAnios||0;
  if(reqA===0){score+=25;}else{
    var meses=(cand.experiencia||[]).reduce(function(s,e){
      if(!e.inicio)return s;
      var i=new Date(e.inicio+'-01'),f=e.fin?new Date(e.fin+'-01'):new Date();
      return s+Math.max(0,(f-i)/(1000*60*60*24*30));
    },0);
    var anos=meses/12;
    if(anos>=reqA)score+=25;else if(anos>=reqA*.7)score+=15;else if(anos>0)score+=8;
  }
  max+=25;
  var rH=(perf.habilidades||[]).map(function(h){return h.toLowerCase();});
  var cH=(cand.habilidades||[]).map(function(h){return h.toLowerCase();});
  if(!rH.length)score+=25;else{var m=rH.filter(function(h){return cH.some(function(c){return c.indexOf(h)>=0||h.indexOf(c)>=0;});}).length;score+=Math.round(m/rH.length*25);}
  max+=15;
  var rS=(perf.software||[]).map(function(s){return s.toLowerCase();});
  var cS=[].concat(cand.habilidades||[]).concat(cand.idiomas||[]).map(function(x){return x.toLowerCase();});
  if(!rS.length)score+=15;else{var ms=rS.filter(function(s){return cS.some(function(c){return c.indexOf(s)>=0||s.indexOf(c)>=0;});}).length;score+=Math.round(ms/rS.length*15);}
  max+=10;
  var rI=(perf.idiomas||['Espanol']).map(function(i){return i.toLowerCase();});
  var cI=(cand.idiomas||[]).map(function(i){return i.toLowerCase();});
  var mI=rI.filter(function(i){return cI.some(function(c){return c.indexOf(i)>=0||i.indexOf(c)>=0;});}).length;
  score+=Math.round(mI/Math.max(1,rI.length)*10);
  return Math.round(score/max*100);
}
function calcTot(c){
  var p=c.puntajePreseleccion,s=c.puntajeSeleccion,e=c.puntajeEntrevista;
  if(p==null)return null;
  if(s==null&&e==null)return p;
  if(e==null)return Math.round(p*.5+s*.5);
  return Math.round(p*.3+s*.3+e*.4);
}

// ── WHATSAPP ─────────────────────────────────────────
function whatsappCand(candId){
  var c=DB.cands().find(function(x){return x.id===candId;});if(!c)return;
  var conv=DB.convs().find(function(x){return x.id===c.convocatoriaId;});
  var tel=(c.telefono||'').replace(/[^0-9]/g,'');
  if(!tel){toast('Sin telefono registrado','err');return;}
  openM('Invitacion WhatsApp',
    '<div class="al al-i">WhatsApp se abrira con el mensaje listo.</div>'
    +'<div class="fg"><label>Candidato</label><input disabled value="'+c.nombres+' '+c.apellidos+'"></div>'
    +'<div class="fr fr2"><div class="fg"><label>Fecha</label><input type="date" id="wa_f" value="'+today()+'"></div>'
    +'<div class="fg"><label>Hora</label><input type="time" id="wa_h" value="09:00"></div></div>'
    +'<div class="fg"><label>Lugar</label><input id="wa_l" value="Nuestras oficinas"></div>'
    +'<div class="fg"><label>Mensaje</label><textarea id="wa_msg" rows="8" style="font-size:11px;background:var(--g50)"></textarea></div>',
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bg" id="wa_btn_ok">📱 Abrir WhatsApp</button>');
  setTimeout(function(){
    buildWAMsg(c,conv);
    ['wa_f','wa_h','wa_l'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('input',function(){buildWAMsg(c,conv);});});
    var btn=document.getElementById('wa_btn_ok');
    if(btn)btn.addEventListener('click',function(){doWA(tel);});
  },60);
}
function buildWAMsg(c,conv){
  var f=document.getElementById('wa_f'),h=document.getElementById('wa_h'),l=document.getElementById('wa_l');
  var cfg=getCfg();
  var fd=f&&f.value?new Date(f.value+'T12:00:00').toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'-';
  var lines=[
    'Estimado/a '+c.nombres+' '+c.apellidos+',','',
    'Le informamos que ha clasificado para el proceso de: *'+(conv?conv.titulo:'la vacante')+'*'+(cfg.empresa?' en '+cfg.empresa:'')+'.',
    '','Su entrevista esta programada:',
    'Fecha: '+fd,'Hora: '+(h?h.value:'-'),'Lugar: '+(l?l.value:'-'),'',
    'Por favor responda confirmando con: *SI CONFIRMO* o *NO PODRE ASISTIR*.',
    '','Traer hoja de vida impresa y cedula.','',
    'Saludos,',(cfg.dirRRHH||'RRHH')+(cfg.empresa?' - '+cfg.empresa:'')
  ];
  var el=document.getElementById('wa_msg');if(el)el.value=lines.join('\n');
}
function doWA(tel){
  var el=document.getElementById('wa_msg');if(!el)return;
  var num=tel.replace(/^0/,'');
  var url='https://wa.me/593'+num+'?text='+encodeURIComponent(el.value);
  window.open(url,'_blank');closeM();toast('WhatsApp abierto','ok');
}

// ── ETAPAS COMPARTIDAS ───────────────────────────────
var EPREV={preseleccionado:'postulado',descartado_pre:'postulado',en_seleccion:'preseleccionado',
  descartado_sel:'en_seleccion',en_entrevista:'en_seleccion',finalista:'en_entrevista',
  reserva:'en_entrevista',seleccionado:'finalista',descartado_final:'en_entrevista'};

function moverC(id,etapa,nota){
  var all=DB.cands();var idx=-1;
  all.forEach(function(c,i){if(c.id===id)idx=i;});
  if(idx<0)return;
  all[idx].etapa=etapa;if(nota!=null)all[idx].notaDirector=nota;
  all[idx].puntajeTotal=calcTot(all[idx]);
  DB.sCands(all);
  if(curPage==='presel')pgPresel();else if(curPage==='selec')pgSelec();else if(curPage==='entrev')pgEntrev();
}
function overrideD(id){
  var c=DB.cands().find(function(x){return x.id===id;});if(!c)return;
  openM('Decision del Director',
    '<div class="al al-w">Tu decision sobreescribe el puntaje automatico. Debe quedar justificada.</div>'
    +'<div class="fg"><label>Candidato</label><input disabled value="'+c.apellidos+', '+c.nombres+'"></div>'
    +'<div class="fg"><label>Mover a</label><select id="ov_e"><option value="preseleccionado">Preseleccionado</option><option value="descartado_pre">Descartado</option><option value="en_seleccion">Seleccion directa</option></select></div>'
    +'<div class="fg"><label>Justificacion <span class="rq">*</span></label><textarea id="ov_n" rows="3">'+(c.notaDirector||'')+'</textarea></div>',
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bw" onclick="applyOv(\''+id+'\')">Aplicar</button>');
}
function applyOv(id){
  var etapa=document.getElementById('ov_e')&&document.getElementById('ov_e').value;
  var nota=document.getElementById('ov_n')&&document.getElementById('ov_n').value.trim();
  if(!nota){toast('La justificacion es requerida','err');return;}
  var all=DB.cands();var idx=-1;
  all.forEach(function(c,i){if(c.id===id)idx=i;});
  if(idx<0)return;
  all[idx].etapa=etapa;all[idx].notaDirector=nota;all[idx].decisionDirector=true;
  DB.sCands(all);closeM();toast('Decision aplicada','ok');
  if(curPage==='presel')pgPresel();else if(curPage==='selec')pgSelec();
}
function regresarEtapa(candId){
  var all=DB.cands();var idx=-1;
  all.forEach(function(c,i){if(c.id===candId)idx=i;});
  if(idx<0)return;
  var prev=EPREV[all[idx].etapa];
  if(!prev){toast('No hay etapa anterior','err');return;}
  if(!confirm('Regresar a: '+EL[prev]+'?'))return;
  all[idx].etapa=prev;all[idx].puntajeTotal=calcTot(all[idx]);
  DB.sCands(all);toast('Regresado a '+EL[prev],'ok');
  if(curPage==='presel')pgPresel();
  else if(curPage==='selec')pgSelec();
  else if(curPage==='entrev')pgEntrev();
  else if(curPage==='informe')pgInforme();
}
