// ══════════════════════════════════════════════════════
// DATA.JS — Preguntas y datos de referencia de los tests
// ══════════════════════════════════════════════════════

var BIG5_PREGUNTAS=[
  {id:1,dim:'E',inv:false,txt:'Me veo como alguien extrovertido/a, entusiasta.'},
  {id:2,dim:'A',inv:true, txt:'Me veo como alguien crítico/a, que suele discutir.'},
  {id:3,dim:'C',inv:false,txt:'Me veo como alguien confiable, autodisciplinado/a.'},
  {id:4,dim:'N',inv:true, txt:'Me veo como alguien relajado/a, que maneja bien el estrés.'},
  {id:5,dim:'O',inv:false,txt:'Me veo como alguien abierto/a a nuevas experiencias, con imaginación.'},
  {id:6,dim:'E',inv:true, txt:'Me veo como alguien reservado/a, tranquilo/a.'},
  {id:7,dim:'A',inv:false,txt:'Me veo como alguien empático/a, afectuoso/a con los demás.'},
  {id:8,dim:'C',inv:true, txt:'Me veo como alguien desorganizado/a, descuidado/a.'},
  {id:9,dim:'N',inv:false,txt:'Me veo como alguien que se pone nervioso/a fácilmente.'},
  {id:10,dim:'O',inv:true, txt:'Me veo como alguien convencional, poco creativo/a.'},
  {id:11,dim:'E',inv:false,txt:'Me entusiasmo fácilmente con nuevos proyectos o retos.'},
  {id:12,dim:'A',inv:false,txt:'Tiendo a ser cooperativo/a y a evitar conflictos innecesarios.'},
  {id:13,dim:'C',inv:false,txt:'Termino lo que empiezo; soy perseverante.'},
  {id:14,dim:'N',inv:false,txt:'A veces me preocupo demasiado por cosas sin importancia.'},
  {id:15,dim:'O',inv:false,txt:'Me interesa explorar ideas nuevas y aprender constantemente.'},
  {id:16,dim:'E',inv:false,txt:'Me resulta fácil hablar con personas desconocidas.'},
  {id:17,dim:'A',inv:false,txt:'En desacuerdos busco un punto medio que satisfaga a todos.'},
  {id:18,dim:'C',inv:false,txt:'Planifico mis tareas antes de actuar.'},
  {id:19,dim:'N',inv:true, txt:'Me recupero rápido de las situaciones difíciles.'},
  {id:20,dim:'O',inv:false,txt:'Disfruto reflexionar sobre conceptos abstractos o filosóficos.'}
];

var B5_DIM={E:'Extraversión',A:'Amabilidad',C:'Responsabilidad',N:'Neuroticismo',O:'Apertura'};
var B5_DESC={
  E:{hi:'Alta sociabilidad, asertividad y energía. Apto para roles de liderazgo y atención al cliente.',lo:'Prefiere trabajar de forma independiente. Apto para roles técnicos o de análisis.'},
  A:{hi:'Alta cooperación y empatía. Excelente para trabajo en equipo y atención a personas.',lo:'Puede ser directo/a al punto de parecer inflexible. Útil en roles de negociación dura.'},
  C:{hi:'Muy organizado/a, disciplinado/a y cumplidor/a. Ideal para roles de responsabilidad.',lo:'Puede tener dificultades con plazos y organización. Requiere supervisión.'},
  N:{hi:'Alta reactividad emocional. Puede afectar el desempeño en situaciones de presión.',lo:'Estabilidad emocional alta. Maneja bien la presión y los conflictos.'},
  O:{hi:'Creativo/a, curioso/a y adaptable. Ideal para roles de innovación y aprendizaje continuo.',lo:'Prefiere rutinas y procedimientos establecidos. Apto para roles operativos.'}
};

var SCL_PREGUNTAS=[
  {id:1,dim:'SOM',txt:'Dolores de cabeza frecuentes sin causa médica clara.'},
  {id:2,dim:'SOM',txt:'Sensación de desmayo o mareo.'},
  {id:3,dim:'ANS',txt:'Nerviosismo o agitación interior que no puede controlar.'},
  {id:4,dim:'ANS',txt:'Temblores en el cuerpo sin razón aparente.'},
  {id:5,dim:'ANS',txt:'Ataques de pánico o terror repentino.'},
  {id:6,dim:'DEP',txt:'Sentirse sin esperanza sobre el futuro.'},
  {id:7,dim:'DEP',txt:'Sentirse solo/a aunque esté acompañado/a.'},
  {id:8,dim:'DEP',txt:'Pensamientos de hacerse daño a sí mismo/a.'},
  {id:9,dim:'HOS',txt:'Accesos de cólera que no puede controlar.'},
  {id:10,dim:'HOS',txt:'Impulsos de golpear, lastimar o hacerle daño a alguien.'},
  {id:11,dim:'HOS',txt:'Tener ganas de romper o destruir cosas.'},
  {id:12,dim:'PAR',txt:'Sentir que otras personas le observan o hablan de usted.'},
  {id:13,dim:'PAR',txt:'Tener la sensación de que otros tienen la culpa de sus problemas.'},
  {id:14,dim:'PAR',txt:'Sentir desconfianza hacia la mayoría de personas.'},
  {id:15,dim:'PSI',txt:'Tener pensamientos que no son suyos o que le son impuestos.'},
  {id:16,dim:'PSI',txt:'Escuchar voces que otros no pueden escuchar.'},
  {id:17,dim:'OBS',txt:'Tener que hacer las cosas muy despacio para hacerlas bien.'},
  {id:18,dim:'OBS',txt:'Tener que comprobar varias veces lo que hace (apagar la llave, cerrar la puerta, etc).'},
  {id:19,dim:'SIN',txt:'Sentirse inferior a los demás.'},
  {id:20,dim:'SIN',txt:'Sentirse incómodo/a cuando la gente le mira o habla de usted.'},
  {id:21,dim:'ANS',txt:'Sentirse tan inquieto/a que no puede estar sentado/a tranquilo/a.'},
  {id:22,dim:'DEP',txt:'Sentirse sin energía o sin fuerzas.'},
  {id:23,dim:'SOM',txt:'Sensación de pesadez en brazos o piernas.'},
  {id:24,dim:'HOS',txt:'Irritarse o exasperarse con facilidad.'},
  {id:25,dim:'PAR',txt:'Sentir que no puede confiar en nadie.'}
];

var SCL_DIM={SOM:'Somatización',ANS:'Ansiedad',DEP:'Depresión',HOS:'Hostilidad',PAR:'Paranoia',PSI:'Psicoticismo',OBS:'Obsesión',SIN:'Sensibilidad Interpersonal'};
var SCL_UMBRAL={SOM:1.2,ANS:1.0,DEP:1.2,HOS:1.2,PAR:1.0,PSI:0.6,OBS:1.2,SIN:1.2};

var ENT_PREGUNTAS=[
  {id:'e1',cat:'Situacional',txt:'¿Qué haría si un compañero de trabajo le pide que haga algo que va en contra de las normas de la empresa?'},
  {id:'e2',cat:'Situacional',txt:'Si cometiera un error importante en el trabajo, ¿cómo lo manejaría?'},
  {id:'e3',cat:'Situacional',txt:'¿Cómo reaccionaría si su jefe le da una crítica que usted considera injusta?'},
  {id:'e4',cat:'Competencias',txt:'¿Cuáles son sus principales fortalezas y cómo las aplicaría en este cargo?'},
  {id:'e5',cat:'Competencias',txt:'¿Cuáles considera que son sus áreas de mejora o debilidades?'},
  {id:'e6',cat:'Competencias',txt:'¿Qué valor o habilidad distinta aportaría usted a nuestro equipo?'},
  {id:'e7',cat:'Motivacion',txt:'¿Por qué se postula a este cargo y qué sabe de él?'},
  {id:'e8',cat:'Motivacion',txt:'¿Por qué deberíamos contratarle a usted y no a otro candidato?'},
  {id:'e9',cat:'Motivacion',txt:'¿Cuál es su aspiración salarial y por qué considera que es adecuada?'},
  {id:'e10',cat:'Disponibilidad',txt:'¿Tiene disponibilidad para trabajar en horarios rotativos o fines de semana si el cargo lo requiere?'},
  {id:'e11',cat:'Disponibilidad',txt:'¿Cuenta con vehículo propio o medio de transporte confiable?'},
  {id:'e12',cat:'Disponibilidad',txt:'¿Tiene alguna condición que pudiera limitar el desempeño de las funciones específicas de este cargo?'},
  {id:'e13',cat:'Proyeccion',txt:'¿Dónde se ve profesionalmente en 3 años?'},
  {id:'e14',cat:'Proyeccion',txt:'¿Qué espera obtener de esta empresa además del salario?'}
];
