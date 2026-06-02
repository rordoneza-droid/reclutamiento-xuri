// ══════════════════════════════════════════════════════
// INFORME.JS — Informe Final de selección
// ══════════════════════════════════════════════════════
var infC='';
function pgInforme(){
  var convs=DB.convs();
  var cands=DB.cands();
  var resultados=DB.resultados();
  var opts=convs.map(function(c){return'<option value="'+c.id+'" '+(infC===c.id?'selected':'')+'>'+c.titulo+'</option>';}).join('');
  var body='';
  if(infC){
    var conv=convs.find(function(c){return c.id===infC;});
    var candsPorConv=cands.filter(function(c){return c.convocatoriaId===infC;});
    var vacantes=conv?conv.vacantes:1;
    var scores=candsPorConv.map(function(c){
      var res=resultados.filter(function(r){return r.candId===c.id;});
      var big5=res.find(function(r){return r.tipo==='big5';});
      var scl=res.find(function(r){return r.tipo==='scl'||r.tipo==='screening';});
      var cargo=res.find(function(r){return r.tipo==='cargo';});
      var entrevista=res.find(function(r){return r.tipo==='entrevista';});
      var ptos=[];
      // Big5: dims objeto {E,A,C,N,O} escala 1-5 → 0-100 (N invertido)
      var big5Score=null;
      if(big5&&big5.dims){
        var dv=big5.dims;
        var b5vals=[(dv.E-1)/4*100,(dv.A-1)/4*100,(dv.C-1)/4*100,(5-dv.N)/4*100,(dv.O-1)/4*100];
        big5Score=Math.round(b5vals.reduce(function(s,v){return s+(v||0);},0)/b5vals.length);
        ptos.push(big5Score);
      }
      // SCL: escala 0-4, mayor=peor → invertir. Si no hay dims calcular de resps
      var sclScore=null;
      if(scl){
        var sd=scl.dims;
        if(!sd&&scl.resps&&scl.resps.length){
          var sg={};
          scl.resps.forEach(function(r){if(!sg[r.dim])sg[r.dim]=[];var v=r.val||0;sg[r.dim].push(v>4?v-1:v);});
          sd={};Object.keys(sg).forEach(function(d){sd[d]=Math.round(sg[d].reduce(function(s,v){return s+v;},0)/sg[d].length*10)/10;});
        }
        if(sd){
          var sv=Object.keys(sd).map(function(k){return sd[k];});
          if(sv.length){var sa=sv.reduce(function(s,v){return s+v;},0)/sv.length;sclScore=Math.max(0,Math.round(100-sa*25));ptos.push(sclScore);}
        }
      }
      // Cargo: usar puntaje real o calcularlo de resps
      var cargoScore=null;
      if(cargo){
        if(cargo.puntaje!=null){cargoScore=cargo.puntaje;}
        else if(cargo.resps&&cargo.resps.length){var cr=cargo.resps.filter(function(r){return parseInt(r.resp)===r.correcta;}).length;cargoScore=Math.round(cr/cargo.resps.length*100);}
        if(cargoScore!=null)ptos.push(cargoScore);
      }
      // Entrevista HR: recomendacion → puntaje
      var entScore=null;var entRec=entrevista?(entrevista.recomendacion||'pendiente'):null;
      if(entrevista){var rm={'recomendar':90,'reserva':65,'no recomendar':25,'pendiente':70};entScore=rm[entRec]!=null?rm[entRec]:70;ptos.push(entScore);}
      var score=ptos.length?Math.round(ptos.reduce(function(a,b){return a+b;},0)/ptos.length):0;
      var completo=!!(big5&&scl&&cargo&&entrevista);
      return{id:c.id,nombre:c.apellidos+', '+c.nombres,score:score,ciudad:c.ciudad,completo:completo,
        hasBig5:!!big5,big5Score:big5Score,hasScl:!!scl,sclScore:sclScore,
        hasCargo:!!cargo,cargoScore:cargoScore,hasEnt:!!entrevista,entScore:entScore,entRec:entRec};
    }).sort(function(a,b){return b.score-a.score;});
    var ganadores=scores.slice(0,vacantes);var suplentes=scores.slice(vacantes,vacantes*2);var noCompletos=scores.filter(function(s){return!s.completo;});
    function mkBdg(x,primary){
      var c1=primary?'b-bl':'b-cy';
      return (x.hasBig5?'<span class="bdg '+c1+'">Big5: '+x.big5Score+'%</span>':'<span class="bdg b-rd">Big5 ✗</span>')
        +' '+(x.hasScl?'<span class="bdg '+c1+'">SCL: '+x.sclScore+'%</span>':'<span class="bdg b-rd">SCL ✗</span>')
        +' '+(x.hasCargo?'<span class="bdg '+c1+'">Cargo: '+x.cargoScore+'%</span>':'<span class="bdg b-rd">Cargo ✗</span>')
        +' '+(x.hasEnt?'<span class="bdg '+(x.entRec==='recomendar'?'b-gn':x.entRec==='reserva'?'b-yw':'b-rd')+'">Entrevista: '+x.entScore+'%</span>':'<span class="bdg b-rd">Entrevista ✗</span>');
    }
    var html='<div class="sg"><div class="sc gn"><div class="sl">Vacantes</div><div class="sv">'+vacantes+'</div></div>'
      +'<div class="sc bl"><div class="sl">Total Candidatos</div><div class="sv">'+candsPorConv.length+'</div></div>'
      +'<div class="sc '+(noCompletos.length?'rd':'gn')+'"><div class="sl">Integridad</div><div class="sv">'+(candsPorConv.length-noCompletos.length)+'/'+candsPorConv.length+'</div></div></div>';
    html+='<h2 style="font-size:18px;font-weight:700;margin:20px 0 12px;color:var(--g)">🏆 GANADORES</h2>';
    if(ganadores.length){ganadores.forEach(function(g,i){html+='<div class="card" style="border-left:4px solid var(--g);margin-bottom:12px"><div class="cb"><div class="flex jb ic mb2"><div><span class="bdg b-gn">Puesto '+(i+1)+'</span><h3 style="font-size:16px;margin-top:6px">'+g.nombre+'</h3><div class="tsm tgr">'+g.ciudad+'</div></div><div style="text-align:right"><div class="sv" style="color:var(--g)">'+g.score+'%</div><div class="tsm tgr">Puntaje Total</div></div></div><div class="flex g2" style="margin-top:12px;flex-wrap:wrap">'+mkBdg(g,true)+'</div></div></div>';});}
    else{html+='<div class="al al-w">No hay candidatos con datos registrados.</div>';}
    if(suplentes.length){html+='<h2 style="font-size:18px;font-weight:700;margin:20px 0 12px;color:var(--w)">📋 SUPLENTES</h2>';suplentes.forEach(function(s,i){html+='<div class="card" style="border-left:4px solid var(--w);margin-bottom:12px"><div class="cb"><div class="flex jb ic mb2"><div><span class="bdg b-yw">Suplente '+(i+1)+'</span><h3 style="font-size:16px;margin-top:6px">'+s.nombre+'</h3><div class="tsm tgr">'+s.ciudad+'</div></div><div style="text-align:right"><div class="sv" style="color:var(--w)">'+s.score+'%</div><div class="tsm tgr">Puntaje Total</div></div></div><div class="flex g2" style="margin-top:12px;flex-wrap:wrap">'+mkBdg(s,false)+'</div></div></div>';});}
    if(noCompletos.length){html+='<h2 style="font-size:18px;font-weight:700;margin:20px 0 12px;color:var(--r)">⚠️ DATOS INCOMPLETOS</h2><div class="card"><div class="cb"><table style="width:100%;font-size:12px"><thead><tr><th>Candidato</th><th>Puntaje Parcial</th><th style="text-align:center">Pendiente</th></tr></thead><tbody>';noCompletos.forEach(function(nc){var falta=[];if(!nc.hasBig5)falta.push('Big5');if(!nc.hasScl)falta.push('SCL');if(!nc.hasCargo)falta.push('Cargo');if(!nc.hasEnt)falta.push('Entrevista');html+='<tr><td>'+nc.nombre+'</td><td>'+nc.score+'%</td><td style="text-align:center;color:var(--r)">'+falta.join(', ')+'</td></tr>';});html+='</tbody></table></div></div>';}
    body=html+'<div style="margin-top:20px"><button class="btn bo" onclick="window.print()">🖨️ Imprimir Informe</button></div>';
  }
  document.getElementById('ct').innerHTML='<div class="fg" style="max-width:380px"><label>Convocatoria</label><select onchange="infC=this.value;pgInforme()"><option value="">- Seleccionar -</option>'+opts+'</select></div>'+(body||(!infC?'<div class="es"><div class="es-ico">📄</div><h3>Selecciona una convocatoria</h3></div>':''));
}

function confirmarSel(id){
  var all=DB.cands();var idx=-1;all.forEach(function(c,i){if(c.id===id)idx=i;});if(idx<0)return;
  var just=document.getElementById('just_'+id);
  all[idx].etapa='seleccionado';if(just)all[idx].justificacion=just.value;
  DB.sCands(all);toast('Candidato confirmado','ok');pgInforme();
}
