// ══════════════════════════════════════════════════════
// CONFIG.JS — Configuración de empresa y GitHub
// ══════════════════════════════════════════════════════
function pgCfg(){
  var c=getCfg();
  document.getElementById('ct').innerHTML=
    '<div class="tabs"><div class="tab on" id="ct0" onclick="swTab(\'c\',0)">Empresa</div>'
    +'<div class="tab" id="ct1" onclick="swTab(\'c\',1)">GitHub Sync</div>'
    +'<div class="tab" id="ct2" onclick="swTab(\'c\',2)">Backup</div></div>'
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
    +'</div></div></div></div>';
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
