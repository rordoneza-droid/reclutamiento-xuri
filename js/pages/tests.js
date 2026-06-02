// ══════════════════════════════════════════════════════
// TESTS.JS — Gestión de tests de conocimiento por cargo
// ══════════════════════════════════════════════════════

var _qIdx = 0;

// ── PÁGINA PRINCIPAL ────────────────────────────────────
function pgTests() {
  var tests = DB.tests();
  var perfs = DB.perfiles();
  document.getElementById('tb-act').innerHTML =
    '<button class="btn bp bs" onclick="modalTest()">+ Nuevo Test</button>';

  if (!tests.length) {
    document.getElementById('ct').innerHTML =
      '<div class="al al-i">Los tests reemplazan las preguntas de <strong>Conocimientos del Cargo</strong> en la evaluación digital. Crea uno por cada tipo de vacante.</div>'
      + '<div class="es"><div class="es-ico">📝</div>'
      + '<h3>Sin tests creados</h3>'
      + '<p>Crea tests específicos para cada cargo (Vendedor, Bodeguero, Guardia, etc.)</p>'
      + '<button class="btn bp" onclick="modalTest()">+ Crear primer test</button></div>';
    return;
  }

  var html = '<div class="al al-i">Cada test se asocia a un <strong>Perfil de Cargo</strong>. Cuando un candidato haga la evaluación digital, verá automáticamente el test de su convocatoria.</div>';

  tests.forEach(function(t) {
    var perf = perfs.find(function(p) { return p.id === t.perfilId; });
    var nPregs = t.preguntas ? t.preguntas.length : 0;
    html += '<div class="card"><div class="cb">'
      + '<div class="flex jb ic" style="flex-wrap:wrap;gap:8px">'
      + '<div>'
      + '<div class="flex ic g2 mb2">'
      + '<strong style="font-size:15px">📝 ' + t.nombre + '</strong>'
      + (perf ? '<span class="bdg b-bl">' + perf.nombre + '</span>' : '<span class="bdg b-rd">Sin perfil</span>')
      + '</div>'
      + '<div class="tsm tgr">'
      + nPregs + ' preguntas · Creado: ' + (t.cre || '-')
      + (t.upd && t.upd !== t.cre ? ' · Actualizado: ' + t.upd : '')
      + '</div></div>'
      + '<div class="flex g2">'
      + '<button class="btn bo bxs" onclick="modalTest(\'' + t.id + '\')">✏️ Editar</button>'
      + '<button class="btn bo bxs" onclick="prevTest(\'' + t.id + '\')">👁 Vista previa</button>'
      + '<button class="btn bo bxs" onclick="delTest(\'' + t.id + '\')">🗑️</button>'
      + '</div></div>'
      + (nPregs === 0 ? '<div class="al al-w" style="margin-top:10px;margin-bottom:0">⚠️ Este test no tiene preguntas aún.</div>' : '')
      + '</div></div>';
  });

  document.getElementById('ct').innerHTML = html;
}

// ── MODAL CREAR / EDITAR ─────────────────────────────────
function modalTest(id) {
  var t   = id ? DB.tests().find(function(x) { return x.id === id; }) : null;
  var v   = t || { nombre: '', perfilId: '', preguntas: [] };
  var perfs = DB.perfiles();
  var pOpts = perfs.map(function(p) {
    return '<option value="' + p.id + '" ' + (v.perfilId === p.id ? 'selected' : '') + '>'
      + p.nombre + (p.area ? ' (' + p.area + ')' : '') + '</option>';
  }).join('');

  var body =
    '<div class="fr fr2">'
    + '<div class="fg"><label>Nombre del test <span class="rq">*</span></label>'
    + '<input id="test_n" value="' + v.nombre + '" placeholder="Ej: Test de Ventas, Test de Bodega..."></div>'
    + '<div class="fg"><label>Perfil de cargo asociado</label>'
    + '<select id="test_p"><option value="">— Sin asignar —</option>' + pOpts + '</select></div>'
    + '</div>'
    + '<div class="al al-i" style="margin-bottom:14px">Agrega las preguntas del test. Marca cuál es la respuesta correcta haciendo clic en ella.</div>'
    + '<div id="q_list"></div>'
    + '<button class="btn bo" onclick="addPregunta()" type="button" style="width:100%;margin-top:8px">+ Agregar pregunta</button>';

  openM(id ? 'Editar Test' : 'Nuevo Test', body,
    '<button class="btn bo" onclick="closeM()">Cancelar</button>'
    + '<button class="btn bp" onclick="saveTest(\'' + (id || '') + '\')">Guardar test</button>',
    true);

  setTimeout(function() {
    var list = document.getElementById('q_list');
    if (!list) return;
    if (v.preguntas && v.preguntas.length) {
      v.preguntas.forEach(function(q) {
        list.appendChild(qDomRow(q.txt, q.opts, q.correcta));
      });
    } else {
      list.appendChild(qDomRow('', ['', '', '', ''], 0));
    }
  }, 60);
}

// ── FILA DE PREGUNTA (DOM) ───────────────────────────────
function qDomRow(txt, opts, correcta) {
  _qIdx++;
  var idx = _qIdx;
  var d = document.createElement('div');
  d.className = 'q-row';
  d.setAttribute('data-idx', idx);
  d.style.cssText = 'background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;border:1px solid #e2e8f0';

  // Cabecera de la pregunta
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px';
  var numLabel = document.createElement('span');
  numLabel.style.cssText = 'font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b';
  numLabel.textContent = 'Pregunta';
  var delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn br bxs';
  delBtn.innerHTML = '✕ Eliminar';
  delBtn.onclick = function() {
    d.parentNode && d.parentNode.removeChild(d);
    actualizarNumeracion();
  };
  header.appendChild(numLabel);
  header.appendChild(delBtn);
  d.appendChild(header);

  // Texto de la pregunta
  var txtInp = document.createElement('input');
  txtInp.className = 'q-txt';
  txtInp.value = txt || '';
  txtInp.placeholder = 'Escribe la pregunta...';
  txtInp.style.cssText = 'margin-bottom:10px;font-weight:500';
  d.appendChild(txtInp);

  // Indicador de correcta
  var hint = document.createElement('div');
  hint.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:6px';
  hint.textContent = 'Haz clic en la opción correcta para marcarla:';
  d.appendChild(hint);

  // Grid de opciones
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';
  var letras = ['A', 'B', 'C', 'D'];

  (opts || ['', '', '', '']).forEach(function(optTxt, i) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;background:#fff;border:2px solid #e2e8f0;border-radius:8px;padding:8px 10px;cursor:pointer;transition:.15s';
    if (i === correcta) {
      row.style.borderColor = '#059669';
      row.style.background = '#f0fdf4';
    }

    var letra = document.createElement('span');
    letra.style.cssText = 'width:22px;height:22px;border-radius:6px;background:' + (i === correcta ? '#059669' : '#e2e8f0')
      + ';color:' + (i === correcta ? '#fff' : '#475569') + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0';
    letra.textContent = letras[i];

    var inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'q-opt';
    inp.value = optTxt || '';
    inp.placeholder = 'Opción ' + letras[i];
    inp.style.cssText = 'border:none;outline:none;background:none;font-size:13px;padding:0;flex:1;min-width:0';
    inp.onclick = function(e) { e.stopPropagation(); };

    // Radio oculto para rastrear la correcta
    var radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'correct_' + idx;
    radio.className = 'q-correct';
    radio.value = i;
    radio.checked = i === (correcta || 0);
    radio.style.display = 'none';

    row.appendChild(letra);
    row.appendChild(inp);
    row.appendChild(radio);

    // Clic en la fila → marcar como correcta
    row.onclick = function() {
      grid.querySelectorAll('div').forEach(function(r, ri) {
        var isThis = r === row;
        var l = r.querySelector('span');
        var rd = r.querySelector('input[type=radio]');
        if (l) l.style.background = isThis ? '#059669' : '#e2e8f0';
        if (l) l.style.color = isThis ? '#fff' : '#475569';
        r.style.borderColor = isThis ? '#059669' : '#e2e8f0';
        r.style.background = isThis ? '#f0fdf4' : '#fff';
        if (rd) rd.checked = isThis;
      });
    };

    grid.appendChild(row);
  });

  d.appendChild(grid);
  return d;
}

function actualizarNumeracion() {
  document.querySelectorAll('.q-row').forEach(function(row, i) {
    var lbl = row.querySelector('span');
    if (lbl) lbl.textContent = 'Pregunta ' + (i + 1);
  });
}

// ── AGREGAR PREGUNTA ────────────────────────────────────
function addPregunta() {
  var list = document.getElementById('q_list');
  if (!list) return;
  list.appendChild(qDomRow('', ['', '', '', ''], 0));
  actualizarNumeracion();
  list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── GUARDAR TEST ────────────────────────────────────────
function saveTest(id) {
  var nombre   = (document.getElementById('test_n') || {}).value || '';
  var perfilId = (document.getElementById('test_p') || {}).value || '';
  if (!nombre.trim()) { toast('El nombre es requerido', 'err'); return; }

  var preguntas = [];
  document.querySelectorAll('.q-row').forEach(function(row) {
    var txt = (row.querySelector('.q-txt') || {}).value || '';
    if (!txt.trim()) return;
    var opts = [];
    row.querySelectorAll('.q-opt').forEach(function(inp) { opts.push(inp.value.trim()); });
    var correcta = 0;
    row.querySelectorAll('.q-correct').forEach(function(r, i) { if (r.checked) correcta = i; });
    preguntas.push({ txt: txt.trim(), opts: opts, correcta: correcta });
  });

  if (!preguntas.length) { toast('Agrega al menos una pregunta', 'err'); return; }

  var existing = id ? DB.tests().find(function(x) { return x.id === id; }) : null;
  var t = {
    id: id || uid(),
    nombre: nombre.trim(),
    perfilId: perfilId,
    preguntas: preguntas,
    upd: today(),
    cre: existing ? existing.cre || today() : today()
  };

  DB.sTests(DB.tests().filter(function(x) { return x.id !== t.id; }).concat([t]));
  closeM();
  toast('Test guardado (' + preguntas.length + ' preguntas)', 'ok');
  pgTests();
}

// ── ELIMINAR TEST ───────────────────────────────────────
function delTest(id) {
  if (!confirm('¿Eliminar este test?')) return;
  DB.sTests(DB.tests().filter(function(x) { return x.id !== id; }));
  toast('Test eliminado', 'ok');
  pgTests();
}

// ── VISTA PREVIA ────────────────────────────────────────
function prevTest(id) {
  var t = DB.tests().find(function(x) { return x.id === id; });
  if (!t) return;
  var letras = ['A', 'B', 'C', 'D'];
  var html = '<div class="al al-i"><strong>' + t.nombre + '</strong> · ' + t.preguntas.length + ' preguntas</div>';
  t.preguntas.forEach(function(p, i) {
    html += '<div style="margin-bottom:14px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">'
      + '<div style="font-weight:600;margin-bottom:8px;font-size:13px">' + (i + 1) + '. ' + p.txt + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'
      + (p.opts || []).map(function(o, oi) {
          var isCorr = oi === p.correcta;
          return '<div style="padding:7px 10px;border-radius:6px;font-size:12px;border:2px solid '
            + (isCorr ? '#059669' : '#e2e8f0') + ';background:' + (isCorr ? '#f0fdf4' : '#fff') + '">'
            + '<strong style="color:' + (isCorr ? '#059669' : '#64748b') + '">' + letras[oi] + '.</strong> ' + o
            + (isCorr ? ' ✓' : '')
            + '</div>';
        }).join('')
      + '</div></div>';
  });
  openM('Vista previa: ' + t.nombre, html,
    '<button class="btn bo" onclick="closeM()">Cerrar</button>'
    + '<button class="btn bp" onclick="closeM();modalTest(\'' + id + '\')">✏️ Editar</button>', true);
}
