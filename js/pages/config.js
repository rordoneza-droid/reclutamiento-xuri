// ══════════════════════════════════════════════════════
// CONFIG.JS — Configuración de empresa y GitHub
// ══════════════════════════════════════════════════════
function pgCfg(){
  var c=getCfg();
  document.getElementById('ct').innerHTML=
    '<div class="tabs"><div class="tab on" id="ct0" onclick="swTab(\'c\',0)">Empresa</div>'
    +'<div class="tab" id="ct1" onclick="swTab(\'c\',1)">GitHub Sync</div>'
    +'<div class="tab" id="ct2" onclick="swTab(\'c\',2)">Backup</div>'
    +'<div class="tab" id="ct3" onclick="swTab(\'c\',3)">🗑️ Limpiar Datos</div></div>'
    +'<div id="cp0"><div class="card"><div class="cb">'
    +'<div class="fr fr2"><div class="fg"><label>Empresa</label><input id="cf_emp" value="'+(c.empresa||'')+'"></div>'
    +'<div class="fg"><label>RUC</label><input id="cf_ruc" value="'+(c.ruc||'')+'"></div></div>'
    +'<div class="fr fr2"><div class="fg"><label>Direccion</label><input id="cf_dir" value="'+(c.direccion||'')+'"></div>'
    +'<div class="fg"><label>Ciudad</label><input id="cf_ciu" value="'+(c.ciudad||'')+'"></div></div>'
    +'<div class="fr fr2"><div class="fg"><label>Director RRHH</label><input id="cf_drrhh" value="'+(c.dirRRHH||'')+'"></div>'
    +'<div class="fg"><label>Representante Legal</label><input id="cf_rep" value="'+(c.repLegal||'')+'"></div></div>'
    +'<button class="btn bp" onclick="saveCfgEmp()">Guardar Empresa</button>'
    +'</div></div></div>'
    +'<div id="cp1" class="dn"><div class="al al-i">GitHub actua como base de datos en la nube. Cada guardado se sincroniza automaticamente.</div>'
    +'<div class="card"><div class="cb">'
    +'<div class="fg"><label>Usuario GitHub</label><input id="cf_own" value="'+(c.own||'')+'"></div>'
    +'<div class="fg"><label>Repositorio</label><input id="cf_repo" value="'+(c.repo||'')+'"></div>'
    +'<div class="fg"><label>Token (scope: repo)</label><input id="cf_tok" type="password" value="'+(c.tok||'')+'"></div>'
    +'<div class="flex g2 mt3">'
    +'<button class="btn bp" onclick="saveCfgGH()">Guardar</button>'
    +'<button class="btn bo" onclick="testConn()">Probar</button>'
    +'<button class="btn bo" onclick="syncNow()">Sincronizar</button>'
    +'</div></div></div></div>'
    +'<div id="cp2" class="dn"><div class="card"><div class="cb">'
    +'<p class="tgr tsm mb3">Exporta todos los datos como archivo JSON para respaldo.</p>'
    +'<div class="flex g3"><button class="btn bp" onclick="exportBk()">Descargar Backup</button>'
    +'<button class="btn bo" onclick="importBk()">Restaurar</button>'
    +'</div></div></div></div>'
    +'<div id="cp3" class="dn">'
    +'<div class="al al-w">⚠️ Estas acciones eliminan datos permanentemente. Haz un backup antes si lo necesitas.</div>'
    // Resultados de tests
    +'<div class="card mb3"><div class="cb">'
    +'<h3 style="font-size:14px;font-weight:700;margin-bottom:4px">🧪 Resultados de Tests</h3>'
    +'<p class="tsm tgr mb3">Borra todos los resultados de evaluaciones (Big5, SCL, Cargo, Ficha). Los candidatos quedarán como si no hubieran hecho el test.</p>'
    +'<button class="btn br" onclick="limpiarDatos(\'resultados\')">Borrar resultados de tests</button>'
    +'</div></div>'
    // Candidatos
    +'<div class="card mb3"><div class="cb">'
    +'<h3 style="font-size:14px;font-weight:700;margin-bottom:4px">👤 Candidatos</h3>'
    +'<p class="tsm tgr mb3">Borra todos los candidatos registrados y sus resultados. Las convocatorias y perfiles se mantienen.</p>'
    +'<button class="btn br" onclick="limpiarDatos(\'cands\')">Borrar candidatos</button>'
    +'</div></div>'
    // Convocatorias
    +'<div class="card mb3"><div class="cb">'
    +'<h3 style="font-size:14px;font-weight:700;margin-bottom:4px">📢 Convocatorias</h3>'
    +'<p class="tsm tgr mb3">Borra todas las convocatorias (y candidatos asociados). Los perfiles de cargo se mantienen.</p>'
    +'<button class="btn br" onclick="limpiarDatos(\'convs\')">Borrar convocatorias</button>'
    +'</div></div>'
    // Reset total
    +'<div class="card" style="border:2px solid var(--r)"><div class="cb">'
    +'<h3 style="font-size:14px;font-weight:700;color:var(--r);margin-bottom:4px">☢️ Resetear TODO</h3>'
    +'<p class="tsm tgr mb3">Borra candidatos, convocatorias, resultados y tests. Solo queda la configuración de empresa y perfiles de cargo.</p>'
    +'<button class="btn br" onclick="resetTotal()">Resetear todo el sistema</button>'
    +'</div></div>'
    +'</div>';
}
function saveCfgEmp(){
  var c=getCfg();
  c.empresa=document.getElementById('cf_emp').value.trim();
  c.ruc=document.getElementById('cf_ruc').value.trim();
  c.direccion=document.getElementById('cf_dir').value.trim();
  c.ciudad=document.getElementById('cf_ciu').value.trim();
  c.dirRRHH=document.getElementById('cf_drrhh').value.trim();
  c.repLegal=document.getElementById('cf_rep').value.trim();
  saveCfg(c);toast('Empresa guardada','ok');
}
function saveCfgGH(){
  var c=getCfg();
  c.own=document.getElementById('cf_own').value.trim();
  c.repo=document.getElementById('cf_repo').value.trim();
  c.tok=document.getElementById('cf_tok').value.trim();
  saveCfg(c);toast('GitHub guardado','ok');
}

// ── LIMPIAR DATOS ──────────────────────────────────────
var LABELS_DATOS={
  resultados:'resultados de tests',
  cands:'candidatos',
  convs:'convocatorias y candidatos'
};
function limpiarDatos(tipo){
  var label=LABELS_DATOS[tipo]||tipo;
  if(!confirm('¿Borrar TODOS los '+label+'?\n\nEsta acción no se puede deshacer.'))return;

  if(tipo==='resultados'){
    DB.sResultados([]);
    Object.keys(localStorage).forEach(function(k){
      if(k.startsWith('rrhh_test_start_'))localStorage.removeItem(k);
    });
    toast('Resultados de tests borrados','ok');

  } else if(tipo==='cands'){
    DB.sCands([]);
    DB.sResultados([]);
    Object.keys(localStorage).forEach(function(k){
      if(k.startsWith('rrhh_test_start_'))localStorage.removeItem(k);
    });
    toast('Candidatos y resultados borrados','ok');

  } else if(tipo==='convs'){
    DB.sConvs([]);
    DB.sCands([]);
    DB.sResultados([]);
    Object.keys(localStorage).forEach(function(k){
      if(k.startsWith('rrhh_test_start_'))localStorage.removeItem(k);
    });
    toast('Convocatorias, candidatos y resultados borrados','ok');
  }

  go('cfg');
}

function resetTotal(){
  if(!confirm('¿Resetear TODO el sistema?\n\nSe borrarán:\n• Convocatorias\n• Candidatos\n• Resultados de tests\n• Tests de cargo personalizados\n\nSe conservan: Empresa, Perfiles de cargo.\n\nEsta acción NO se puede deshacer.'))return;
  DB.sConvs([]);
  DB.sCands([]);
  DB.sResultados([]);
  DB.sTests([]);
  Object.keys(localStorage).forEach(function(k){
    if(k.startsWith('rrhh_test_start_'))localStorage.removeItem(k);
  });
  toast('Sistema reseteado correctamente','ok');
  go('home');
}
