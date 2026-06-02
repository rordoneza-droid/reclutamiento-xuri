// ══════════════════════════════════════════════════════
// OPINION.JS — Motor de análisis y recomendación por rangos
// Genera opiniones automáticas sobre cada test y recomienda
// a quién contratar basado en los puntajes obtenidos.
// ══════════════════════════════════════════════════════

// ── ANÁLISIS BIG FIVE ───────────────────────────────────
function analizarBig5(dims, score) {
  if (!dims) return null;
  var E = dims.E, A = dims.A, C = dims.C, N = dims.N, O = dims.O;

  var fortalezas = [], areas = [], perfil = '';

  if (C >= 75) fortalezas.push('muy organizado/a y cumplidor/a');
  else if (C < 50) areas.push('organización y seguimiento de tareas');

  if (E >= 75) fortalezas.push('alta sociabilidad y comunicación');
  else if (E < 50) areas.push('proactividad en la comunicación');

  if (A >= 75) fortalezas.push('excelente trabajo en equipo y empatía');
  else if (A < 50) areas.push('gestión de relaciones interpersonales');

  if (N >= 75) fortalezas.push('buena estabilidad emocional bajo presión');
  else if (N < 50) areas.push('manejo del estrés y presión laboral');

  if (O >= 75) fortalezas.push('perfil creativo y adaptable al cambio');

  // Perfil dominante
  if (C >= 70 && E >= 70 && N >= 65)
    perfil = 'Perfil completo para roles de liderazgo o coordinación. Alta responsabilidad con buenas habilidades sociales.';
  else if (C >= 70 && N >= 65 && E < 60)
    perfil = 'Perfil técnico/operativo sólido. Organizado y estable, funciona mejor en roles independientes o especializados.';
  else if (E >= 75 && A >= 70)
    perfil = 'Perfil orientado a personas. Ideal para ventas, atención al cliente o roles de servicio directo.';
  else if (C >= 70 && A >= 70)
    perfil = 'Perfil colaborativo y responsable. Buen integrante de equipo que cumple con lo que se le asigna.';
  else if (N < 45)
    perfil = 'Perfil con inestabilidad emocional significativa. Puede verse afectado bajo presión o conflictos laborales.';
  else
    perfil = 'Perfil mixto. Tiene habilidades destacadas en algunas áreas con oportunidades de desarrollo en otras.';

  var nivel = score >= 75 ? 'alto' : score >= 55 ? 'medio' : 'bajo';

  var texto = perfil;
  if (fortalezas.length) texto += ' Destacan: ' + fortalezas.join(', ') + '.';
  if (areas.length)      texto += ' Áreas de mejora: ' + areas.join(', ') + '.';

  // Dimensión más baja = riesgo
  var minDim = null, minVal = 100;
  var dimNames = { E:'Extraversión', A:'Amabilidad', C:'Responsabilidad', N:'Est.Emocional', O:'Apertura' };
  Object.keys(dimNames).forEach(function(k) {
    if (dims[k] < minVal) { minVal = dims[k]; minDim = k; }
  });
  var alerta = minVal < 40
    ? '⚠️ Atención: puntaje muy bajo en ' + dimNames[minDim] + ' (' + minVal + '%). Considerar en el proceso de selección.'
    : null;

  return { nivel: nivel, texto: texto, alerta: alerta, score: score };
}

// ── ANÁLISIS SCL ────────────────────────────────────────
function analizarSCL(sclScore, flags) {
  if (sclScore === null) return null;

  var texto = '', nivel = '', alerta = null;
  var nFlags = flags ? flags.length : 0;

  // Flags críticos que necesitan atención especial
  var criticos = (flags || []).filter(function(f) {
    return f.indexOf('Psicotic') >= 0 || f.indexOf('Depres') >= 0;
  });
  var moderados = (flags || []).filter(function(f) {
    return f.indexOf('Psicotic') < 0 && f.indexOf('Depres') < 0;
  });

  if (nFlags === 0) {
    nivel = 'alto';
    texto = 'Sin indicadores de riesgo psicológico. El candidato muestra estabilidad emocional adecuada para un entorno laboral normal. No se requieren evaluaciones adicionales.';
  } else if (criticos.length > 0) {
    nivel = 'bajo';
    texto = 'Se detectaron indicadores en dimensiones críticas: ' + criticos.join(', ') + '. Esto puede afectar significativamente el desempeño y la convivencia laboral.';
    alerta = '🚨 ALERTA CRÍTICA: Se recomienda una evaluación psicológica profesional ANTES de tomar cualquier decisión de contratación.';
  } else if (nFlags >= 3) {
    nivel = 'bajo';
    texto = 'Múltiples indicadores elevados (' + flags.join(', ') + '). El nivel general de malestar psicológico puede interferir con el rendimiento y el trabajo en equipo.';
    alerta = '⚠️ Considerar entrevista adicional con el área de bienestar o psicología antes de contratar.';
  } else if (nFlags >= 1) {
    nivel = 'medio';
    texto = 'Se detectaron indicadores en: ' + flags.join(', ') + '. Son señales a tener en cuenta, pero no necesariamente descartantes dependiendo del cargo y el entorno de trabajo.';
    if (flags.some(function(f){ return f.indexOf('Hostilidaad') >= 0 || f.indexOf('Hostilidad') >= 0; }))
      alerta = '⚠️ Indicadores de hostilidad: evaluar cuidadosamente para cargos de atención directa al cliente o trabajo en equipo.';
  }

  return { nivel: nivel, texto: texto, alerta: alerta, score: sclScore, nFlags: nFlags };
}

// ── ANÁLISIS CARGO ──────────────────────────────────────
function analizarCargo(score, correctas, total) {
  if (score === null) return null;
  var nivel, texto;

  if (score >= 90) {
    nivel = 'alto';
    texto = 'Dominio técnico excelente. Conoce muy bien los procedimientos, normas y criterios del cargo. Requiere mínima inducción en el aspecto técnico.';
  } else if (score >= 75) {
    nivel = 'alto';
    texto = 'Buen nivel de conocimientos técnicos. Maneja los conceptos clave del cargo correctamente. Pequeños refuerzos puntuales pueden completar su perfil.';
  } else if (score >= 60) {
    nivel = 'medio';
    texto = 'Conocimiento básico suficiente para iniciar. Comprende los fundamentos pero requiere capacitación en algunos procedimientos específicos del cargo.';
  } else if (score >= 40) {
    nivel = 'medio';
    texto = 'Conocimiento parcial. Requiere un plan de capacitación moderado antes de operar de forma independiente en el cargo.';
  } else {
    nivel = 'bajo';
    texto = 'Conocimiento insuficiente para las exigencias del cargo. Necesita capacitación intensiva o podría no ser el perfil adecuado para la posición técnica.';
  }

  var detalle = correctas != null ? ' (' + correctas + ' de ' + total + ' preguntas correctas).' : '.';
  return { nivel: nivel, texto: texto + detalle, score: score };
}

// ── DECISIÓN FINAL ──────────────────────────────────────
function decisionFinal(g) {
  var score    = g.score;
  var hasFlags = g.sclFlags && g.sclFlags.length > 0;
  var hasCrit  = g.sclFlags && g.sclFlags.some(function(f){
    return f.indexOf('Psicotic') >= 0 || f.indexOf('Depres') >= 0;
  });
  var sclOk    = g.hasScl  ? g.sclScore >= 60 : true;
  var cargoOk  = g.hasCargo? g.cargoScore >= 60: true;
  var big5Ok   = g.hasBig5 ? g.big5Score >= 55 : true;

  if (hasCrit) {
    return {
      nivel: 'descartar',
      color: '#dc2626', bg: '#fff1f2',
      icono: '🚫',
      titulo: 'NO RECOMENDADO',
      texto: 'Los indicadores psicológicos críticos detectados representan un riesgo significativo para el entorno laboral. Se recomienda descartar al candidato o solicitar una evaluación profesional externa antes de reconsiderar.'
    };
  }
  if (score >= 75 && !hasFlags && cargoOk && big5Ok) {
    return {
      nivel: 'contratar',
      color: '#059669', bg: '#f0fdf4',
      icono: '✅',
      titulo: 'CONTRATAR',
      texto: 'Candidato con perfil sólido en todas las dimensiones evaluadas. Los puntajes indican aptitud técnica, estabilidad psicológica y perfil de personalidad adecuado para el cargo. Se recomienda proceder con la contratación.'
    };
  }
  if (score >= 65 && !hasCrit) {
    var detalles = [];
    if (g.hasCargo && g.cargoScore < 70) detalles.push('refuerzo técnico en conocimientos del cargo');
    if (g.hasBig5  && g.big5Score  < 65) detalles.push('desarrollo de habilidades de personalidad');
    if (hasFlags)                          detalles.push('seguimiento de bienestar psicológico inicial');
    return {
      nivel: 'contratar_obs',
      color: '#d97706', bg: '#fffbeb',
      icono: '⚠️',
      titulo: 'CONTRATAR CON OBSERVACIÓN',
      texto: 'Candidato aceptable con algunas áreas a reforzar. Se recomienda contratar con un plan de inducción que incluya: ' + (detalles.length ? detalles.join(', ') : 'seguimiento en los primeros 3 meses') + '.'
    };
  }
  if (score >= 50 && !hasCrit) {
    return {
      nivel: 'evaluar',
      color: '#7c3aed', bg: '#f5f3ff',
      icono: '🔍',
      titulo: 'EVALUAR MÁS',
      texto: 'El perfil es marginal y requiere evaluación adicional. Se sugiere una entrevista en profundidad antes de decidir, enfocándose en las áreas con puntajes bajos y verificando referencias laborales.'
    };
  }
  return {
    nivel: 'no_contratar',
    color: '#dc2626', bg: '#fff1f2',
    icono: '❌',
    titulo: 'NO RECOMENDADO',
    texto: 'Los puntajes globales se encuentran por debajo del nivel mínimo requerido para el cargo. El candidato no cumple con el perfil buscado en esta convocatoria.'
  };
}

// ── HTML DE OPINIÓN COMPLETA ────────────────────────────
function htmlOpinion(g) {
  var b5  = analizarBig5(g.big5Dims, g.big5Score);
  var scl = analizarSCL(g.sclScore, g.sclFlags);
  var cg  = analizarCargo(g.cargoScore, g.cargoCorr, g.cargoTotal);
  var dec = decisionFinal(g);

  var nivelColor = { alto:'#059669', medio:'#d97706', bajo:'#dc2626' };
  var nivelBg    = { alto:'#f0fdf4', medio:'#fffbeb', bajo:'#fff1f2' };
  var nivelLabel = { alto:'Favorable', medio:'Regular', bajo:'Desfavorable' };

  function bloque(icono, titulo, analisis, color) {
    if (!analisis) return '<div style="padding:10px;background:#f8fafc;border-radius:8px;margin-bottom:8px;font-size:12px;color:#94a3b8">Sin datos de ' + titulo + '</div>';
    var nc = nivelColor[analisis.nivel] || '#64748b';
    var nb = nivelBg[analisis.nivel]   || '#f8fafc';
    var nl = nivelLabel[analisis.nivel] || analisis.nivel;
    return '<div style="padding:12px;background:' + nb + ';border-radius:8px;margin-bottom:8px;border-left:3px solid ' + nc + '">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
      + '<span style="font-size:12px;font-weight:800;color:#334155">' + icono + ' ' + titulo + '</span>'
      + '<span style="font-size:10px;font-weight:700;color:' + nc + ';background:#fff;padding:2px 10px;border-radius:20px;border:1px solid ' + nc + '">'
      + nl + ' · ' + (analisis.score != null ? analisis.score + '%' : '—') + '</span>'
      + '</div>'
      + '<p style="font-size:12px;color:#475569;line-height:1.6;margin:0">' + analisis.texto + '</p>'
      + (analisis.alerta ? '<div style="margin-top:8px;padding:7px 10px;background:#fff;border-radius:6px;border:1px solid ' + nc + ';font-size:11px;font-weight:600;color:' + nc + '">' + analisis.alerta + '</div>' : '')
      + '</div>';
  }

  return '<div style="border-top:1px solid #e2e8f0;margin-top:14px;padding-top:14px">'
    // Decisión final destacada
    + '<div style="background:' + dec.bg + ';border:2px solid ' + dec.color + ';border-radius:10px;padding:14px;margin-bottom:14px">'
    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'
    + '<span style="font-size:22px">' + dec.icono + '</span>'
    + '<div><div style="font-size:13px;font-weight:900;color:' + dec.color + '">' + dec.titulo + '</div>'
    + '<div style="font-size:10px;color:#64748b;font-weight:600">RECOMENDACIÓN BASADA EN RANGOS</div></div>'
    + '</div>'
    + '<p style="font-size:12px;color:#475569;line-height:1.6;margin:0">' + dec.texto + '</p>'
    + '</div>'
    // Opinión por test
    + '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:8px">Análisis por sección</div>'
    + bloque('🧠', 'Personalidad (Big Five)', b5)
    + bloque('💭', 'Bienestar Psicológico (SCL)', scl)
    + bloque('📚', 'Conocimientos del Cargo', cg)
    + '</div>';
}

// ── RESUMEN COMPARATIVO (para el top del informe) ────────
function htmlResumenContratacion(scores, vacantes) {
  if (!scores || !scores.length) return '';
  var conDatos = scores.filter(function(s){ return s.testsCount > 0; });
  if (!conDatos.length) return '';

  var ganadores = conDatos.slice(0, vacantes);
  var html = '<div style="background:linear-gradient(135deg,#1e40af,#2563eb);color:#fff;border-radius:14px;padding:20px;margin-bottom:20px">'
    + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.8;margin-bottom:8px">🤖 Análisis de Recomendación</div>';

  if (vacantes === 1) {
    var top = ganadores[0];
    var dec = decisionFinal(top);
    html += '<div style="font-size:16px;font-weight:800;margin-bottom:6px">'
      + dec.icono + ' ' + (dec.nivel === 'contratar' ? 'Se recomienda contratar a:' : 'Candidato mejor posicionado:')
      + '</div>'
      + '<div style="font-size:22px;font-weight:900;margin-bottom:4px">' + top.nombre + '</div>'
      + '<div style="opacity:.85;font-size:13px;margin-bottom:10px">' + top.score + '% puntaje total · ' + top.ciudad + '</div>';
    if (dec.nivel === 'contratar') {
      html += '<div style="background:rgba(255,255,255,.15);border-radius:8px;padding:10px;font-size:12px;line-height:1.6">'
        + 'Cumple con el perfil en todas las dimensiones evaluadas. Se recomienda proceder con la contratación.</div>';
    } else {
      html += '<div style="background:rgba(255,255,255,.15);border-radius:8px;padding:10px;font-size:12px;line-height:1.6">'
        + dec.texto + '</div>';
    }
    if (conDatos.length > 1) {
      var seg = conDatos[1];
      html += '<div style="margin-top:10px;opacity:.75;font-size:12px">Alternativa: ' + seg.nombre + ' (' + seg.score + '%) — '
        + (decisionFinal(seg).titulo) + '</div>';
    }
  } else {
    html += '<div style="font-size:14px;font-weight:800;margin-bottom:10px">Candidatos recomendados para las ' + vacantes + ' vacante(s):</div>';
    ganadores.forEach(function(g, i) {
      var dec = decisionFinal(g);
      html += '<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.12);border-radius:8px;padding:10px;margin-bottom:6px">'
        + '<span style="font-size:18px">' + dec.icono + '</span>'
        + '<div><div style="font-weight:800">' + g.nombre + '</div>'
        + '<div style="opacity:.8;font-size:12px">' + g.score + '% · ' + dec.titulo + '</div></div>'
        + '</div>';
    });
  }

  html += '</div>';
  return html;
}
