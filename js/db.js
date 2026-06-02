// ══════════════════════════════════════════════════════
// DB.JS — Base de datos local + Firebase + GitHub + Backup
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
  sPerfiles:function(d){this.save('perfiles',d);},
  sConvs:function(d){this.save('convs',d);},
  sCands:function(d){this.save('cands',d);},
  sForms:function(d){this.save('forms',d);},
  sResultados:function(d){this.save('resultados',d);}
};

// ── FIREBASE SYNC ───────────────────────────────────
function syncToFirebase(tabla,datos){
  if(!fbdb)return;
  try{fbdb.ref('rrhh/'+tabla).set(datos).catch(function(err){console.warn('Firebase sync:',err.message);});}
  catch(e){console.warn('Firebase error:',e);}
}

function loadFromFirebase(){
  if(!fbdb){go(curPage);return;}
  try{
    fbdb.ref('rrhh').get().then(function(snapshot){
      var data=snapshot.val();
      if(data){
        ['perfiles','convs','cands','forms','resultados'].forEach(function(t){
          if(data[t]){localStorage.setItem('rrhh_'+t,JSON.stringify(data[t]));DB._c[t]=data[t];}
        });
        console.log('✓ Firebase OK');
      }
      go(curPage);
    }).catch(function(err){console.warn('Firebase load:',err.message);go(curPage);});
  }catch(e){console.warn('Firebase error:',e);go(curPage);}
}

// ── GITHUB SYNC ─────────────────────────────────────
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
function pullGHForms(){
  var c=getCfg();if(!c.tok||!c.own||!c.repo)return;
  ['forms','resultados'].forEach(function(t){
    fetch(ghUrl(t),{headers:ghH()}).then(function(r){
      if(r.ok)return r.json().then(function(j){
        _shas[t]=j.sha;
        var raw=decodeURIComponent(escape(atob(j.content.replace(/\n/g,''))));
        var d=JSON.parse(raw);
        localStorage.setItem('rrhh_'+t,JSON.stringify(d));DB._c[t]=d;
      });
      else if(r.status===404)pushGH(t);
    }).catch(function(){});
  });
}
function syncNow(){
  pullGH().then(function(ok){
    pullGHForms();
    if(ok){toast('Datos cargados de GitHub','ok');go(curPage);}
    else{['perfiles','convs','cands'].forEach(pushGH);toast('Datos subidos a GitHub','ok');}
  });
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
})();
