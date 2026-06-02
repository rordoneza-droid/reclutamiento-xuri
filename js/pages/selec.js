// ══════════════════════════════════════════════════════
// SELEC.JS — Selección / Pruebas técnicas
// ══════════════════════════════════════════════════════
var selC='';
function pgSelec(){
  var convs=DB.convs();
  document.getElementById('tb-act').innerHTML='';
  var opts=convs.map(function(c){return'<option value="'+c.id+'" '+(selC===c.id?'selected':'')+'>'+c.titulo+'</option>';}).join('');
  var body='';
  if(selC){
    var cands=DB.cands().filter(function(c){return c.convocatoriaId===selC&&['en_seleccion','descartado_sel'].indexOf(c.etapa)>=0;}).sort(function(a,b){return(b.puntajeSeleccion||b.puntajePreseleccion||0)-(a.puntajeSeleccion||a.puntajePreseleccion||0);});
    var rows=cands.map(function(c){
      var pr=c.pruebas||[],prom=pr.length?Math.round(pr.reduce(function(s,p){return s+p.puntaje;},0)/pr.length):null;
      return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong></td>'
        +'<td>'+(c.puntajePreseleccion!=null?'<span class="bdg '+sCls(c.puntajePreseleccion)+'">'+c.puntajePreseleccion+'%</span>':'-')+'</td>'
        +'<td>'+(pr.length?pr.map(function(p){return'<span class="bdg b-gr" style="margin:1px">'+p.nombre+': '+p.puntaje+'%</span>';}).join(''):'<span class="tgr txs">Sin pruebas</span>')+'</td>'
        +'<td>'+(prom!=null?'<span class="bdg '+sCls(prom)+'">'+prom+'%</span>':'-')+'</td>'
        +'<td><span class="bdg '+(EB[c.etapa]||'b-gr')+'">'+(EL[c.etapa]||c.etapa)+'</span></td>'
        +'<td><div class="flex g2">'
        +'<button class="btn bo bxs" onclick="modalPrueba(\''+c.id+'\')">+ Prueba</button>'
        +'<button class="btn bg bxs" onclick="moverC(\''+c.id+'\',\'en_entrevista\')">→ Entrev.</button>'
        +'<button class="btn br bxs" onclick="moverC(\''+c.id+'\',\'descartado_sel\')">✕</button>'
        +'<button class="btn bxs" style="background:#25D366;color:#fff;border:none" onclick="whatsappCand(\''+c.id+'\')">📱 WA</button>'
        +'<button class="btn bo bxs" onclick="regresarEtapa(\''+c.id+'\')">← Regresar</button>'
        +'<button class="btn bw bxs" onclick="overrideD(\''+c.id+'\')">Dir.</button>'
        +'</div></td></tr>';
    }).join('');
    body='<div class="flex g2 mb3" style="flex-wrap:wrap">'
      +'<button class="btn bp bxs" onclick="pasarEntrev(\''+selC+'\')">→ Pasar a Entrevistas</button>'
      +'<button class="btn bg bxs" onclick="abrirTestCandidato()">📋 Abrir Evaluación Digital</button></div>'
      +'<div class="al al-s" style="margin-bottom:12px">Haz clic en "Abrir Evaluación Digital" para que el candidato complete los tests. Tiempo límite: 60 minutos.</div>'
      +'<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Presel.</th><th>Pruebas</th><th>Promedio</th><th>Etapa</th><th>Acciones</th></tr></thead>'
      +'<tbody>'+(rows||'<tr><td colspan="6" class="tgr" style="text-align:center;padding:20px">Sin candidatos</td></tr>')+'</tbody></table></div></div>';
  }
  document.getElementById('ct').innerHTML='<div class="al al-i">Registra pruebas tecnicas o psicometricas. El promedio de pruebas es el puntaje de seleccion.</div>'
    +'<div class="fg" style="max-width:380px"><label>Convocatoria</label><select onchange="selC=this.value;pgSelec()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+body;
}
function modalPrueba(candId){
  var c=DB.cands().find(function(x){return x.id===candId;});if(!c)return;
  var prev=(c.pruebas||[]).map(function(p,i){return'<div class="flex ic g2 mb2"><span style="flex:1">'+p.nombre+'</span><span class="bdg '+sCls(p.puntaje)+'">'+p.puntaje+'%</span><button class="btn bo bxs" onclick="delPrueba(\''+candId+'\','+i+')">✕</button></div>';}).join('');
  openM('Pruebas - '+c.apellidos+', '+c.nombres,
    (prev?'<div class="mb3">'+prev+'</div><div class="div"></div>':'')
    +'<div class="fr fr2"><div class="fg"><label>Tipo</label><select id="pr_n"><option>Psicometrica</option><option>Tecnica</option><option>Conocimientos</option><option>Idioma</option><option>Personalidad</option></select></div>'
    +'<div class="fg"><label>Puntaje (0-100)</label><input id="pr_p" type="number" min="0" max="100" value="70"></div></div>'
    +'<div class="fg"><label>Observaciones</label><textarea id="pr_o" rows="2"></textarea></div>',
    '<button class="btn bo" onclick="closeM()">Cerrar</button><button class="btn bp" onclick="savePrueba(\''+candId+'\')">+ Agregar</button>');
}
function savePrueba(candId){
  var all=DB.cands();var idx=-1;all.forEach(function(c,i){if(c.id===candId)idx=i;});if(idx<0)return;
  var p={nombre:document.getElementById('pr_n').value,puntaje:parseInt(document.getElementById('pr_p').value||0),obs:document.getElementById('pr_o').value||'',fecha:today()};
  if(!all[idx].pruebas)all[idx].pruebas=[];
  all[idx].pruebas.push(p);
  var ps=all[idx].pruebas;
  all[idx].puntajeSeleccion=Math.round(ps.reduce(function(s,x){return s+x.puntaje;},0)/ps.length);
  all[idx].puntajeTotal=calcTot(all[idx]);
  DB.sCands(all);closeM();toast('Prueba registrada','ok');pgSelec();
}
function delPrueba(candId,i){
  var all=DB.cands();var idx=-1;all.forEach(function(c,j){if(c.id===candId)idx=j;});if(idx<0)return;
  all[idx].pruebas.splice(i,1);
  var ps=all[idx].pruebas;
  all[idx].puntajeSeleccion=ps.length?Math.round(ps.reduce(function(s,x){return s+x.puntaje;},0)/ps.length):null;
  all[idx].puntajeTotal=calcTot(all[idx]);
  DB.sCands(all);closeM();pgSelec();
}
function pasarEntrev(convId){
  var all=DB.cands();var n=0;
  all.forEach(function(c,i){if(c.convocatoriaId===convId&&c.etapa==='en_seleccion'){all[i].etapa='en_entrevista';n++;}});
  DB.sCands(all);toast(n+' candidatos a Entrevistas','ok');pgSelec();
}
