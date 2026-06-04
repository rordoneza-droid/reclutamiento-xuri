// ══════════════════════════════════════════════════════
// ENTREV.JS — Entrevistas virtuales guiadas
// ══════════════════════════════════════════════════════
var entC='';
var _comps=[];

// ── PÁGINA PRINCIPAL ────────────────────────────────────
function pgEntrev(){
  var convs=DB.convs();
  document.getElementById('tb-act').innerHTML='';
  var opts=convs.map(function(c){return'<option value="'+c.id+'" '+(entC===c.id?'selected':'')+'>'+c.titulo+'</option>';}).join('');
  var body='';
  if(entC){
    var cands=DB.cands().filter(function(c){
      return c.convocatoriaId===entC&&['en_entrevista','finalista','seleccionado','reserva'].indexOf(c.etapa)>=0;
    }).sort(function(a,b){return(b.puntajeTotal||0)-(a.puntajeTotal||0);});

    var rows=cands.map(function(c){
      var ents=c.entrevistas||[];
      var prom=ents.length?Math.round(ents.reduce(function(s,e){return s+e.puntaje;},0)/ents.length):null;
      var lastEnt=ents.length?ents[ents.length-1]:null;
      var tot=calcTot(c);
      var scoreDisp=prom!=null
        ?(lastEnt&&lastEnt.notaSobre10!=null
          ?'<span class="bdg '+sCls(prom)+'">'+lastEnt.notaSobre10+'/10 &nbsp;('+prom+'%)</span>'
          :'<span class="bdg '+sCls(prom)+'">'+prom+'%</span>')
        :'<span style="color:#94a3b8;font-size:13px">Pendiente</span>';
      return'<tr><td><strong>'+c.apellidos+', '+c.nombres+'</strong></td>'
        +'<td>'+(c.puntajePreseleccion!=null?'<span class="bdg '+sCls(c.puntajePreseleccion)+'">'+c.puntajePreseleccion+'%</span>':'-')+'</td>'
        +'<td>'+(c.puntajeSeleccion!=null?'<span class="bdg '+sCls(c.puntajeSeleccion)+'">'+c.puntajeSeleccion+'%</span>':'-')+'</td>'
        +'<td>'+scoreDisp+'</td>'
        +'<td>'+(tot!=null?'<span class="bdg '+sCls(tot)+'">'+tot+'%</span>':'-')+'</td>'
        +'<td><span class="bdg '+(EB[c.etapa]||'b-gr')+'">'+(EL[c.etapa]||c.etapa)+'</span></td>'
        +'<td><div class="flex g2">'
        +(ents.length?'<button class="btn bo bxs" onclick="verEntrevista(\''+c.id+'\')">👁 Ver</button>':'')
        +'<button class="btn bp bxs" onclick="modalEntVirtual(\''+c.id+'\')">🎤 Entrevistar</button>'
        +'<button class="btn bo bxs" onclick="regresarEtapa(\''+c.id+'\')">← Regresar</button>'
        +'<button class="btn bw bxs" onclick="overrideD(\''+c.id+'\')">Dir.</button>'
        +'</div></td></tr>';
    }).join('');

    body='<div class="flex g2 mb3"><button class="btn bp bxs" onclick="defFinals(\''+entC+'\')">Definir Finalistas</button></div>'
      +'<div class="card"><div class="tw"><table><thead><tr>'
      +'<th>Candidato</th><th>Presel.</th><th>Selec.</th><th>Entrevista</th><th>Total</th><th>Etapa</th><th></th>'
      +'</tr></thead><tbody>'
      +(rows||'<tr><td colspan="7" class="tgr" style="text-align:center;padding:20px">Sin candidatos en esta etapa</td></tr>')
      +'</tbody></table></div></div>';
  }
  document.getElementById('ct').innerHTML=
    '<div class="al al-i">Puntaje total: Presel. 30% + Selección 30% + Entrevista 40%.</div>'
    +'<div class="fg" style="max-width:380px"><label>Convocatoria</label>'
    +'<select onchange="entC=this.value;pgEntrev()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+body;
}

// ── ENTREVISTA VIRTUAL GUIADA ────────────────────────────
var _entVStep=0, _entVCandId='', _entVNotas={}, _entVOpinion='', _entVNota='';
var _entVPregs=[];

var _catMeta={
  'Situacional':   {color:'#d97706',bg:'#fffbeb'},
  'Competencias':  {color:'#2563eb',bg:'#eff6ff'},
  'Motivacion':    {color:'#7c3aed',bg:'#f5f3ff'},
  'Disponibilidad':{color:'#059669',bg:'#ecfdf5'},
  'Proyeccion':    {color:'#4f46e5',bg:'#eef2ff'}
};

function modalEntVirtual(candId){
  var c=DB.cands().find(function(x){return x.id===candId;});
  if(!c)return;
  _entVStep=0; _entVCandId=candId; _entVNotas={}; _entVOpinion=''; _entVNota='';
  _entVPregs=typeof ENT_PREGUNTAS!=='undefined'?ENT_PREGUNTAS.slice():[];
  if(!_entVPregs.length){toast('Sin preguntas de entrevista configuradas','err');return;}

  // Bloque de entrevistas anteriores
  var ents=c.entrevistas||[];
  var prevHtml='';
  if(ents.length){
    prevHtml='<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin-bottom:16px">'
      +'<div style="font-size:11px;font-weight:800;color:#1d4ed8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Entrevistas anteriores</div>'
      +ents.map(function(e){
        var lbl=e.notaSobre10!=null?(e.notaSobre10+'/10'):e.puntaje+'%';
        var recIcon={recomendar:'✅',reserva:'⚠️','no recomendar':'❌'}[e.rec]||'';
        return'<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#1e40af;padding:4px 0;border-bottom:1px solid #dbeafe">'
          +'<span>'+(e.tipo||'Entrevista')+' · '+(e.entrevistador||'')+'</span>'
          +'<span style="font-weight:800">'+recIcon+' '+lbl+'</span></div>';
      }).join('')+'</div>';
  }

  openM('🎤 Entrevista — '+c.apellidos+', '+c.nombres,'','',true);
  setTimeout(function(){
    document.getElementById('mbody').innerHTML=prevHtml+'<div id="_ev_slot"></div>';
    renderEntVirt();
  },60);
}

function renderEntVirt(){
  var total=_entVPregs.length;
  var isFinal=_entVStep>=total;
  var slot=document.getElementById('_ev_slot');
  var foot=document.getElementById('mf');
  if(!slot||!foot)return;

  if(!isFinal){
    var p=_entVPregs[_entVStep];
    var nota=_entVNotas[p.id]||'';
    var cat=_catMeta[p.cat]||{color:'#64748b',bg:'#f1f5f9'};
    var pct=Math.round(_entVStep/total*100);

    slot.innerHTML=
      // Progreso
      '<div style="margin-bottom:18px">'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:6px">'
      +'<span style="font-weight:700">Pregunta '+(_entVStep+1)+' de '+total+'</span>'
      +'<span>'+pct+'% completado</span></div>'
      +'<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">'
      +'<div style="height:100%;width:'+pct+'%;background:'+cat.color+';border-radius:3px;transition:width .35s"></div></div></div>'
      // Badge categoría
      +'<div style="margin-bottom:14px">'
      +'<span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;'
      +'background:'+cat.bg+';color:'+cat.color+';font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em">'
      +p.cat+'</span></div>'
      // Texto de la pregunta
      +'<div style="font-size:16px;font-weight:600;line-height:1.65;color:#1e293b;margin-bottom:20px;'
      +'padding:16px 18px;background:#f8fafc;border-radius:12px;border-left:4px solid '+cat.color+'">'
      +p.txt+'</div>'
      // Notas del entrevistador
      +'<div class="fg"><label>Observaciones del entrevistador</label>'
      +'<textarea id="ev-nota" rows="4" style="resize:vertical" '
      +'placeholder="Anota la respuesta del candidato, actitud, palabras clave...">'+nota+'</textarea></div>';

    foot.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:8px">'
      +'<button class="btn bo" onclick="navEntVirt(-1)"'+(_entVStep===0?' style="visibility:hidden"':'')+'>← Anterior</button>'
      +'<span style="font-size:13px;color:#64748b;font-weight:600">'+(_entVStep+1)+' / '+total+'</span>'
      +'<button class="btn bp" onclick="navEntVirt(1)">'+(_entVStep<total-1?'Siguiente →':'📋 Evaluación Final')+'</button>'
      +'</div>';

  }else{
    // Paso final: opinión personal + calificación
    var conNotas=_entVPregs.filter(function(q){return _entVNotas[q.id]&&_entVNotas[q.id].trim();}).length;

    slot.innerHTML=
      // Header evaluación final
      '<div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;'
      +'border-radius:12px;padding:22px 24px;margin-bottom:22px;text-align:center">'
      +'<div style="font-size:42px;margin-bottom:8px">📋</div>'
      +'<div style="font-size:18px;font-weight:800;margin-bottom:4px">Evaluación Final</div>'
      +'<div style="font-size:13px;opacity:.8">'+total+' preguntas revisadas'
      +(conNotas?' · <strong>'+conNotas+' con notas</strong>':'')+'</div></div>'

      // Opinión personal
      +'<div class="fg"><label>Opinión Personal <span class="rq">*</span></label>'
      +'<textarea id="ev-opinion" rows="5" style="resize:vertical" '
      +'placeholder="Escribe tu análisis del candidato: comportamiento, actitud, respuestas destacadas, puntos débiles, idoneidad para el cargo...">'
      +(_entVOpinion||'')+'</textarea></div>'

      // Score + Recomendación
      +'<div class="fr fr2" style="align-items:flex-start;margin-top:4px">'

      +'<div class="fg"><label>Calificación</label>'
      +'<div style="display:flex;align-items:center;gap:12px;margin-top:8px">'
      +'<input type="number" id="ev-score" min="0" max="10" step="0.5" '
      +'value="'+(_entVNota!==''?_entVNota:'')+'" placeholder="0" '
      +'style="width:90px;font-size:32px;font-weight:800;text-align:center;'
      +'padding:8px 6px;border:2px solid #e2e8f0;border-radius:12px;outline:none;'
      +'font-family:inherit;transition:.2s" '
      +'onfocus="this.style.borderColor=\'#4f46e5\'" '
      +'onblur="this.style.borderColor=\'#e2e8f0\'" '
      +'oninput="actualizarPctEnt(this.value)">'
      +'<div>'
      +'<div style="font-size:26px;color:#64748b;font-weight:700;line-height:1">/ 10</div>'
      +'<div id="ev-pct" style="font-size:13px;color:#94a3b8;margin-top:4px;font-weight:600">'
      +(_entVNota!==''?Math.round(parseFloat(_entVNota)/10*100)+'%':'— %')+'</div>'
      +'</div></div></div>'

      +'<div class="fg"><label>Recomendación</label>'
      +'<select id="ev-rec" style="margin-top:8px">'
      +'<option value="recomendar">✅ Recomendar</option>'
      +'<option value="reserva">⚠️ Reserva</option>'
      +'<option value="no recomendar">❌ No recomendar</option>'
      +'</select></div></div>';

    foot.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:8px">'
      +'<button class="btn bo" onclick="navEntVirt(-1)">← Volver</button>'
      +'<button class="btn bp" onclick="guardarEntVirt()" style="background:#059669">💾 Guardar entrevista</button>'
      +'</div>';
  }
}

function actualizarPctEnt(val){
  var el=document.getElementById('ev-pct');
  if(!el)return;
  var n=parseFloat(val);
  el.textContent=(!isNaN(n)&&n>=0&&n<=10)?Math.round(n/10*100)+'%':'— %';
}

function navEntVirt(delta){
  // Persiste nota/opinión del paso actual antes de moverse
  if(_entVStep<_entVPregs.length){
    var el=document.getElementById('ev-nota');
    if(el)_entVNotas[_entVPregs[_entVStep].id]=el.value;
  }else{
    var opEl=document.getElementById('ev-opinion');
    var scEl=document.getElementById('ev-score');
    if(opEl)_entVOpinion=opEl.value;
    if(scEl)_entVNota=scEl.value;
  }
  _entVStep=Math.max(0,Math.min(_entVPregs.length,_entVStep+delta));
  renderEntVirt();
}

function guardarEntVirt(){
  var opinion=(document.getElementById('ev-opinion')||{}).value||'';
  var notaStr=(document.getElementById('ev-score')||{}).value||'';
  var rec=(document.getElementById('ev-rec')||{}).value||'recomendar';
  var nota=parseFloat(notaStr);
  if(!opinion.trim()){toast('Escribe tu opinión personal','err');return;}
  if(isNaN(nota)||nota<0||nota>10){toast('La calificación debe ser entre 0 y 10','err');return;}

  var puntaje=Math.round(nota/10*100);
  var ent={
    tipo:'Virtual',
    entrevistador:(getCfg().dirRRHH||'Evaluador'),
    preguntas:_entVPregs.map(function(p){
      return{id:p.id,cat:p.cat,txt:p.txt,nota:_entVNotas[p.id]||''};
    }),
    opinion:opinion,
    notaSobre10:nota,
    puntaje:puntaje,
    rec:rec,
    fecha:today()
  };

  var all=DB.cands();
  var idx=-1;
  all.forEach(function(c,i){if(c.id===_entVCandId)idx=i;});
  if(idx<0)return;
  if(!all[idx].entrevistas)all[idx].entrevistas=[];
  all[idx].entrevistas.push(ent);
  var ents=all[idx].entrevistas;
  all[idx].puntajeEntrevista=Math.round(ents.reduce(function(s,e){return s+e.puntaje;},0)/ents.length);
  all[idx].puntajeTotal=calcTot(all[idx]);
  DB.sCands(all);
  closeM();
  toast('Entrevista guardada — '+nota+'/10 ('+puntaje+'%)','ok');
  pgEntrev();
}

// ── VER ENTREVISTA GUARDADA ──────────────────────────────
function verEntrevista(candId){
  var c=DB.cands().find(function(x){return x.id===candId;});
  if(!c||!c.entrevistas||!c.entrevistas.length){toast('Sin entrevistas guardadas','err');return;}

  var recIcon={recomendar:'✅ Recomendar',reserva:'⚠️ Reserva','no recomendar':'❌ No recomendar'};
  var recColor={recomendar:'#059669',reserva:'#d97706','no recomendar':'#dc2626'};

  var html='';
  // Muestra todas las entrevistas, la más reciente primero
  c.entrevistas.slice().reverse().forEach(function(ent,idx){
    var isVirtual=ent.tipo==='Virtual';
    var scoreHtml=ent.notaSobre10!=null
      ?'<span style="font-size:28px;font-weight:800;color:#1e293b">'+ent.notaSobre10+'</span>'
       +'<span style="font-size:16px;color:#64748b;font-weight:600"> / 10</span>'
       +'<span style="font-size:13px;color:#94a3b8;margin-left:8px">('+ent.puntaje+'%)</span>'
      :'<span style="font-size:22px;font-weight:800;color:#1e293b">'+ent.puntaje+'%</span>';

    html+='<div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:18px">';

    // Cabecera de la entrevista
    html+='<div style="background:#f8fafc;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
      +'<div>'
      +'<div style="font-size:13px;font-weight:800;color:#1e293b">'+(isVirtual?'🎤 Entrevista Virtual':'📋 '+ent.tipo)+'</div>'
      +'<div style="font-size:12px;color:#64748b;margin-top:2px">'+ent.fecha+(ent.entrevistador?' · '+ent.entrevistador:'')+'</div>'
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
      +'<div>'+scoreHtml+'</div>'
      +'<div style="font-size:13px;font-weight:700;color:'+(recColor[ent.rec]||'#64748b')+'">'+(recIcon[ent.rec]||ent.rec||'')+'</div>'
      +'</div></div>';

    // Opinión personal (si existe)
    if(ent.opinion){
      html+='<div style="padding:14px 18px;border-bottom:1px solid #f1f5f9">'
        +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:6px">Opinión Personal</div>'
        +'<div style="font-size:14px;line-height:1.65;color:#334155;white-space:pre-wrap">'+ent.opinion+'</div>'
        +'</div>';
    }

    // Preguntas con notas (solo las que tienen nota)
    if(isVirtual&&ent.preguntas&&ent.preguntas.length){
      var conNota=ent.preguntas.filter(function(p){return p.nota&&p.nota.trim();});
      if(conNota.length){
        html+='<div style="padding:14px 18px">'
          +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:10px">'
          +'Observaciones por pregunta ('+conNota.length+' de '+ent.preguntas.length+')</div>';
        conNota.forEach(function(p){
          var cat=_catMeta[p.cat]||{color:'#64748b',bg:'#f1f5f9'};
          html+='<div style="margin-bottom:12px;padding:12px 14px;background:#f8fafc;border-radius:8px;border-left:3px solid '+cat.color+'">'
            +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
            +'<span style="padding:2px 8px;border-radius:10px;background:'+cat.bg+';color:'+cat.color+';font-size:10px;font-weight:800;text-transform:uppercase">'+p.cat+'</span>'
            +'</div>'
            +'<div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:5px">'+p.txt+'</div>'
            +'<div style="font-size:13px;color:#475569;line-height:1.55;white-space:pre-wrap">'+p.nota+'</div>'
            +'</div>';
        });
        html+='</div>';
      }else{
        html+='<div style="padding:12px 18px;font-size:13px;color:#94a3b8">Sin observaciones registradas por pregunta.</div>';
      }
    }

    html+='</div>'; // cierre card entrevista
  });

  openM('👁 Entrevistas — '+c.apellidos+', '+c.nombres, html,
    '<button class="btn bo" onclick="closeM()">Cerrar</button>'
    +'<button class="btn bp" onclick="closeM();modalEntVirtual(\''+candId+'\')">🎤 Nueva entrevista</button>',
    true);
}

// ── DEFINIR FINALISTAS ───────────────────────────────────
function defFinals(convId){
  var conv=DB.convs().find(function(c){return c.id===convId;}),vac=conv&&conv.vacantes||1;
  var all=DB.cands();
  var aptos=all.filter(function(c){return c.convocatoriaId===convId&&c.etapa==='en_entrevista';})
    .sort(function(a,b){return(b.puntajeTotal||0)-(a.puntajeTotal||0);});
  aptos.forEach(function(c,i){
    var idx=-1;all.forEach(function(x,j){if(x.id===c.id)idx=j;});if(idx<0)return;
    if(i<vac)all[idx].etapa='finalista';else if(i<vac+2)all[idx].etapa='reserva';
  });
  DB.sCands(all);toast('Finalistas definidos','ok');pgEntrev();
}
