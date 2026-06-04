// ══════════════════════════════════════════════════════
// DB.JS — Base de datos local + Firestore (tiempo real) + GitHub + Backup
// ══════════════════════════════════════════════════════

var DB={
  _c:{},
  get:function(t){if(this._c[t])return this._c[t];try{this._c[t]=JSON.parse(localStorage.getItem('rrhh_'+t)||'[]');}catch(e){this._c[t]=[];}return this._c[t];},
  save:function(t,d){this._c[t]=d;localStorage.setItem('rrhh_'+t,JSON.stringify(d));syncToFirebase(t,d);},
  perfiles:function(){return this.get('perfiles');},
  convs:function(){return this.get('convs');},
  cands:function(){return this.get('cands');},
  forms:function(){return this.get('forms');},
  resultados:function(){return this.get('resultados');},
  tests:function(){return this.get('tests');},
  sPerfiles:function(d){this.save('perfiles',d);},
  sConvs:function(d){this.save('convs',d);},
  sCands:function(d){this.save('cands',d);},
  sForms:function(d){this.save('forms',d);},
  sResultados:function(d){this.save('resultados',d);},
  sTests:function(d){this.save('tests',d);}
};

// ── FIRESTORE SYNC (tiempo real) ───────────────────────
var _fsTablas=['perfiles','convs','cands','resultados','tests'];

function syncToFirebase(tabla,datos){
  if(!fbfs)return;
  setSS('ing');
  fbfs.collection('rrhh').doc(tabla).set({items:datos})
    .then(function(){setSS('ok');})
    .catch(function(err){console.warn('Firestore sync:',err.message);setSS('err');});
}

function loadFromFirebase(){
  if(!fbfs){go(curPage);return;}
  var pending=_fsTablas.length;
  var ready=false;
  setSS('ing');

  _fsTablas.forEach(function(t){
    fbfs.collection('rrhh').doc(t).onSnapshot(
      function(doc){
        // Esta función se llama en el primer load Y en cada cambio remoto posterior
        if(doc.exists){
          var data=doc.data().items||[];
          localStorage.setItem('rrhh_'+t,JSON.stringify(data));
          DB._c[t]=data;
        }
        // Solo la primera ronda de snapshots dispara go(curPage)
        if(!ready){
          pending--;
          if(pending<=0){ready=true;setSS('ok');go(curPage);}
        }
      },
      function(err){
        console.warn('Firestore listener error:',t,err.message);
        if(!ready){pending--;if(pending<=0){ready=true;setSS('err');go(curPage);}}
      }
    );
  });

  // Fallback: si Firestore no responde en 7 s, abrimos igual con datos locales
  setTimeout(function(){if(!ready){ready=true;console.warn('Firestore timeout — usando datos locales');go(curPage);}},7000);
}

// Guardar TODOS los datos a Firestore (botón manual 💾)
function saveAll(){
  if(!fbfs){toast('Firestore no disponible','err');return;}
  setSS('ing');
  var batch=fbfs.batch();
  _fsTablas.forEach(function(t){
    batch.set(fbfs.collection('rrhh').doc(t),{items:DB.get(t)});
  });
  batch.commit()
    .then(function(){setSS('ok');toast('Guardado completo en Firestore','ok');})
    .catch(function(err){setSS('err');toast('Error al guardar: '+err.message,'err');});
}

// ── GITHUB SYNC (respaldo opcional) ─────────────────────
var _syncT={},_shas={};

function setSS(s){
  var el=document.getElementById('ss');if(!el)return;
  var cls={ok:'b-gn',ing:'b-yw',err:'b-rd',off:'so'};
  var lbl={ok:'&#10003; Sync',ing:'&#8635; Sync...',err:'&#9888; Error',off:'&#9679; Local'};
  el.className='bdg '+(cls[s]||'so');el.innerHTML=lbl[s]||s;
}
function schedSync(t){
  var c=getCfg();if(!c.tok||!c.own||!c.repo)return;
  clearTimeout(_syncT[t]);setSS('ing');
  _syncT[t]=setTimeout(function(){pushGH(t);},900);
}
function ghH(){var c=getCfg();return{'Authorization':'token '+c.tok,'Content-Type':'application/json','Accept':'application/vnd.github.v3+json'};}
function ghUrl(t){var c=getCfg();return'https://api.github.com/repos/'+c.own+'/'+c.repo+'/contents/rrhh_data/'+t+'.json';}
function pushGH(t){
  var c=getCfg();if(!c.tok||!c.own||!c.repo){setSS('off');return;}
  var body={message:'update '+t,content:btoa(unescape(encodeURIComponent(JSON.stringify(DB.get(t)))))};
  if(_shas[t])body.sha=_shas[t];
  fetch(ghUrl(t),{method:'PUT',headers:ghH(),body:JSON.stringify(body)})
    .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
    .then(function(res){if(res.ok){_shas[t]=res.j.content&&res.j.content.sha;setSS('ok');}else{setSS('err');toast('Error sync: '+(res.j.message||''),'err');}})
    .catch(function(){setSS('err');});
}
function pullGH(){
  var c=getCfg();if(!c.tok||!c.own||!c.repo)return Promise.resolve(false);
  setSS('ing');
  var tables=['perfiles','convs','cands'];
  var ps=tables.map(function(t){
    return fetch(ghUrl(t),{headers:ghH()}).then(function(r){
      if(r.ok)return r.json().then(function(j){
        _shas[t]=j.sha;
        var raw=decodeURIComponent(escape(atob(j.content.replace(/\n/g,''))));
        var d=JSON.parse(raw);
        localStorage.setItem('rrhh_'+t,JSON.stringify(d));DB._c[t]=d;return true;
      });
      else if(r.status===404){pushGH(t);return false;}
      return false;
    }).catch(function(){return false;});
  });
  return Promise.all(ps).then(function(rs){setSS(rs.some(Boolean)?'ok':'off');return rs.some(Boolean);});
}
function pullGHResultados(){
  var c=getCfg();if(!c.tok||!c.own||!c.repo)return;
  fetch(ghUrl('resultados'),{headers:ghH()}).then(function(r){
    if(r.ok)return r.json().then(function(j){
      _shas['resultados']=j.sha;
      var raw=decodeURIComponent(escape(atob(j.content.replace(/\n/g,''))));
      var d=JSON.parse(raw);
      localStorage.setItem('rrhh_resultados',JSON.stringify(d));DB._c['resultados']=d;
    });
    else if(r.status===404)pushGH('resultados');
  }).catch(function(){});
}
function syncNow(){
  // Fuerza guardado completo en Firestore + opcionalmente en GitHub
  saveAll();
  var c=getCfg();
  if(c.tok&&c.own&&c.repo){
    pullGH().then(function(ok){
      pullGHResultados();
      if(ok){toast('GitHub sincronizado','ok');go(curPage);}
      else{['perfiles','convs','cands'].forEach(pushGH);toast('Datos subidos a GitHub','ok');}
    });
  }
}
function testConn(){
  var c=getCfg();if(!c.tok||!c.own||!c.repo){toast('Completa los datos primero','w');return;}
  setSS('ing');
  fetch('https://api.github.com/repos/'+c.own+'/'+c.repo,{headers:ghH()})
    .then(function(r){if(r.ok){toast('Conexión exitosa','ok');setSS('ok');}else{toast('Error: verifica token y repo','err');setSS('err');}})
    .catch(function(){toast('Sin internet','err');setSS('err');});
}

// ── BACKUP ──────────────────────────────────────────
function exportBk(){
  var data={perfiles:DB.perfiles(),convs:DB.convs(),cands:DB.cands(),cfg:getCfg(),at:new Date().toISOString()};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='rrhh_backup_'+new Date().toISOString().split('T')[0]+'.json';a.click();
  toast('Backup descargado','ok');
}
function importBk(){
  var inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=function(e){
    var f=e.target.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(ev){
      try{
        var d=JSON.parse(ev.target.result);
        if(d.perfiles)DB.sPerfiles(d.perfiles);
        if(d.convs)DB.sConvs(d.convs);
        if(d.cands)DB.sCands(d.cands);
        toast('Datos restaurados','ok');go(curPage);
      }catch(err){toast('Archivo invalido','err');}
    };r.readAsText(f);
  };inp.click();
}

// ── INIT localStorage ────────────────────────────────
(function(){
  if(!localStorage.getItem('rrhh_forms'))localStorage.setItem('rrhh_forms','[]');
  if(!localStorage.getItem('rrhh_resultados'))localStorage.setItem('rrhh_resultados','[]');
  if(!localStorage.getItem('rrhh_tests'))localStorage.setItem('rrhh_tests','[]');
})();
