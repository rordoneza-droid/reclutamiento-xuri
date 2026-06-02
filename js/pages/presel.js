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
      return'<tr><td><div class="flex ic g2"><span class="sem '+(s>=75?'sg2':s>=50?'sy2':'sr2')+'"></span><strong>'+c.apellidos+', '+c.nombres+'</strong></div></td>'
        +'<td><div class="flex ic g2"><div class="pb" style="width:70px"><div class="pf" style="width:'+s+'%;background:'+sCol(s)+'"></div></div>'
        +'<span class="bdg '+sCls(s)+'">'+s+'%</span>'+(c.decisionDirector?'<span class="bdg b-yw">Dir.</span>':'')+'</div></td>'
        +'<td><span class="bdg '+(EB[c.etapa]||'b-gr')+'">'+(EL[c.etapa]||c.etapa)+'</span></td>'
        +'<td><div class="flex g2">'
        +'<button class="btn bg bxs" onclick="moverC(\''+c.id+'\',\'preseleccionado\')">✓</button>'
        +'<button class="btn br bxs" onclick="moverC(\''+c.id+'\',\'descartado_pre\')">✕</button>'
        +'<button class="btn bo bxs" onclick="regresarEtapa(\''+c.id+'\')">← Regresar</button>'
        +'<button class="btn bw bxs" onclick="overrideD(\''+c.id+'\')">Dir.</button>'
        +'</div></td></tr>';
    }).join('');
    body='<div class="flex g2 mb3" style="flex-wrap:wrap">'
      +'<span class="bdg b-bl">'+cands.length+' candidatos</span>'
      +'<span class="bdg b-gn">'+aptos+' aptos</span>'
      +'<span class="bdg b-rd">'+desc+' desc.</span>'
      +'<button class="btn bo bxs" onclick="autoPre(\''+preC+'\')">Auto-clasificar</button>'
      +'<button class="btn bp bxs" onclick="pasarSel(\''+preC+'\')">→ Seleccion</button>'
      +'</div>'
      +'<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Puntaje</th><th>Estado</th><th>Decision</th></tr></thead>'
      +'<tbody>'+(rows||'<tr><td colspan="4" class="tgr" style="text-align:center;padding:20px">Sin candidatos</td></tr>')+'</tbody></table></div></div>';
  }
  document.getElementById('ct').innerHTML='<div class="al al-i">El sistema puntua automaticamente segun el perfil. Puedes ajustar cualquier decision.</div>'
    +'<div class="fg" style="max-width:380px"><label>Convocatoria</label><select onchange="preC=this.value;pgPresel()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+body;
}
function autoPre(convId){
  var conv=DB.convs().find(function(c){return c.id===convId;}),perf=conv?DB.perfiles().find(function(p){return p.id===conv.perfilId;}):null;
  var all=DB.cands();
  all.forEach(function(c,i){
    if(c.convocatoriaId!==convId||c.decisionDirector)return;
    var s=calcPre(c,perf);all[i].puntajePreseleccion=s;
    if(['postulado','preseleccionado','descartado_pre'].indexOf(c.etapa)>=0)all[i].etapa=s>=50?'preseleccionado':'descartado_pre';
  });
  DB.sCands(all);toast('Clasificacion aplicada','ok');pgPresel();
}
function pasarSel(convId){
  var all=DB.cands();var n=0;
  all.forEach(function(c,i){if(c.convocatoriaId===convId&&c.etapa==='preseleccionado'){all[i].etapa='en_seleccion';n++;}});
  DB.sCands(all);toast(n+' candidatos a Seleccion','ok');pgPresel();
}
