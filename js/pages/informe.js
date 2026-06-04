// ══════════════════════════════════════════════════════
// INFORME.JS — Informe Final con ranking, scores y PDF
// ══════════════════════════════════════════════════════

var infC = '';
var _infScores = []; // cache del ranking actual

// ── CALCULAR SCORE DE UN CANDIDATO ─────────────────────
function calcScore(candId) {
  var resultados = DB.resultados();
  var res = resultados.filter(function(r) { return r.candId === candId; });

  var big5  = res.find(function(r) { return r.tipo === 'big5'; });
  var scl   = res.find(function(r) { return r.tipo === 'scl' || r.tipo === 'screening'; });
  var cargo = res.find(function(r) { return r.tipo === 'cargo'; });

  // ── Big5: dims {E,A,C,N,O} escala 1-5 → 0-100 (N invertido)
  var big5Score = null;
  var big5Dims  = null;
  if (big5 && big5.dims) {
    var dv = big5.dims;
    var b5 = {
      E: Math.round((dv.E - 1) / 4 * 100),
      A: Math.round((dv.A - 1) / 4 * 100),
      C: Math.round((dv.C - 1) / 4 * 100),
      N: Math.round((5 - dv.N) / 4 * 100),
      O: Math.round((dv.O - 1) / 4 * 100)
    };
    big5Dims  = b5;
    big5Score = Math.round((b5.E + b5.A + b5.C + b5.N + b5.O) / 5);
  }

  // ── SCL: escala 0-4, mayor=peor → invertir a 0-100
  var sclScore = null;
  var sclFlags = [];
  var SCL_UMBRAL_LOCAL = { SOM:1.2, ANS:1.0, DEP:1.2, HOS:1.2, PAR:1.0, PSI:0.6, OBS:1.2, SIN:1.2 };
  var SCL_NOMBRES = { SOM:'Somatización', ANS:'Ansiedad', DEP:'Depresión', HOS:'Hostilidad',
                      PAR:'Paranoia', PSI:'Psicoticismo', OBS:'Obsesión', SIN:'Sens.Interpersonal' };
  if (scl) {
    var sd = scl.dims;
    if (!sd && scl.resps && scl.resps.length) {
      var sg = {};
      scl.resps.forEach(function(r) {
        if (!sg[r.dim]) sg[r.dim] = [];
        var v = r.val || 0;
        sg[r.dim].push(v > 4 ? v - 1 : v);
      });
      sd = {};
      Object.keys(sg).forEach(function(d) {
        sd[d] = Math.round(sg[d].reduce(function(s, v) { return s + v; }, 0) / sg[d].length * 10) / 10;
      });
    }
    if (sd) {
      var sv = Object.keys(sd).map(function(k) { return sd[k]; });
      if (sv.length) {
        var sa = sv.reduce(function(s, v) { return s + v; }, 0) / sv.length;
        sclScore = Math.max(0, Math.round(100 - sa * 25));
      }
      Object.keys(sd).forEach(function(d) {
        if (sd[d] >= (SCL_UMBRAL_LOCAL[d] || 1.0)) sclFlags.push(SCL_NOMBRES[d] || d);
      });
    }
  }

  // ── Cargo: puntaje real o calculado
  var cargoScore   = null;
  var cargoCorr    = null;
  var cargoTotal   = null;
  if (cargo) {
    if (cargo.puntaje != null) {
      cargoScore = cargo.puntaje;
    } else if (cargo.resps && cargo.resps.length) {
      var cr = cargo.resps.filter(function(r) { return parseInt(r.resp) === r.correcta; }).length;
      cargoScore = Math.round(cr / cargo.resps.length * 100);
      cargoCorr  = cr;
      cargoTotal = cargo.resps.length;
    }
    if (cargoScore != null && cargoCorr == null && cargo.resps) {
      cargoCorr  = cargo.resps.filter(function(r) { return parseInt(r.resp) === r.correcta; }).length;
      cargoTotal = cargo.resps.length;
    }
  }

  // ── Entrevista HR (guardada en el candidato, no en resultados)
  var entScore    = null;
  var entRec      = null;
  var entIsSystem = false;
  var cand = DB.cands().find(function(c) { return c.id === candId; });
  if (cand && cand.entrevistas && cand.entrevistas.length) {
    entScore = cand.puntajeEntrevista != null
      ? cand.puntajeEntrevista
      : Math.round(cand.entrevistas.reduce(function(s, e) { return s + e.puntaje; }, 0) / cand.entrevistas.length);
    var lastEnt = cand.entrevistas[cand.entrevistas.length - 1];
    entRec = lastEnt.rec || 'pendiente';
    var rm = { recomendar: 90, reserva: 65, 'no recomendar': 25, pendiente: 70 };
    entScore = rm[entRec] != null ? rm[entRec] : entScore;
  }

  // ── Puntaje total — solo tests digitales (entrevista humana no altera el score base)
  var ptos = [];
  if (big5Score  != null) ptos.push(big5Score);
  if (sclScore   != null) ptos.push(sclScore);
  if (cargoScore != null) ptos.push(cargoScore);
  if (entScore   != null) ptos.push(entScore);
  var score = ptos.length ? Math.round(ptos.reduce(function(a, b) { return a + b; }, 0) / ptos.length) : 0;

  // ── Si no hay entrevista RRHH, el sistema genera la evaluación automáticamente
  if (entScore == null && ptos.length > 0) {
    entIsSystem = true;
    entScore    = score;
    entRec      = score >= 75 ? 'recomendar' : score >= 55 ? 'reserva' : 'no recomendar';
  }

  // Completo = tiene al menos los 3 tests digitales
  var completo = !!(big5 && scl && cargo);

  return {
    hasBig5: !!big5,   big5Score: big5Score,   big5Dims: big5Dims,
    hasScl:  !!scl,    sclScore:  sclScore,    sclFlags: sclFlags,
    hasCargo:!!cargo,  cargoScore:cargoScore,  cargoCorr:cargoCorr, cargoTotal:cargoTotal,
    hasEnt:  entScore != null, entScore: entScore, entRec: entRec, entIsSystem: entIsSystem,
    score: score, completo: completo, testsCount: ptos.length
  };
}

// ── HELPERS VISUALES ────────────────────────────────────
function barColor(s) { return s >= 75 ? '#059669' : s >= 50 ? '#d97706' : '#dc2626'; }
function barHtml(s, label) {
  if (s == null) return '<span style="color:#94a3b8;font-size:11px">—</span>';
  var c = barColor(s);
  return '<div style="margin-bottom:6px">'
    + '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">'
    + '<span style="color:#475569;font-weight:600">' + label + '</span>'
    + '<span style="font-weight:800;color:' + c + '">' + s + '%</span></div>'
    + '<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">'
    + '<div style="width:' + s + '%;height:100%;background:' + c + ';border-radius:3px;transition:width .5s"></div>'
    + '</div></div>';
}

// ── PÁGINA INFORME ──────────────────────────────────────
function pgInforme() {
  var convs  = DB.convs();
  var cands  = DB.cands();
  var opts   = convs.map(function(c) {
    return '<option value="' + c.id + '" ' + (infC === c.id ? 'selected' : '') + '>' + c.titulo + '</option>';
  }).join('');

  var body = '';

  if (infC) {
    var conv         = convs.find(function(c) { return c.id === infC; });
    var candsPorConv = cands.filter(function(c) { return c.convocatoriaId === infC; });
    var vacantes     = conv ? conv.vacantes : 1;

    // Calcular scores para todos
    var scores = candsPorConv.map(function(c) {
      var sc = calcScore(c.id);
      sc.id     = c.id;
      sc.nombre = c.apellidos + ', ' + c.nombres;
      sc.ciudad = c.ciudad || '-';
      sc.etapa  = c.etapa;
      return sc;
    }).sort(function(a, b) { return b.score - a.score; });

    _infScores = scores; // guardar para verDetalleCandidato

    var conDatos  = scores.filter(function(s) { return s.testsCount > 0; });
    var sinDatos  = scores.filter(function(s) { return s.testsCount === 0; });

    // ── STATS ─────────────────────────────────────
    var html = '<div class="sg">'
      + '<div class="sc bl"><div class="sl">Vacantes</div><div class="sv">' + vacantes + '</div></div>'
      + '<div class="sc"><div class="sl">Candidatos</div><div class="sv">' + candsPorConv.length + '</div></div>'
      + '<div class="sc gn"><div class="sl">Con tests</div><div class="sv">' + conDatos.length + '</div></div>'
      + '<div class="sc ' + (sinDatos.length ? 'rd' : 'gn') + '"><div class="sl">Sin datos</div><div class="sv">' + sinDatos.length + '</div></div>'
      + '</div>'
      + htmlResumenContratacion(conDatos, vacantes);

    // ── BOTÓN PDF ──────────────────────────────────
    html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin:20px 0 14px">'
      + '<h2 style="font-size:17px;font-weight:800;color:#1e293b">📊 Ranking de candidatos</h2>'
      + '<button class="btn bo" onclick="generarPDF()">🖨️ Generar PDF</button>'
      + '</div>';

    // ── TABLA DE RANKING ───────────────────────────
    if (!conDatos.length) {
      html += '<div class="al al-w">Ningún candidato ha completado los tests aún. Usa el botón "Abrir Evaluación Digital" en Selección.</div>';
    } else {
      html += '<div class="card"><div class="cb" style="padding:0"><div class="tw"><table style="font-size:13px">'
        + '<thead><tr><th style="width:36px">#</th><th>Candidato</th>'
        + '<th style="text-align:center">Big5</th><th style="text-align:center">SCL</th>'
        + '<th style="text-align:center">Cargo</th><th style="text-align:center">Total</th>'
        + '<th style="text-align:center">Decisión</th><th></th></tr></thead><tbody>';

      conDatos.forEach(function(s, i) {
        var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
        var tipo  = i < vacantes ? 'ganador' : i < vacantes * 2 ? 'suplente' : 'otro';
        var decLabel = { ganador:'✓ Contratar', suplente:'Suplente', otro:'-' }[tipo];
        var decCls   = { ganador:'b-gn',        suplente:'b-yw',     otro:'b-gr' }[tipo];
        var rowBg    = i === 0 ? 'background:#f0fdf4' : i < vacantes ? 'background:#f7fef9' : '';

        function chip(v) {
          if (v == null) return '<span style="color:#cbd5e1">—</span>';
          return '<span style="font-weight:700;color:' + barColor(v) + '">' + v + '%</span>';
        }

        html += '<tr style="' + rowBg + '">'
          + '<td style="text-align:center;font-size:15px">' + medal + '</td>'
          + '<td><strong>' + s.nombre + '</strong><br><span style="font-size:11px;color:#94a3b8">' + s.ciudad + '</span></td>'
          + '<td style="text-align:center">' + chip(s.big5Score) + '</td>'
          + '<td style="text-align:center">' + chip(s.sclScore) + '</td>'
          + '<td style="text-align:center">' + chip(s.cargoScore) + '</td>'
          + '<td style="text-align:center;font-size:16px;font-weight:900;color:' + barColor(s.score) + '">' + s.score + '%</td>'
          + '<td style="text-align:center"><span class="bdg ' + decCls + '" style="font-size:11px">' + decLabel + '</span></td>'
          + '<td><button class="btn bo bxs" onclick="verDetalleCandidato(\'' + s.id + '\')">👁 Ver</button></td>'
          + '</tr>';
      });

      html += '</tbody></table></div></div></div>';

      // Sin datos al pie de la tabla
      if (sinDatos.length) {
        html += '<div style="font-size:12px;color:#dc2626;margin-top:8px;padding:8px 12px;background:#fff1f2;border-radius:8px">'
          + '⚠️ Sin datos de tests: '
          + sinDatos.map(function(c) { return '<strong>' + c.nombre + '</strong>'; }).join(', ')
          + '</div>';
      }
    }

    body = html;
  }

  document.getElementById('ct').innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">'
    + '<div class="fg" style="margin:0;flex:1;min-width:200px;max-width:400px">'
    + '<label>Convocatoria</label>'
    + '<select onchange="infC=this.value;pgInforme()">'
    + '<option value="">— Seleccionar —</option>' + DB.convs().map(function(c) {
        return '<option value="' + c.id + '" ' + (infC === c.id ? 'selected' : '') + '>' + c.titulo + '</option>';
      }).join('')
    + '</select></div></div>'
    + (body || (!infC
        ? '<div class="es"><div class="es-ico">📄</div><h3>Selecciona una convocatoria</h3><p>Los resultados de los tests aparecerán aquí.</p></div>'
        : ''));
}

// ── TARJETA DE CANDIDATO ─────────────────────────────────
function tarjetaCandidato(g, puesto, tipo) {
  var borderColor = tipo === 'ganador' ? '#059669' : tipo === 'suplente' ? '#d97706' : '#94a3b8';
  var scoreColor  = tipo === 'ganador' ? '#059669' : tipo === 'suplente' ? '#d97706' : '#64748b';

  var badgeHtml = '';
  if (tipo === 'ganador') badgeHtml = '<span class="bdg b-gn">✓ Puesto ' + puesto + '</span>';
  else if (tipo === 'suplente') badgeHtml = '<span class="bdg b-yw">Suplente ' + puesto + '</span>';

  var sclHtml = '';
  if (g.hasScl) {
    sclHtml = g.sclFlags.length
      ? g.sclFlags.map(function(f) { return '<span class="bdg b-rd" style="margin:1px;font-size:10px">⚠ ' + f + '</span>'; }).join('')
      : '<span class="bdg b-gn" style="font-size:10px">✓ Sin alertas</span>';
  }

  var big5DimsHtml = '';
  if (g.big5Dims) {
    var dimNames = { E: 'Extraversión', A: 'Amabilidad', C: 'Responsabilidad', N: 'Est.Emocional', O: 'Apertura' };
    big5DimsHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;margin-top:8px">';
    ['E', 'A', 'C', 'N', 'O'].forEach(function(d) {
      var v = g.big5Dims[d];
      big5DimsHtml += '<div>' + barHtml(v, dimNames[d]) + '</div>';
    });
    big5DimsHtml += '</div>';
  }

  var cargoDetail = '';
  if (g.hasCargo && g.cargoCorr != null) {
    cargoDetail = '<span style="font-size:11px;color:#64748b;margin-left:6px">(' + g.cargoCorr + '/' + g.cargoTotal + ' correctas)</span>';
  }

  return '<div class="card" style="border-left:4px solid ' + borderColor + ';margin-bottom:14px">'
    + '<div class="cb">'

    // Cabecera
    + '<div class="flex jb ic mb3" style="flex-wrap:wrap;gap:8px">'
    + '<div>' + badgeHtml
    + '<h3 style="font-size:16px;font-weight:800;margin-top:6px">' + g.nombre + '</h3>'
    + '<span class="tgr txs">' + g.ciudad + '</span></div>'
    + '<div style="text-align:right">'
    + '<div style="font-size:32px;font-weight:900;color:' + scoreColor + '">' + g.score + '%</div>'
    + '<div class="txs tgr">Puntaje total</div>'
    + '</div></div>'

    // Barra total
    + '<div style="margin-bottom:16px">' + barHtml(g.score, 'Promedio general') + '</div>'

    // Scores por test (3 columnas: Big5, SCL, Cargo)
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:16px">'

    // Big5
    + '<div style="background:#f8fafc;border-radius:8px;padding:12px">'
    + '<div style="font-size:11px;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">🧠 Personalidad (Big Five)</div>'
    + (g.hasBig5 ? barHtml(g.big5Score, 'Puntaje global') + big5DimsHtml : '<span class="tgr txs">Sin datos</span>')
    + '</div>'

    // SCL
    + '<div style="background:#f8fafc;border-radius:8px;padding:12px">'
    + '<div style="font-size:11px;font-weight:800;color:#d97706;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">💭 Bienestar Psicológico</div>'
    + (g.hasScl ? barHtml(g.sclScore, 'Puntaje SCL') + '<div style="margin-top:8px">' + sclHtml + '</div>'
                : '<span class="tgr txs">Sin datos</span>')
    + '</div>'

    // Cargo
    + '<div style="background:#f8fafc;border-radius:8px;padding:12px">'
    + '<div style="font-size:11px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">📚 Conocimientos del Cargo</div>'
    + (g.hasCargo ? barHtml(g.cargoScore, 'Respuestas correctas') + cargoDetail
                  : '<span class="tgr txs">Sin datos</span>')
    + '</div>'

    + '</div>' // grid tests

    // Decisión y análisis del sistema
    + htmlOpinion(g)

    // Comentarios del evaluador (ficha + entrevista virtual)
    + (function() {
        var cr = DB.cands().find(function(c) { return c.id === g.id; });
        if (!cr || !cr.entrevistas || !cr.entrevistas.length) return '';
        var fichaEval  = cr.entrevistas.find(function(e) { return e.tipo === 'Ficha'; });
        var virtEval   = cr.entrevistas.slice().reverse().find(function(e) { return e.tipo === 'Virtual'; });
        var bloques = [];
        if (fichaEval && fichaEval.opinion) {
          bloques.push('<div style="background:#f5f3ff;border-left:3px solid #7c3aed;border-radius:8px;padding:12px;margin-bottom:8px">'
            + '<div style="font-size:11px;font-weight:700;color:#7c3aed;margin-bottom:5px">📋 Evaluación de Ficha (Datos Personales)'
            + (fichaEval.notaSobre10 != null ? ' · <strong>' + fichaEval.notaSobre10 + '/10</strong> (' + fichaEval.puntaje + '%)' : '')
            + (fichaEval.rec ? ' · ' + ({recomendar:'✅',reserva:'⚠️','no recomendar':'❌'}[fichaEval.rec]||'') : '')
            + '</div>'
            + '<div style="font-size:13px;color:#334155;line-height:1.65;white-space:pre-wrap">' + fichaEval.opinion + '</div>'
            + '</div>');
        }
        if (virtEval && virtEval.opinion) {
          bloques.push('<div style="background:#eff6ff;border-left:3px solid #4f46e5;border-radius:8px;padding:12px;margin-bottom:8px">'
            + '<div style="font-size:11px;font-weight:700;color:#4f46e5;margin-bottom:5px">🎤 Entrevista Virtual'
            + (virtEval.notaSobre10 != null ? ' · <strong>' + virtEval.notaSobre10 + '/10</strong> (' + virtEval.puntaje + '%)' : '')
            + (virtEval.fecha ? ' · ' + virtEval.fecha : '')
            + '</div>'
            + '<div style="font-size:13px;color:#334155;line-height:1.65;white-space:pre-wrap">' + virtEval.opinion + '</div>'
            + '</div>');
        }
        if (!bloques.length) return '';
        return '<div style="border-top:1px solid #e2e8f0;margin-top:14px;padding-top:14px">'
          + '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:10px">💬 Comentarios del evaluador</div>'
          + bloques.join('')
          + '</div>';
      })()

    + '</div></div>'; // cb + card
}

// ── VER DETALLE INDIVIDUAL ───────────────────────────────
function verDetalleCandidato(candId) {
  var g = _infScores.find(function(s) { return s.id === candId; });
  if (!g) return;

  // Determinar tipo y puesto en el ranking
  var conv    = DB.convs().find(function(c) { return c.id === infC; });
  var vacantes = conv ? conv.vacantes : 1;
  var idx     = _infScores.filter(function(s) { return s.testsCount > 0; }).findIndex(function(s) { return s.id === candId; });
  var tipo    = idx < vacantes ? 'ganador' : idx < vacantes * 2 ? 'suplente' : 'otro';
  var puesto  = tipo === 'ganador' ? idx + 1 : tipo === 'suplente' ? idx - vacantes + 1 : null;

  // Navegación anterior / siguiente entre candidatos con datos
  var conDatos = _infScores.filter(function(s) { return s.testsCount > 0; });
  var posActual = conDatos.findIndex(function(s) { return s.id === candId; });
  var prevId   = posActual > 0 ? conDatos[posActual - 1].id : null;
  var nextId   = posActual < conDatos.length - 1 ? conDatos[posActual + 1].id : null;

  var navHtml = '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:8px;flex-wrap:wrap">'
    + (prevId
        ? '<button class="btn bo" onclick="closeM();verDetalleCandidato(\'' + prevId + '\')">← Anterior</button>'
        : '<span></span>')
    + '<div style="display:flex;gap:8px">'
    + '<button class="btn bo" onclick="verFichaCandidato(\'' + candId + '\')">📋 Ver Ficha</button>'
    + '<button class="btn bo" onclick="generarPDFCandidato(\'' + candId + '\')">🖨️ PDF</button>'
    + '</div>'
    + (nextId
        ? '<button class="btn bo" onclick="closeM();verDetalleCandidato(\'' + nextId + '\')">Siguiente →</button>'
        : '<span></span>')
    + '</div>';

  openM(
    (idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (posActual + 1) + '.') + ' ' + g.nombre,
    tarjetaCandidato(g, puesto, tipo),
    navHtml,
    true
  );
}

// ── VER FICHA DEL CANDIDATO (respuestas del último módulo del test) ──────────
function verFichaCandidato(candId) {
  var ficha = DB.resultados().find(function(r) { return r.candId === candId && r.tipo === 'ficha_candidato'; });
  if (!ficha || !ficha.resps || !ficha.resps.length) {
    toast('Este candidato no tiene la ficha completada', 'err'); return;
  }
  var cand  = DB.cands().find(function(c) { return c.id === candId; });
  var nombre = cand ? cand.apellidos + ', ' + cand.nombres : 'Candidato';

  var html = '<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border-radius:12px;'
    + 'padding:18px 20px;margin-bottom:20px;text-align:center">'
    + '<div style="font-size:36px;margin-bottom:6px">👤</div>'
    + '<div style="font-size:16px;font-weight:800;margin-bottom:2px">Datos Personales</div>'
    + '<div style="font-size:13px;opacity:.8">' + nombre + ' · ' + ficha.resps.length + ' preguntas</div>'
    + '</div>';

  ficha.resps.forEach(function(r, i) {
    var tiene = r.resp && r.resp.trim();
    html += '<div style="margin-bottom:14px;padding:14px 16px;background:#f8fafc;border-radius:10px;'
      + 'border-left:3px solid ' + (tiene ? '#7c3aed' : '#e2e8f0') + '">'
      + '<div style="font-size:11px;font-weight:800;color:#7c3aed;text-transform:uppercase;'
      + 'letter-spacing:.04em;margin-bottom:5px">Pregunta ' + (i + 1) + '</div>'
      + '<div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:8px">' + r.txt + '</div>'
      + '<div style="font-size:14px;color:#1e293b;line-height:1.65;white-space:pre-wrap">'
      + (tiene ? r.resp : '<span style="color:#94a3b8;font-style:italic">Sin respuesta</span>')
      + '</div></div>';
  });

  openM('📋 Ficha — ' + nombre, html,
    '<div style="display:flex;justify-content:space-between;align-items:center;width:100%">'
    + '<button class="btn bo" onclick="closeM()">Cerrar</button>'
    + '<button class="btn bp" onclick="generarPDFFicha(\'' + candId + '\')">🖨️ PDF Ficha</button>'
    + '</div>',
    true);
}

// ── PDF DE LA FICHA ──────────────────────────────────────
function generarPDFFicha(candId) {
  var conv  = DB.convs().find(function(c) { return c.id === infC; });
  var cand  = DB.cands().find(function(c) { return c.id === candId; });
  var ficha = DB.resultados().find(function(r) { return r.candId === candId && r.tipo === 'ficha_candidato'; });
  if (!ficha || !ficha.resps || !ficha.resps.length) { toast('Sin datos de ficha', 'err'); return; }

  var cfg    = getCfg();
  var empresa= cfg.empresa || '[EMPRESA]';
  var fecha  = new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });
  var nombre = cand ? cand.apellidos + ', ' + cand.nombres : 'Candidato';

  var rows = ficha.resps.map(function(r, i) {
    var tiene = r.resp && r.resp.trim();
    return '<tr>'
      + '<td style="width:45%;background:#f8fafc;font-weight:600;vertical-align:top;padding:10px 12px">'
      + '<span style="font-size:9px;color:#7c3aed;font-weight:800;text-transform:uppercase;display:block;margin-bottom:3px">P' + (i+1) + '</span>'
      + r.txt + '</td>'
      + '<td style="vertical-align:top;padding:10px 12px;line-height:1.6">'
      + (tiene ? r.resp : '<span style="color:#94a3b8;font-style:italic">Sin respuesta</span>')
      + '</td></tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<title>Ficha — ' + nombre + '</title>'
    + '<style>'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b}'
    + '.page{width:21cm;min-height:29.7cm;margin:0 auto;padding:1.5cm 2cm}'
    + '.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #7c3aed;padding-bottom:12px;margin-bottom:18px}'
    + '.sec{font-size:11px;font-weight:700;color:#7c3aed;border-bottom:1px solid #e9d5ff;padding-bottom:4px;margin:16px 0 10px;text-transform:uppercase;letter-spacing:.05em}'
    + 'table{width:100%;border-collapse:collapse;font-size:12px}'
    + 'td{padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}'
    + '.firmas{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}'
    + '.firma-line{border-bottom:1px solid #334155;height:50px;margin-bottom:8px}'
    + '.footer{margin-top:16px;font-size:9px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;padding-top:6px}'
    + '@media print{body{padding:0}.page{margin:0;padding:1.2cm 1.8cm}}'
    + '</style></head><body><div class="page">'

    + '<div class="hdr">'
    + '<div><div style="font-size:18px;font-weight:900;color:#7c3aed">' + empresa + '</div>'
    + '<div style="font-size:10px;color:#64748b;margin-top:2px">' + (cfg.ruc ? 'RUC: ' + cfg.ruc : '') + (cfg.ciudad ? ' · ' + cfg.ciudad : '') + '</div></div>'
    + '<div style="text-align:right">'
    + '<div style="font-size:13px;font-weight:700">FICHA DEL CANDIDATO</div>'
    + (conv ? '<div style="background:#f5f3ff;color:#6d28d9;padding:3px 12px;border-radius:4px;font-weight:700;font-size:11px;margin-top:5px">' + conv.titulo + '</div>' : '')
    + '<div style="font-size:10px;color:#64748b;margin-top:4px">' + fecha + '</div>'
    + '</div></div>'

    + '<div class="sec">1. Datos del candidato</div>'
    + '<table>'
    + '<tr><td style="background:#f8fafc;font-weight:700;width:35%">Nombre completo</td><td><strong>' + nombre + '</strong></td></tr>'
    + (cand && cand.ciudad ? '<tr><td style="background:#f8fafc;font-weight:700">Ciudad</td><td>' + cand.ciudad + '</td></tr>' : '')
    + '<tr><td style="background:#f8fafc;font-weight:700">Fecha de evaluación</td><td>' + (ficha.fecha || fecha) + '</td></tr>'
    + '</table>'

    + '<div class="sec">2. Respuestas de la Ficha</div>'
    + '<table>' + rows + '</table>'

    + '<div class="firmas">'
    + '<div><div class="firma-line"></div><div style="font-weight:700;font-size:11px">' + (cfg.dirRRHH || '______________________________') + '</div><div style="font-size:10px;color:#64748b">Director de RRHH</div></div>'
    + '<div><div class="firma-line"></div><div style="font-weight:700;font-size:11px">' + nombre + '</div><div style="font-size:10px;color:#64748b">Candidato</div></div>'
    + '</div>'

    + '<div class="footer">' + empresa + ' | ' + nombre + ' | ' + fecha + ' | CONFIDENCIAL</div>'
    + '</div>'
    + '<script>window.onload=function(){window.print();}<\/script>'
    + '</body></html>';

  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ── PDF INDIVIDUAL POR CANDIDATO ─────────────────────────
function generarPDFCandidato(candId) {
  var conv = DB.convs().find(function(c) { return c.id === infC; });
  if (!conv) { toast('Selecciona una convocatoria', 'err'); return; }

  var cand = DB.cands().find(function(c) { return c.id === candId; });
  if (!cand) return;

  var g = _infScores.find(function(s) { return s.id === candId; });
  if (!g) { g = calcScore(candId); g.nombre = cand.apellidos + ', ' + cand.nombres; g.ciudad = cand.ciudad || '-'; }

  var cfg      = getCfg();
  var empresa  = cfg.empresa || '[EMPRESA]';
  var fecha    = new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });
  var vacantes = conv.vacantes || 1;

  // Posición en ranking
  var conDatos = _infScores.filter(function(s) { return s.testsCount > 0; });
  var pos      = conDatos.findIndex(function(s) { return s.id === candId; });
  var tipo     = pos < vacantes ? 'ganador' : pos < vacantes * 2 ? 'suplente' : 'otro';
  var medalTxt = pos === 0 ? '🥇 Puesto 1 — RECOMENDADO' : pos === 1 ? '🥈 Puesto 2' : pos === 2 ? '🥉 Puesto 3' : 'Puesto ' + (pos + 1);
  var decColor = tipo === 'ganador' ? '#059669' : tipo === 'suplente' ? '#d97706' : '#64748b';

  // Análisis
  var dec  = decisionFinal(g);
  var b5a  = analizarBig5(g.big5Dims, g.big5Score);
  var scla = analizarSCL(g.sclScore, g.sclFlags);
  var cga  = analizarCargo(g.cargoScore, g.cargoCorr, g.cargoTotal);

  // Entrevista
  var entHtml = '';
  var candObj = DB.cands().find(function(c) { return c.id === candId; });
  if (candObj && candObj.entrevistas && candObj.entrevistas.length) {
    var lastEnt = candObj.entrevistas[candObj.entrevistas.length - 1];
    var recMap  = { recomendar: '✅ Recomendar', reserva: '⚠️ Reserva', 'no recomendar': '❌ No recomendar' };
    entHtml = '<tr><td style="background:#f8fafc;font-weight:700">Entrevista</td>'
      + '<td>' + (lastEnt.notaSobre10 != null ? lastEnt.notaSobre10 + '/10 (' + lastEnt.puntaje + '%)' : lastEnt.puntaje + '%') + '</td>'
      + '<td>' + (recMap[lastEnt.rec] || lastEnt.rec || '') + '</td>'
      + '<td>' + lastEnt.fecha + '</td></tr>'
      + (lastEnt.opinion ? '<tr><td colspan="4" style="background:#f0fdf4;padding:10px;font-size:11px;line-height:1.6">'
        + '<strong>Opinión del entrevistador:</strong> ' + lastEnt.opinion + '</td></tr>' : '');
  }

  // Barras dimensión Big5
  var dn = { E:'Extraversión', A:'Amabilidad', C:'Responsabilidad', N:'Est.Emocional', O:'Apertura' };
  var b5rows = g.big5Dims ? Object.keys(dn).map(function(k) {
    var v = g.big5Dims[k];
    var c = v >= 75 ? '#059669' : v >= 50 ? '#d97706' : '#dc2626';
    return '<div style="margin-bottom:5px">'
      + '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px">'
      + '<span>' + dn[k] + '</span><strong style="color:' + c + '">' + v + '%</strong></div>'
      + '<div style="height:4px;background:#e2e8f0;border-radius:2px">'
      + '<div style="width:' + v + '%;height:100%;background:' + c + ';border-radius:2px"></div></div></div>';
  }).join('') : '<span style="color:#94a3b8">Sin datos</span>';

  var sclBadges = g.hasScl
    ? (g.sclFlags.length
        ? g.sclFlags.map(function(f) { return '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:9px;margin:2px;display:inline-block">' + f + '</span>'; }).join('')
        : '<span style="background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:10px;font-size:10px">✓ Sin alertas</span>')
    : '<span style="color:#94a3b8">Sin datos</span>';

  function filaAnalisis(icono, label, an) {
    if (!an) return '';
    var nc = { alto:'#059669', medio:'#d97706', bajo:'#dc2626' }[an.nivel] || '#64748b';
    var nl = { alto:'Favorable', medio:'Regular', bajo:'Desfavorable' }[an.nivel] || '';
    return '<tr><td style="padding:8px 10px;font-weight:600;background:#f8fafc;width:22%">' + icono + ' ' + label + '</td>'
      + '<td style="padding:8px 10px;color:' + nc + ';font-weight:700;width:18%">' + nl + '<br><small>' + (an.score != null ? an.score + '%' : '—') + '</small></td>'
      + '<td style="padding:8px 10px;font-size:11px;color:#475569;line-height:1.5">' + an.texto
      + (an.alerta ? '<div style="margin-top:5px;padding:5px 8px;background:#fff7ed;color:#c2410c;font-size:10px;border-radius:4px;font-weight:600">' + an.alerta + '</div>' : '')
      + '</td></tr>';
  }

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<title>Informe — ' + g.nombre + '</title>'
    + '<style>'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b}'
    + '.page{width:21cm;min-height:29.7cm;margin:0 auto;padding:1.5cm 2cm}'
    + '.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ' + decColor + ';padding-bottom:12px;margin-bottom:18px}'
    + '.sec{font-size:11px;font-weight:700;color:#2563eb;border-bottom:1px solid #bfdbfe;padding-bottom:4px;margin:16px 0 10px;text-transform:uppercase;letter-spacing:.05em}'
    + 'table{width:100%;border-collapse:collapse;font-size:11px}'
    + 'th{background:#f1f5f9;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;color:#475569}'
    + 'td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}'
    + '.score-hero{background:' + dec.bg + ';border:2px solid ' + dec.color + ';border-radius:10px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}'
    + '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}'
    + '.box{background:#f8fafc;border-radius:8px;padding:12px}'
    + '.box-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}'
    + '.firmas{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:40px}'
    + '.firma-box{text-align:center}'
    + '.firma-line{border-bottom:1px solid #334155;height:50px;margin-bottom:8px}'
    + '.footer{margin-top:16px;font-size:9px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;padding-top:6px}'
    + '@media print{body{padding:0}.page{margin:0;padding:1.2cm 1.8cm}}'
    + '</style></head><body><div class="page">'

    // HEADER
    + '<div class="hdr">'
    + '<div><div style="font-size:18px;font-weight:900;color:' + decColor + '">' + empresa + '</div>'
    + '<div style="font-size:10px;color:#64748b;margin-top:2px">' + (cfg.ruc ? 'RUC: ' + cfg.ruc : '') + (cfg.ciudad ? ' · ' + cfg.ciudad : '') + '</div></div>'
    + '<div style="text-align:right">'
    + '<div style="font-size:13px;font-weight:700">INFORME INDIVIDUAL DE CANDIDATO</div>'
    + '<div style="background:#eff6ff;color:#1e40af;padding:3px 12px;border-radius:4px;font-weight:700;font-size:11px;margin-top:5px">' + conv.titulo + '</div>'
    + '<div style="font-size:10px;color:#64748b;margin-top:4px">' + fecha + '</div>'
    + '</div></div>'

    // DATOS CANDIDATO
    + '<div class="sec">1. Datos del candidato</div>'
    + '<table><tr><td style="background:#f8fafc;font-weight:700;width:35%">Nombre completo</td><td><strong>' + g.nombre + '</strong></td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Ciudad</td><td>' + g.ciudad + '</td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Posición en ranking</td><td><strong style="color:' + decColor + '">' + medalTxt + '</strong> de ' + conDatos.length + ' evaluados</td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Convocatoria</td><td>' + conv.titulo + '</td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Responsable RRHH</td><td>' + (cfg.dirRRHH || '______________________________') + '</td></tr>'
    + '</table>'

    // RESULTADO GLOBAL
    + '<div class="sec">2. Resultado global</div>'
    + '<div class="score-hero">'
    + '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:' + dec.color + ';margin-bottom:4px">' + dec.icono + ' ' + dec.titulo + '</div>'
    + '<p style="font-size:11px;color:#475569;line-height:1.5;max-width:420px">' + dec.texto + '</p></div>'
    + '<div style="text-align:right;flex-shrink:0">'
    + '<div style="font-size:52px;font-weight:900;color:' + dec.color + ';line-height:1">' + g.score + '%</div>'
    + '<div style="font-size:10px;color:#64748b">Puntaje total</div></div></div>'

    // SCORES POR TEST
    + '<div class="grid2">'
    + '<div class="box"><div class="box-title" style="color:#4f46e5">🧠 Personalidad Big Five</div>'
    + (g.hasBig5 ? '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Puntaje global</span><strong style="color:' + (g.big5Score>=75?'#059669':g.big5Score>=50?'#d97706':'#dc2626') + '">' + g.big5Score + '%</strong></div>' + b5rows : '<span style="color:#94a3b8">Sin datos</span>')
    + '</div>'
    + '<div>'
    + '<div class="box" style="margin-bottom:10px"><div class="box-title" style="color:#d97706">💭 Bienestar Psicológico (SCL)</div>'
    + (g.hasScl
        ? '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Puntaje SCL</span><strong style="color:' + (g.sclScore>=75?'#059669':g.sclScore>=50?'#d97706':'#dc2626') + '">' + g.sclScore + '%</strong></div>' + sclBadges
        : '<span style="color:#94a3b8">Sin datos</span>')
    + '</div>'
    + '<div class="box"><div class="box-title" style="color:#059669">📚 Conocimientos del Cargo</div>'
    + (g.hasCargo
        ? '<div style="display:flex;justify-content:space-between"><span>Correctas</span><strong style="color:' + (g.cargoScore>=75?'#059669':g.cargoScore>=50?'#d97706':'#dc2626') + '">' + g.cargoScore + '%</strong></div>'
          + (g.cargoCorr != null ? '<div style="font-size:10px;color:#64748b;margin-top:4px">' + g.cargoCorr + ' de ' + g.cargoTotal + ' preguntas</div>' : '')
        : '<span style="color:#94a3b8">Sin datos</span>')
    + '</div></div></div>'

    // ANÁLISIS POR SECCIÓN
    + '<div class="sec">3. Análisis por sección</div>'
    + '<table><thead><tr><th>Evaluación</th><th>Resultado</th><th>Opinión del sistema</th></tr></thead><tbody>'
    + filaAnalisis('🧠', 'Big Five', b5a)
    + filaAnalisis('💭', 'SCL', scla)
    + filaAnalisis('📚', 'Cargo', cga)
    + '</tbody></table>'

    // ENTREVISTA (si existe)
    + (entHtml ? '<div class="sec">4. Entrevista</div><table><thead><tr><th>Tipo</th><th>Nota</th><th>Recomendación</th><th>Fecha</th></tr></thead><tbody>' + entHtml + '</tbody></table>' : '')

    // FIRMAS
    + '<div class="sec" style="margin-top:24px">' + (entHtml ? '5' : '4') + '. Firmas y conformidad</div>'
    + '<div class="firmas">'
    + '<div class="firma-box"><div class="firma-line"></div><div style="font-weight:700;font-size:11px">' + (cfg.dirRRHH || '______________________________') + '</div><div style="font-size:10px;color:#64748b">Director de RRHH</div></div>'
    + '<div class="firma-box"><div class="firma-line"></div><div style="font-weight:700;font-size:11px">' + (cfg.repLegal || '______________________________') + '</div><div style="font-size:10px;color:#64748b">Representante Legal</div></div>'
    + '<div class="firma-box"><div class="firma-line"></div><div style="font-weight:700;font-size:11px">______________________________</div><div style="font-size:10px;color:#64748b">Gerente / Aprobador</div></div>'
    + '</div>'

    + '<div class="footer">' + empresa + (cfg.ruc ? ' | RUC: ' + cfg.ruc : '') + ' | ' + g.nombre + ' | Generado: ' + fecha + ' | CONFIDENCIAL</div>'
    + '</div>'
    + '<script>window.onload=function(){window.print();}<\/script>'
    + '</body></html>';

  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ── GENERAR PDF ──────────────────────────────────────────
function generarPDF() {
  var conv = DB.convs().find(function(c) { return c.id === infC; });
  if (!conv) { toast('Selecciona una convocatoria', 'err'); return; }

  var cfg          = getCfg();
  var empresa      = cfg.empresa || '[EMPRESA]';
  var cands        = DB.cands().filter(function(c) { return c.convocatoriaId === infC; });
  var fecha        = new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });

  var scores = cands.map(function(c) {
    var sc = calcScore(c.id);
    sc.nombre = c.apellidos + ', ' + c.nombres;
    sc.ciudad = c.ciudad || '-';
    return sc;
  }).filter(function(s) { return s.testsCount > 0; })
    .sort(function(a, b) { return b.score - a.score; });

  if (!scores.length) { toast('No hay candidatos con datos de tests', 'w'); return; }

  var vacantes = conv.vacantes || 1;

  // ── Fila de la tabla de ranking
  function filaRanking(s, i) {
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
    var rec   = i < vacantes ? 'CONTRATAR' : i < vacantes * 2 ? 'SUPLENTE' : '-';
    var recClr= i < vacantes ? '#059669'   : i < vacantes * 2 ? '#d97706'  : '#94a3b8';
    var bg    = i === 0 ? '#f0fdf4' : '';
    return '<tr style="background:' + bg + '">'
      + '<td><strong>' + s.nombre + '</strong><br><span style="font-size:10px;color:#64748b">' + s.ciudad + '</span></td>'
      + '<td style="text-align:center">' + barra(s.big5Score) + '</td>'
      + '<td style="text-align:center">' + barra(s.sclScore) + '</td>'
      + '<td style="text-align:center">' + barra(s.cargoScore) + '</td>'
      + '<td style="text-align:center">' + barra(s.entScore) + (s.entIsSystem ? '<br><span style="font-size:8px;color:#94a3b8">⚙️auto</span>' : '') + '</td>'
      + '<td style="text-align:center;font-size:18px;font-weight:900;color:' + barColor(s.score) + '">' + s.score + '%</td>'
      + '<td style="text-align:center"><span style="background:' + recClr + ';color:#fff;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700">' + rec + '</span></td>'
      + '</tr>';
  }
  function barra(v) {
    if (v == null) return '<span style="color:#cbd5e1">—</span>';
    return '<span style="font-weight:700;color:' + barColor(v) + '">' + v + '%</span>';
  }

  // ── Big5 detalle del ganador
  var ganador = scores[0];
  var b5Detail = '';
  if (ganador.big5Dims) {
    var dn = { E: 'Extraversión', A: 'Amabilidad', C: 'Responsabilidad', N: 'Est.Emocional', O: 'Apertura' };
    b5Detail = Object.keys(dn).map(function(k) {
      var v = ganador.big5Dims[k];
      return '<div style="margin-bottom:6px">'
        + '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">'
        + '<span>' + dn[k] + '</span><strong>' + v + '%</strong></div>'
        + '<div style="height:5px;background:#e2e8f0;border-radius:3px">'
        + '<div style="width:' + v + '%;height:100%;background:' + barColor(v) + ';border-radius:3px"></div>'
        + '</div></div>';
    }).join('');
  }

  var sclAlerts = ganador.sclFlags.length
    ? ganador.sclFlags.map(function(f) { return '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:10px;margin:2px">' + f + '</span>'; }).join('')
    : '<span style="background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:10px;font-size:10px">✓ Sin alertas</span>';

  var rankRows = scores.map(filaRanking).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Informe de Selección</title>'
    + '<style>'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b}'
    + '.page{width:21cm;min-height:29.7cm;margin:0 auto;padding:1.5cm 2cm}'
    + '.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:12px;margin-bottom:18px}'
    + '.hdr-empresa{font-size:18px;font-weight:900;color:#2563eb}'
    + '.hdr-sub{font-size:10px;color:#64748b;margin-top:3px}'
    + '.hdr-right{text-align:right}'
    + '.hdr-right .doc-title{font-size:14px;font-weight:700;color:#1e293b}'
    + '.sec{font-size:12px;font-weight:700;color:#2563eb;border-bottom:1px solid #bfdbfe;padding-bottom:4px;margin:16px 0 10px;text-transform:uppercase;letter-spacing:.05em}'
    + 'table{width:100%;border-collapse:collapse;font-size:11px}'
    + 'th{background:#f1f5f9;padding:7px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #e2e8f0;color:#475569}'
    + 'td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}'
    + 'tr:hover td{background:#f8fafc}'
    + '.ganador-box{background:#f0fdf4;border:2px solid #059669;border-radius:10px;padding:16px;margin-bottom:16px}'
    + '.ganador-name{font-size:20px;font-weight:900;color:#059669;margin-bottom:4px}'
    + '.score-big{font-size:42px;font-weight:900;color:#059669}'
    + '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}'
    + '.box{background:#f8fafc;border-radius:8px;padding:12px}'
    + '.box-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}'
    + '.firmas{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:40px}'
    + '.firma-box{text-align:center}'
    + '.firma-line{border-bottom:1px solid #334155;height:50px;margin-bottom:8px}'
    + '.firma-nombre{font-weight:700;font-size:11px}'
    + '.firma-rol{font-size:10px;color:#64748b;margin-top:2px}'
    + '.footer{margin-top:20px;font-size:9px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;padding-top:7px}'
    + '@media print{body{padding:0}.page{margin:0;padding:1.2cm 1.8cm}}'
    + '</style></head><body>'
    + '<div class="page">'

    // HEADER
    + '<div class="hdr">'
    + '<div><div class="hdr-empresa">' + empresa + '</div>'
    + '<div class="hdr-sub">' + (cfg.ruc ? 'RUC: ' + cfg.ruc : '') + (cfg.ciudad ? ' | ' + cfg.ciudad : '') + '</div></div>'
    + '<div class="hdr-right"><div class="doc-title">INFORME FINAL DE SELECCIÓN</div>'
    + '<div style="font-size:10px;color:#64748b;margin-top:4px">' + fecha + '</div>'
    + '<div style="background:#eff6ff;color:#1e40af;padding:3px 12px;border-radius:4px;font-weight:700;font-size:11px;margin-top:5px">'
    + conv.titulo + '</div></div></div>'

    // INFO CONVOCATORIA
    + '<div class="sec">1. Datos de la convocatoria</div>'
    + '<table><tr><td style="width:35%;background:#f8fafc;font-weight:700">Cargo / Vacante</td><td>' + conv.titulo + '</td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Vacantes disponibles</td><td>' + vacantes + '</td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Candidatos evaluados</td><td>' + scores.length + ' de ' + cands.length + '</td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Responsable RRHH</td><td>' + (cfg.dirRRHH || '______________________________') + '</td></tr>'
    + '<tr><td style="background:#f8fafc;font-weight:700">Fecha del informe</td><td>' + fecha + '</td></tr>'
    + '</table>'

    // CANDIDATO RECOMENDADO
    + '<div class="sec">2. Candidato recomendado para contratación</div>'
    + '<div class="ganador-box">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">'
    + '<div><div style="font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">✓ RECOMENDADO · PUESTO 1</div>'
    + '<div class="ganador-name">' + ganador.nombre + '</div>'
    + '<div style="font-size:11px;color:#475569">' + ganador.ciudad + '</div></div>'
    + '<div style="text-align:right"><div class="score-big">' + ganador.score + '%</div>'
    + '<div style="font-size:10px;color:#64748b">Puntaje total</div></div></div>'
    + '<div class="grid2" style="margin-top:14px">'
    + '<div class="box"><div class="box-title" style="color:#4f46e5">🧠 Personalidad (Big Five)</div>'
    + (ganador.hasBig5 ? b5Detail : '<span style="color:#94a3b8">Sin datos</span>')
    + '</div>'
    + '<div>'
    + '<div class="box" style="margin-bottom:10px"><div class="box-title" style="color:#d97706">💭 Bienestar Psicológico</div>'
    + (ganador.hasScl
        ? '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Puntaje SCL</span><strong style="color:' + barColor(ganador.sclScore) + '">' + ganador.sclScore + '%</strong></div>'
          + '<div>Alertas: ' + sclAlerts + '</div>'
        : '<span style="color:#94a3b8">Sin datos</span>')
    + '</div>'
    + '<div class="box"><div class="box-title" style="color:#059669">📚 Conocimientos del Cargo</div>'
    + (ganador.hasCargo
        ? '<div style="display:flex;justify-content:space-between"><span>Respuestas correctas</span><strong style="color:' + barColor(ganador.cargoScore) + '">' + ganador.cargoScore + '%</strong></div>'
          + (ganador.cargoCorr != null ? '<div style="font-size:10px;color:#64748b;margin-top:4px">' + ganador.cargoCorr + ' de ' + ganador.cargoTotal + ' preguntas</div>' : '')
        : '<span style="color:#94a3b8">Sin datos</span>')
    + '</div></div></div></div>'

    // RESULTADO DEL CANDIDATO EVALUADO
    + '<div class="sec">3. Resultado del Candidato Evaluado</div>'
    + '<table><thead><tr><th>Candidato</th><th style="text-align:center">Big5</th><th style="text-align:center">SCL</th><th style="text-align:center">Cargo</th><th style="text-align:center">Entrev.</th><th style="text-align:center">Total</th><th style="text-align:center">Decisión</th></tr></thead>'
    + '<tbody>' + rankRows + '</tbody></table>'

    // ANÁLISIS Y RECOMENDACIÓN DEL GANADOR
    + '<div class="sec">4. Análisis del candidato recomendado</div>'
    + (function(){
        var dec = decisionFinal(ganador);
        var b5a = analizarBig5(ganador.big5Dims, ganador.big5Score);
        var sca = analizarSCL(ganador.sclScore, ganador.sclFlags);
        var cga = analizarCargo(ganador.cargoScore, ganador.cargoCorr, ganador.cargoTotal);
        function filaA(icono, label, an) {
          if (!an) return '';
          var nColor = { alto:'#059669', medio:'#d97706', bajo:'#dc2626' }[an.nivel] || '#64748b';
          var nLabel = { alto:'Favorable', medio:'Regular', bajo:'Desfavorable' }[an.nivel] || '';
          return '<tr><td style="padding:8px 10px;font-weight:600;background:#f8fafc;width:30%">' + icono + ' ' + label + '</td>'
            + '<td style="padding:8px 10px;color:' + nColor + ';font-weight:700">' + nLabel + ' · ' + (an.score != null ? an.score + '%' : '—') + '</td>'
            + '<td style="padding:8px 10px;font-size:11px;color:#475569">' + an.texto + '</td></tr>'
            + (an.alerta ? '<tr><td colspan="3" style="padding:6px 10px;background:#fff7ed;color:#c2410c;font-size:11px;font-weight:600">' + an.alerta + '</td></tr>' : '');
        }
        return '<div style="background:' + dec.bg + ';border:2px solid ' + dec.color + ';border-radius:8px;padding:14px;margin-bottom:14px">'
          + '<div style="font-weight:900;color:' + dec.color + ';font-size:14px;margin-bottom:6px">' + dec.icono + ' ' + dec.titulo + ': ' + ganador.nombre + '</div>'
          + '<p style="font-size:12px;color:#475569;line-height:1.6;margin-bottom:10px">' + dec.texto + '</p>'
          + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
          + '<thead><tr><th style="background:#f1f5f9;padding:6px 10px;text-align:left">Evaluación</th>'
          + '<th style="background:#f1f5f9;padding:6px 10px;text-align:left">Resultado</th>'
          + '<th style="background:#f1f5f9;padding:6px 10px;text-align:left">Opinión</th></tr></thead>'
          + '<tbody>'
          + filaA('🧠','Big Five',b5a)
          + filaA('💭','SCL',sca)
          + filaA('📚','Cargo',cga)
          + '</tbody></table>'
          + '</div>';
      })()

    // FIRMAS
    + '<div class="sec" style="margin-top:24px">5. Firmas y conformidad</div>'
    + '<div class="firmas">'
    + '<div class="firma-box"><div class="firma-line"></div><div class="firma-nombre">' + (cfg.dirRRHH || '______________________________') + '</div><div class="firma-rol">Director de RRHH</div></div>'
    + '<div class="firma-box"><div class="firma-line"></div><div class="firma-nombre">' + (cfg.repLegal || '______________________________') + '</div><div class="firma-rol">Representante Legal</div></div>'
    + '<div class="firma-box"><div class="firma-line"></div><div class="firma-nombre">______________________________</div><div class="firma-rol">Gerente / Aprobador</div></div>'
    + '</div>'

    + '<div class="footer">' + empresa + (cfg.ruc ? ' | RUC: ' + cfg.ruc : '') + ' | Generado: ' + fecha + ' | CONFIDENCIAL</div>'
    + '</div>'
    + '<script>window.onload=function(){window.print();}<\/script>'
    + '</body></html>';

  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

function confirmarSel(id) {
  var all = DB.cands();
  var idx = -1;
  all.forEach(function(c, i) { if (c.id === id) idx = i; });
  if (idx < 0) return;
  var just = document.getElementById('just_' + id);
  all[idx].etapa = 'seleccionado';
  if (just) all[idx].justificacion = just.value;
  DB.sCands(all);
  toast('Candidato confirmado', 'ok');
  pgInforme();
}
