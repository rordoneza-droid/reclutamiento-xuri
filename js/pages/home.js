// ══════════════════════════════════════════════════════
// HOME.JS — Dashboard principal
// ══════════════════════════════════════════════════════
function pgHome(){
  var convs=DB.convs(),cands=DB.cands(),perfs=DB.perfiles();
  var activas=convs.filter(function(c){return c.estado==='activa';}).length;
  var enP=cands.filter(function(c){return['preseleccionado','en_seleccion','en_entrevista','finalista'].indexOf(c.etapa)>=0;}).length;
  var sels=cands.filter(function(c){return c.etapa==='seleccionado';}).length;
  var stats='<div class="sg">'
    +'<div class="sc bl"><div class="sl">Conv. Activas</div><div class="sv">'+activas+'</div><div class="ss2">de '+convs.length+' total</div></div>'
    +'<div class="sc"><div class="sl">Candidatos</div><div class="sv">'+cands.length+'</div></div>'
    +'<div class="sc yw"><div class="sl">En Proceso</div><div class="sv">'+enP+'</div></div>'
    +'<div class="sc gn"><div class="sl">Seleccionados</div><div class="sv">'+sels+'</div></div>'
    +'<div class="sc bl"><div class="sl">Perfiles</div><div class="sv">'+perfs.length+'</div></div>'
    +'</div>';
  var content='';
  if(convs.length===0){
    content='<div class="es"><div class="es-ico">🚀</div><h3>Bienvenido a RRHH Pro</h3><p>Empieza configurando tu empresa y creando el primer perfil de cargo.</p>'
      +'<button class="btn bp" onclick="go(\'cfg\')">⚙️ Configurar</button></div>';
  }else{
    var rows=convs.slice(0,8).map(function(c){
      var n=cands.filter(function(x){return x.convocatoriaId===c.id;}).length;
      var p=perfs.find(function(x){return x.id===c.perfilId;});
      return'<tr><td><strong>'+c.titulo+'</strong><br><span class="tgr txs">'+(p?p.area:'-')+'</span></td><td>'+eBdg(c.estado)+'</td><td>'+n+'</td><td>'+fmtD(c.fechaCierre)+'</td></tr>';
    }).join('');
    content='<div class="card"><div class="ch"><span class="ct2">Convocatorias Recientes</span><button class="btn bo bs" onclick="go(\'convs\')">Ver todas</button></div>'
      +'<div class="tw"><table><thead><tr><th>Cargo</th><th>Estado</th><th>Cands.</th><th>Cierre</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }
  document.getElementById('ct').innerHTML=stats+content;
}
