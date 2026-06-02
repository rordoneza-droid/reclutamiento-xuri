// ══════════════════════════════════════════════════════
// ENTREV.JS — Entrevistas por competencias
// ══════════════════════════════════════════════════════
var entC='';
var _comps=[];

function pgEntrev(){
  var convs=DB.convs();
  document.getElementById('tb-act').innerHTML='';
  var opts=convs.map(function(c){return'<option value="'+c.id+'" '+(entC===c.id?'selected':'')+'>'+c.titulo+'</option>';}).join('');
  var body='';
  if(entC){
    var cands=DB.cands().filter(function(c){return c.convocatoriaId===entC&&['en_entrevista','finalista','seleccionado','reserva'].indexOf(c.etapa)>=0;}).sort(function(a,b){return(b.puntajeTotal||0)-(a.puntajeTotal||0);});
    var rows=cands.map(function(c){
      var ents=c.entrevistas||[];
      var prom=ents.length?Math.round(ents.reduce(function(s,e){return s+e.puntaje;},0)/ents.length):null;
      var tot=calcTot(c);
      return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong></td>'
        +'<td>'+(c.puntajePreseleccion!=null?'<span class="bdg '+sCls(c.puntajePreseleccion)+'">'+c.puntajePreseleccion+'%</span>':'-')+'</td>'
        +'<td>'+(c.puntajeSeleccion!=null?'<span class="bdg '+sCls(c.puntajeSeleccion)+'">'+c.puntajeSeleccion+'%</span>':'-')+'</td>'
        +'<td>'+(prom!=null?'<span class="bdg '+sCls(prom)+'">'+prom+'%</span>':'Pendiente')+'</td>'
        +'<td>'+(tot!=null?'<span class="bdg '+sCls(tot)+'">'+tot+'%</span>':'-')+'</td>'
        +'<td><span class="bdg '+(EB[c.etapa]||'b-gr')+'">'+(EL[c.etapa]||c.etapa)+'</span></td>'
        +'<td><div class="flex g2">'
        +'<button class="btn bo bxs" onclick="modalEnt(\''+c.id+'\')">+ Entrev.</button>'
        +'<button class="btn bo bxs" onclick="regresarEtapa(\''+c.id+'\')">← Regresar</button>'
        +'<button class="btn bw bxs" onclick="overrideD(\''+c.id+'\')">Dir.</button>'
        +'</div></td></tr>';
    }).join('');
    body='<div class="flex g2 mb3"><button class="btn bp bxs" onclick="defFinals(\''+entC+'\')">Definir Finalistas</button></div>'
      +'<div class="card"><div class="tw"><table><thead><tr><th>Candidato</th><th>Presel.</th><th>Selec.</th><th>Entrev.</th><th>Total</th><th>Etapa</th><th></th></tr></thead>'
      +'<tbody>'+(rows||'<tr><td colspan="7" class="tgr" style="text-align:center;padding:20px">Sin candidatos</td></tr>')+'</tbody></table></div></div>';
  }
  document.getElementById('ct').innerHTML='<div class="al al-i">Puntaje total: Presel. 30% + Seleccion 30% + Entrevista 40%.</div>'
    +'<div class="fg" style="max-width:380px"><label>Convocatoria</label><select onchange="entC=this.value;pgEntrev()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+body;
}

function modalEnt(candId){
  var c=DB.cands().find(function(x){return x.id===candId;});if(!c)return;
  var conv=DB.convs().find(function(x){return x.id===c.convocatoriaId;}),perf=conv?DB.perfiles().find(function(p){return p.id===conv.perfilId;}):null;
  _comps=(perf&&perf.competencias||[{nombre:'Evaluacion General',peso:100}]).filter(function(c){return c.nombre;});
  var prev=(c.entrevistas||[]).map(function(e){return'<div class="flex ic g2 mb1 tsm"><span style="flex:1">'+(e.entrevistador||'-')+' ('+e.tipo+') - '+e.fecha+'</span><span class="bdg '+sCls(e.puntaje)+'">'+e.puntaje+'%</span></div>';}).join('');
  var sliders=_comps.map(function(comp,i){return'<div class="fg"><label>'+comp.nombre+' ('+comp.peso+'%)</label><div class="rw"><input type="range" id="ec'+i+'" min="0" max="100" value="70" oninput="document.getElementById(\'ev'+i+'\').textContent=this.value+\'%\';calcEnt()"><span class="rv" id="ev'+i+'">70%</span></div></div>';}).join('');
  openM('Entrevista - '+c.apellidos+', '+c.nombres,
    (prev?'<div class="mb3"><strong class="txs tgr">Previas:</strong><div class="mt2">'+prev+'</div></div><div class="div"></div>':'')
    +'<div class="fr fr2"><div class="fg"><label>Entrevistador</label><input id="ew_q" placeholder="Tu nombre"></div>'
    +'<div class="fg"><label>Tipo</label><select id="ew_t"><option>1ra Entrevista</option><option>2da Entrevista</option><option>Panel</option><option>Tecnica</option></select></div></div>'
    +'<div class="div"></div>'+sliders
    +'<div style="background:var(--pl);padding:10px;border-radius:6px;margin:8px 0"><strong>Total estimado: <span id="ew_tot">70%</span></strong></div>'
    +'<div class="fg"><label>Observaciones</label><textarea id="ew_o" rows="3"></textarea></div>'
    +'<div class="fg"><label>Recomendacion</label><select id="ew_r"><option value="recomendar">Recomendar</option><option value="reserva">Reserva</option><option value="no recomendar">No recomendar</option></select></div>',
    '<button class="btn bo" onclick="closeM()">Cancelar</button><button class="btn bp" onclick="saveEnt(\''+candId+'\')">Guardar</button>');
  setTimeout(calcEnt,50);
}
function calcEnt(){
  if(!_comps.length)return;
  var tp=_comps.reduce(function(s,c){return s+c.peso;},0)||1;
  var score=_comps.reduce(function(s,c,i){var el=document.getElementById('ec'+i);return s+(el?parseInt(el.value||0):0)*(c.peso/tp);},0);
  var el=document.getElementById('ew_tot');if(el)el.textContent=Math.round(score)+'%';
}
function saveEnt(candId){
  var tp=_comps.reduce(function(s,c){return s+c.peso;},0)||1;
  var puntaje=Math.round(_comps.reduce(function(s,c,i){var el=document.getElementById('ec'+i);return s+(el?parseInt(el.value||0):0)*(c.peso/tp);},0));
  var ent={entrevistador:document.getElementById('ew_q').value||'Director',tipo:document.getElementById('ew_t').value,puntaje:puntaje,obs:document.getElementById('ew_o').value||'',rec:document.getElementById('ew_r').value,fecha:today()};
  var all=DB.cands();var idx=-1;all.forEach(function(c,i){if(c.id===candId)idx=i;});if(idx<0)return;
  if(!all[idx].entrevistas)all[idx].entrevistas=[];
  all[idx].entrevistas.push(ent);
  var ents=all[idx].entrevistas;
  all[idx].puntajeEntrevista=Math.round(ents.reduce(function(s,e){return s+e.puntaje;},0)/ents.length);
  all[idx].puntajeTotal=calcTot(all[idx]);
  DB.sCands(all);closeM();toast('Entrevista registrada','ok');pgEntrev();
}
function defFinals(convId){
  var conv=DB.convs().find(function(c){return c.id===convId;}),vac=conv&&conv.vacantes||1;
  var all=DB.cands();
  var aptos=all.filter(function(c){return c.convocatoriaId===convId&&c.etapa==='en_entrevista';}).sort(function(a,b){return(b.puntajeTotal||0)-(a.puntajeTotal||0);});
  aptos.forEach(function(c,i){
    var idx=-1;all.forEach(function(x,j){if(x.id===c.id)idx=j;});if(idx<0)return;
    if(i<vac)all[idx].etapa='finalista';else if(i<vac+2)all[idx].etapa='reserva';
  });
  DB.sCands(all);toast('Finalistas definidos','ok');pgEntrev();
}
