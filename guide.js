// Guía de planificación: contenidos de referencia y armado automático de la temporada.
// Los valores son puntos de partida habituales en fútbol; cada cuerpo técnico los ajusta a su plantel.

export const DAYS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const pad=n=>String(n).padStart(2,'0');
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
export const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
export const weekday=s=>parse(s).getDay();
const diff=(a,b)=>Math.round((parse(b)-parse(a))/864e5);

/* ---------- períodos del año ---------- */
export const PERIODS=[
 {id:'PG',name:'Pretemporada general',when:'Primera mitad de la pretemporada (3 semanas de 6)',
  goals:['Evaluar al plantel y detectar déficits','Construir la base aeróbica y de fuerza','Adaptar músculos y tendones al volumen de carrera','Introducir los principios del modelo de juego'],
  field:'Resistencia intermitente y juegos de posición con el volumen en subida. Técnica todos los días.',
  gym:'2–3 sesiones por semana de fuerza base por patrones: rodilla dominante con tracción y cadera dominante con empuje (65–75 %, 3–4 series de 8). Nórdicos y saltos básicos desde la primera semana.',
  sprint:'Técnica de carrera y progresiones al 70–85 %. Aceleraciones cortas desde la semana 2.',
  load:'Volumen alto, intensidad media, 5–6 sesiones. No subir la carga semanal más de un 10–15 % de una semana a la otra.',
  tests:'Semana 1: batería completa de evaluaciones.'},
 {id:'PE',name:'Pretemporada específica',when:'Segunda mitad de la pretemporada (3 semanas de 6)',
  goals:['Llevar la intensidad a la del partido','Fuerza máxima y potencia','Velocidad máxima y capacidad de repetir sprints','Automatizar el modelo de juego con amistosos'],
  field:'La semana se arma alrededor del amistoso del fin de semana, ya con la lógica MD. Espacios grandes y 11v11.',
  gym:'2–3 sesiones: fuerza máxima (80–88 %, 4 series de 4–6) y potencia con saltos y cargas livianas.',
  sprint:'Velocidad máxima 1–2 veces por semana y un bloque de sprints repetidos (RSA).',
  load:'Intensidad alta. En la última semana baja el volumen y se mantiene la intensidad (puesta a punto).',
  tests:'Última semana: repetir saltos, velocidad y resistencia para comparar con la semana 1.'},
 {id:'C',name:'Competitivo',when:'Del primer al último partido oficial',
  goals:['Llegar fresco y rápido a cada partido','Mantener la fuerza y la velocidad todo el año','Sostener la carga de los que juegan poco','Controlar la fatiga con datos simples'],
  field:'Microciclo por MD: tensión (MD-4), duración (MD-3), velocidad (MD-2) y activación (MD-1).',
  gym:'2 por semana: fuerza con poco volumen (MD-5 o MD-4) y potencia corta (MD-2). Prevención de 10 minutos todos los días.',
  sprint:'Al menos una exposición semanal a más del 90–95 % de la velocidad máxima (MD-2). Aceleraciones en MD-4.',
  load:'Pico en MD-3 y descenso hacia el partido. Suplentes: compensatorio en MD+1.',
  tests:'CMJ todas las semanas. Cada 6–8 semanas: 10 y 30 m, saltos y antropometría.'},
 {id:'T',name:'Transición (post temporada)',when:'3 a 4 semanas después del último partido',
  goals:['Recuperación física y mental','No perder toda la base de fuerza y aeróbica','Resolver molestias y lesiones arrastradas'],
  field:'Semanas 1 y 2: descanso activo y otros deportes. Después, plan individual de 3 sesiones por semana.',
  gym:'General y unilateral, 2–3 por semana, lejos del fallo. Movilidad.',
  sprint:'Sin sprints máximos las primeras 2 semanas. Después, progresiones para no llegar de cero a la pretemporada.',
  load:'Baja. El objetivo es volver sin haber perdido más de lo necesario.',
  tests:'En la última semana competitiva: evaluación final, para comparar con la próxima pretemporada.'}
];
export const PERIOD_NAME={PG:'Pretemporada general',PE:'Pretemporada específica',C:'Competitivo',T:'Transición'};

/* ---------- qué se trabaja cada día ---------- */
export const INFO={
 'MD+1':{t:'Recuperación y compensatorio',type:'Regenerativo',load:'Baja para titulares, media-alta para suplentes',rpe:'2–3 / 6–7',
  goal:'Recuperar a los que jugaron y darles carga a los que no.',
  field:'Titulares (más de 60 min): trote suave, movilidad y elongación. Suplentes y no convocados: reducidos intensos y carreras de alta intensidad.',
  gym:'Titulares: solo movilidad. Suplentes: pueden sumar fuerza de tren inferior.',sprint:'Suplentes: 4–6 × 30 m para no perder la exposición semanal.',
  obj:['Titulares: recuperar','Suplentes: igualar la carga del partido'],mat:['Conos','Pelotas','Pecheras','2 arcos'],space:'Media cancha'},
 'MD-5':{t:'Fuerza general y técnica',type:'Técnico',load:'Media',rpe:'5–6',
  goal:'Sesión principal de gimnasio y técnica con poca carga de carrera.',
  field:'Técnica analítica (pase, control, conducción), rondos y juego de posición en espacios chicos.',
  gym:'Fuerza de tren inferior: la sesión principal de la semana (30–40 min).',sprint:'Sin sprints largos. Técnica de carrera en la entrada en calor.',
  obj:['Fuerza de tren inferior','Calidad técnica: pase y control orientado','Conservar la pelota en espacios chicos'],mat:['Conos','Pelotas','Pecheras (2 colores)','Material de gimnasio'],space:'Gimnasio + media cancha'},
 'MD-4':{t:'Fuerza específica (tensión)',type:'Físico',load:'Alta',rpe:'7–8',
  goal:'Muchas aceleraciones, frenos, cambios de dirección y duelos.',
  field:'Pliometría corta, espacios reducidos y pocos jugadores (1v1 a 4v4), repeticiones cortas con pausa amplia.',
  gym:'Si no hubo gimnasio en MD-5, va acá antes del campo.',sprint:'Aceleración: salidas de 10–20 m.',
  obj:['Ganar duelos y segundas pelotas','Presión tras pérdida','Aceleración y freno'],mat:['Conos','Pelotas','Pecheras (3 colores)','Mini arcos','2 arcos'],space:'Canchas reducidas'},
 'MD-3':{t:'Resistencia específica (duración)',type:'Táctico',load:'La más alta de la semana',rpe:'7–8',
  goal:'Volumen de juego en espacios grandes y trabajo táctico colectivo.',
  field:'8v8 a 11v11 en espacios amplios, bloques largos con pausas cortas. La carrera a alta velocidad aparece dentro del juego.',
  gym:'Sin gimnasio. Solo prevención en la entrada en calor.',sprint:'Sin bloque aparte: la velocidad alta sale de las tareas grandes.',
  obj:['Modelo de juego en espacio real','Sostener la intensidad en bloques largos','Plan de partido: fase ofensiva y defensiva'],mat:['Conos','Pelotas','Pecheras (2 colores)','2 arcos'],space:'Cancha completa'},
 'MD-2':{t:'Velocidad',type:'Campo',load:'Media-baja',rpe:'4–5',
  goal:'Acciones a máxima velocidad, con recuperación completa y poco volumen.',
  field:'Transiciones y finalización a máxima velocidad, pocas repeticiones. Pelota parada.',
  gym:'Potencia corta (15 min): saltos y lanzamientos, sin llegar a la fatiga.',sprint:'Velocidad máxima: 3–5 × 30–40 m con pausa completa.',
  obj:['Velocidad máxima sin fatiga','Transiciones rápidas y finalización','Pelota parada'],mat:['Conos','Pelotas','Pecheras','2 arcos','Balones medicinales'],space:'Cancha completa'},
 'MD-2c':{t:'Baja carga entre partidos',type:'Campo',load:'Baja',rpe:'3–4',
  goal:'Semana con dos partidos: recuperar y preparar el partido que viene, sin sumar fatiga.',
  field:'Rondo, táctico 11v11 corto y pelota parada. Los que no jugaron pueden hacer un extra.',
  gym:'Solo prevención. Fuerza únicamente para los que no jugaron.',sprint:'3–4 salidas de 20 m para mantener la exposición.',
  obj:['Recuperar','Plan del próximo partido','Pelota parada'],mat:['Conos','Pelotas','Pecheras','2 arcos'],space:'Cancha completa'},
 'MD-1':{t:'Activación previa al partido',type:'Pre-partido',load:'Baja',rpe:'2–3',
  goal:'Llegar activado y con el plan de partido claro.',
  field:'Rondos, reacción, estrategia 11v11 y pelota parada.',
  gym:'Nada.',sprint:'Reacción y salidas de 5–10 m.',
  obj:['Activar sin cansar','Repasar el plan de partido','Pelota parada a favor y en contra'],mat:['Conos','Pelotas','Pecheras','2 arcos'],space:'Cancha completa'},
 'B+2':{t:'Recuperación, excéntrico y compensatorio',type:'Regenerativo',load:'Baja para titulares, alta para suplentes',rpe:'2–4 / 6–8',gps:'Suplentes: unos 4.500 m en total, 350–380 m a alta velocidad, 40–50 m de sprint y 50–60 aceleraciones',
  goal:'Después del día libre: recuperar a los que jugaron, compensar a los que no y meter la dosis de excéntrico lejos del partido.',
  field:'Titulares: circuito de recuperación, aeróbico suave y movilidad. Suplentes y no convocados: 7v7 de 25–30 min y carreras de alta intensidad.',
  gym:'Excéntrico en dosis corta (nórdicos, deslizador, Copenhagen) y tren superior con zona media.',sprint:'Suplentes: carreras de alta intensidad dentro del compensatorio.',
  obj:['Titulares: recuperar','Suplentes: compensar la carga del partido','Excéntrico lejos del próximo partido'],mat:['Colchonetas y rodillos','Deslizadores','Pecheras','Pelotas','2 arcos'],space:'Gimnasio + media cancha'},
 'B-4':{t:'Fuerza explosiva y cambios de dirección',type:'Físico',load:'Alta',rpe:'6–9',gps:'Unos 3.500 m en total, 70–90 m a alta velocidad, 10–20 m de sprint y 80–90 aceleraciones',
  goal:'El día de más aceleraciones y frenos de la semana: fuerza por contrastes, saltos y espacios reducidos.',
  field:'Pliometría, cambios de dirección y 5v5 de 20–25 min, con táctica de aceleración y freno.',
  gym:'Fuerza explosiva por contrastes: serie pesada seguida de saltos.',sprint:'Aceleraciones cortas y cambios de dirección.',
  obj:['Fuerza explosiva','Acelerar, frenar y cambiar de dirección','Duelos y presión tras pérdida'],mat:['Material de gimnasio','Cajones bajos','Conos','Pecheras','2 arcos'],space:'Gimnasio + canchas reducidas'},
 'B-3':{t:'Metabólico y resistencia de juego',type:'Táctico',load:'La más alta de la semana',rpe:'6–9',gps:'5.000–6.000 m en total, 400–450 m a alta velocidad, 70–100 m de sprint y 40–50 aceleraciones',
  goal:'El día de más volumen: intermitente de alta intensidad y juego en cancha grande.',
  field:'Intermitente y 10v10 de 40–45 min con las reglas del modelo de juego.',
  gym:'Sin gimnasio.',sprint:'La carrera a alta velocidad sale del juego en espacio grande.',
  obj:['Resistencia de juego','Sostener la intensidad en bloques largos','Modelo de juego en espacio real'],mat:['Conos','Pecheras (2 colores)','Pelotas','2 arcos'],space:'Cancha completa'},
 'B-2':{t:'Mecánica de carrera y velocidad máxima',type:'Campo',load:'Media',rpe:'5–7',gps:'3.500–4.000 m en total, 150–200 m a alta velocidad, 200–300 m de sprint y 50–60 aceleraciones',
  goal:'Exposición a la velocidad máxima con el jugador fresco y poco volumen total.',
  field:'Técnica de carrera, velocidad máxima y táctico de 25–35 min.',
  gym:'Sin gimnasio.',sprint:'Técnica de carrera, progresivos y 3–5 sprints de 30–40 m por encima del 95 %.',
  obj:['Superar el 95 % de la velocidad máxima','Mecánica de carrera','Plan de partido'],mat:['Conos','Vallitas','Pecheras','Pelotas'],space:'Cancha completa'},
 'B-1':{t:'Activación, reacción y pelota parada',type:'Pre-partido',load:'Baja',rpe:'3–6',
  goal:'Sesión corta y distendida: activar, repasar la estrategia y la pelota parada.',
  field:'Juego recreativo, reacción y salidas cortas, estrategia 11v11 y pelota parada.',
  gym:'Nada. Los que no van al banco pueden hacer un compensatorio aparte.',sprint:'Reacción y salidas de 5–10 m.',
  obj:['Activar sin cansar','Estrategia del partido','Pelota parada a favor y en contra'],mat:['Conos','Pelotas','Pecheras','2 arcos'],space:'Cancha completa'},
 'MD':{t:'Partido',type:'',load:'Máxima',rpe:'8–10',goal:'Competencia.',field:'Entrada en calor y partido.',gym:'—',sprint:'—'},
 'PG1':{t:'Resistencia aeróbica y gimnasio',type:'Físico',load:'Alta',rpe:'6–7',goal:'Base aeróbica y fuerza base.',
  field:'Intermitente por grupos de nivel y técnica analítica.',gym:'Rodilla dominante y tracción (40–45 min).',sprint:'Progresiones en la entrada en calor.',
  obj:['Base aeróbica','Fuerza base: rodilla dominante y tracción','Técnica de pase'],mat:['Conos','Pelotas','Material de gimnasio'],space:'Cancha completa + gimnasio'},
 'PG2':{t:'Saltos, técnica de carrera y fuerza en campo',type:'Físico',load:'Alta',rpe:'7',goal:'Aprender a saltar y aterrizar, técnica de carrera y tensión en espacios reducidos.',
  field:'Pliometría básica y reducidos 2v2 a 4v4.',gym:'Sin gimnasio.',sprint:'Técnica de carrera y progresiones.',
  obj:['Aterrizar y saltar bien','Técnica de carrera','Duelos en espacios reducidos'],mat:['Conos','Pelotas','Pecheras (3 colores)','2 arcos'],space:'Canchas reducidas'},
 'PG3':{t:'Resistencia específica con pelota',type:'Táctico',load:'Alta',rpe:'7–8',goal:'Volumen de juego en espacios medianos y grandes.',
  field:'Juego de posición, 8v8 y cambios de frente.',gym:'Sin gimnasio.',sprint:'La velocidad alta aparece dentro del juego.',
  obj:['Sostener la intensidad con pelota','Principios ofensivos del modelo','Cambios de frente'],mat:['Conos','Pelotas','Pecheras (2 colores)','2 arcos'],space:'Cancha completa'},
 'PG4':{t:'Aceleración, gimnasio y juego de posición',type:'Físico',load:'Media-alta',rpe:'6–7',goal:'Aceleraciones, fuerza de cadera dominante y empuje, y posesión.',
  field:'Juego de posición 5v5+2.',gym:'Cadera dominante y empuje (40–45 min).',sprint:'Aceleración: 10–20 m.',
  obj:['Aceleración','Fuerza: cadera dominante y empuje','Conservar la pelota'],mat:['Conos','Pelotas','Pecheras','Material de gimnasio'],space:'Media cancha + gimnasio'},
 'PG5':{t:'Fútbol formal',type:'Táctico',load:'Alta',rpe:'7',goal:'Juego real para evaluar el modelo y sumar minutos.',
  field:'11v11 en bloques, con correcciones entre bloques.',gym:'Sin gimnasio.',sprint:'—',
  obj:['Modelo de juego en espacio real','Sumar minutos de juego'],mat:['Pelotas','Pecheras (2 colores)','2 arcos'],space:'Cancha completa'},
 'PG6':{t:'Regenerativo y técnica',type:'Regenerativo',load:'Baja',rpe:'3',goal:'Bajar la carga antes del descanso.',
  field:'Trote suave, movilidad y reducido libre.',gym:'Sin gimnasio.',sprint:'—',
  obj:['Recuperar','Técnica en situación de juego'],mat:['Conos','Pelotas','Pecheras'],space:'Media cancha'},
 'EV1':{t:'Evaluaciones: composición corporal, saltos y velocidad',type:'Físico',load:'Media',rpe:'5',goal:'Punto de partida de cada jugador.',
  field:'Evaluaciones en estaciones y un cierre técnico corto.',gym:'—',sprint:'10 y 30 m, y velocidad máxima.',
  obj:['Medir el punto de partida','Detectar déficits y asimetrías'],mat:['Balanza y plicómetro','Plataforma o app de salto','Fotocélulas o cronómetro','Conos'],space:'Vestuario + cancha'},
 'EV2':{t:'Evaluaciones: resistencia y fuerza',type:'Físico',load:'Alta',rpe:'8',goal:'Resistencia intermitente y fuerza.',
  field:'Test de resistencia y evaluación de fuerza.',gym:'Fuerza: 3–5 RM estimado.',sprint:'—',
  obj:['Medir resistencia intermitente','Medir fuerza para dosificar el gimnasio'],mat:['Audio del test y parlante','Conos','Material de gimnasio'],space:'Cancha + gimnasio'}
};

/* ---------- opciones de trabajos por día: jugadores, espacio, tiempo y pausa ---------- */
const o=(name,players,space,work,rest,min,notes)=>({name,players,space,work,rest,min,notes});
export const OPT={
 'MD-5':[
  o('Pase en rombo con cambio de dirección','Grupos de 5–6','12×12 m','4 × 3 min','1 min',16,'Dos toques, perfilarse y pasar al pie alejado. Cambiar el sentido en cada serie.'),
  o('Control orientado + conducción + pase (circuito en Y)','Grupos de 6','20×15 m','4 × 3 min','1 min',16,'Control con la pierna alejada, conducción a velocidad y pase tenso.'),
  o('Rondo 4v2','Grupos de 6','8×8 m','6 × 1 min 30 s','45 s',14,'Máximo dos toques. Cambian los del medio en cada serie.'),
  o('Juego de posición 5v5 + 2 comodines','12 jugadores','30×25 m','4 × 4 min','1 min 30 s',22,'Amplitud y profundidad. Punto cada 8 pases o al pasar por el comodín interior.'),
  o('Centros y finalización por oleadas','Todo el grupo, 2 arcos','Media cancha','2 × 8 min','2 min',20,'Combinación por fuera, centro y dos rematadores atacando primer y segundo palo.')],
 'MD-4':[
  o('1v1 con finalización','Parejas, 2 estaciones','15×10 m','2 × (6 × 20–30 s)','1 min 30 s entre repeticiones, 3 min entre series',16,'Duelo a máxima intensidad. Si el defensor recupera, ataca un mini arco.'),
  o('2v2 y 3v3 con arqueros','12–16 jugadores en 2 canchas','25×20 m','6 × 2 min','2 min',24,'Pelotas de reposición alrededor para no cortar el ritmo. Rotan los equipos.'),
  o('4v4 + 3 comodines con presión tras pérdida','11 jugadores por cancha','25×25 m','4 × 3 min','2 min',20,'6 segundos para recuperar después de perderla. Punto doble si recuperan.'),
  o('Rondo 5v2 con transición a mini arcos','Grupos de 7','10×10 m + 15 m de salida','6 × 1 min 30 s','1 min',15,'Si los dos del medio roban, salen a definir en un mini arco.'),
  o('Circuito técnico con frenos y giros','Grupos de 4–5','20×20 m','4 × 2 min','1 min',12,'Pared, giro, conducción con freno y remate. Calidad antes que velocidad.')],
 'MD-3':[
  o('8v8 + arqueros','18 jugadores','60×45 m','3 × 10 min','2 min 30 s',36,'Reglas del modelo de juego. Reposición rápida con pelotas en los arcos.'),
  o('11v11 táctico','22 jugadores','Cancha completa','3 × 12 min','3 min',45,'Un bloque por fase: salida, ataque organizado y presión. Corregir en la pausa.'),
  o('Juego de posición 7v7 + 3 comodines','17 jugadores','45×35 m','4 × 6 min','2 min',32,'Superioridad con comodines. Buscar al hombre libre y cambiar de frente.'),
  o('Pases largos, cambios de frente y finalización','Grupos de 8–10','Media cancha','2 × 8 min','2 min',20,'Cambio de frente, apoyo, centro y remate. Trabajar los dos perfiles.'),
  o('Ataque organizado 10v8 + contra a mini arcos','18 jugadores + arquero','3/4 de cancha','4 × 6 min','2 min',32,'El equipo que defiende sale rápido a dos mini arcos cuando recupera.')],
 'MD-2':[
  o('Transiciones 3v2 y 4v3 con finalización','Oleadas, todo el grupo','40×35 m','10–12 acciones de 8–12 s','1 min o más por jugador',20,'Atacar a máxima velocidad y definir en menos de 10 segundos.'),
  o('Ataque 6v4 + contraataque','10 jugadores + arquero por tanda','Media cancha','8 acciones de hasta 15 s','1 min 30 s',18,'Si la defensa recupera, sale de contra hacia la mitad de la cancha.'),
  o('Rondo 5v2 a un toque','Grupos de 7','10×10 m','4 × 1 min','1 min 30 s',10,'Velocidad de pase y de decisión. Baja densidad.'),
  o('Finalización tras desmarque de ruptura','Grupos de 3, 2 arcos','30×40 m','2 × 6 repeticiones','45–60 s entre repeticiones',15,'Pase filtrado, desmarque a máxima velocidad y remate de primera.'),
  o('Pelota parada ofensiva y defensiva','11v11','Área grande','15 min','—',15,'Córners, tiros libres laterales y saques de banda. Roles y marcas claras.')],
 'MD-1':[
  o('Rondo lúdico 6v2','Grupos de 8','10×10 m','3 × 2 min','1 min',10,'Activación con buen clima de grupo.'),
  o('Reacción + sprint de 5–10 m','Parejas','15 m','6–8 repeticiones','45–60 s',8,'Salidas con estímulo visual o sonoro, desde distintas posiciones.'),
  o('11v0 y 11v11 pasivo: salida, presión y estrategia','22 jugadores','Cancha completa','15 min','Pausas para corregir',15,'Repaso del plan de partido sin intensidad.'),
  o('Pelota parada: córners, tiros libres y laterales','11v11','Área grande','15 min','—',15,'A favor y en contra. Pocas repeticiones, bien hechas.'),
  o('Reducido libre 6v6','12 jugadores + arqueros','40×30 m','2 × 4 min','2 min',12,'Juego libre para terminar con buenas sensaciones.')],
 'MD+1':[
  o('Regenerativo de titulares: trote suave, movilidad y elongación','Los que jugaron más de 60 min','Perímetro de la cancha','2 × 8 min de trote + 15 min de movilidad','2 min',35,'Ritmo de conversación. Sumar rodillo o masaje si hay.'),
  o('Compensatorio: 4v4 + arqueros','Suplentes y no convocados (8–10)','30×25 m','4 × 4 min','2 min',24,'Alta intensidad con reposición rápida.'),
  o('Compensatorio: carreras de alta intensidad','Suplentes y no convocados','60 m','2 × (6 × 15 s fuerte / 15 s de pausa)','3 min entre series',10,'Ritmo cercano al máximo sostenible.'),
  o('Compensatorio: sprints','Suplentes y no convocados','30 m','4–6 × 30 m','2 min',10,'A máxima velocidad, con recuperación completa.')]
};

/* ---------- sesiones de sprint ---------- */
export const SPRINTS=[
 {name:'Técnica de carrera y progresiones',when:'Pretemporada general y entrada en calor de MD-5',work:'Skipping, talones y zancadas: 2 × 15 m de cada uno. Después 4–6 progresiones de 40 m al 70–85 %.',rest:'Vuelta caminando',total:'15 min',notes:'Postura alta, apoyo activo y braceo. Base para todo lo demás.'},
 {name:'Aceleración',when:'MD-4 y pretemporada',work:'2 × (4 × 10 m) + 1 × (4 × 20 m), con salidas variadas.',rest:'1 min por cada 10 m, 3 min entre series',total:'160 m · 12 min',notes:'Máxima intención en los primeros pasos. Cortar si baja la calidad.'},
 {name:'Velocidad máxima',when:'MD-2 y pretemporada específica',work:'3–5 × (20 m de lanzamiento + 20 m al máximo).',rest:'3–4 min',total:'120–200 m · 15 min',notes:'Objetivo: superar el 95 % de la velocidad máxima. Siempre sin fatiga y bien calentados.'},
 {name:'Sprints repetidos (RSA)',when:'Pretemporada específica, 1 vez por semana',work:'2–3 × (6 × 30 m).',rest:'20 s entre sprints, 4 min entre series',total:'360–540 m · 15 min',notes:'Mantener el tiempo de los primeros sprints. No hacerlo cerca del partido.'},
 {name:'Sprint resistido',when:'MD-4 y pretemporada',work:'6 × 15 m con trineo o goma.',rest:'2 min',total:'90 m · 12 min',notes:'Carga que frene poco: la técnica no debe cambiar.'},
 {name:'Cambios de dirección',when:'MD-4',work:'4 × 3 repeticiones de 5-0-5 o zigzag de 4 conos.',rest:'1 min entre repeticiones',total:'12 min',notes:'Frenar bajo y salir fuerte, a los dos lados.'},
 {name:'Compensatorio de suplentes',when:'MD+1',work:'4–6 × 30 m.',rest:'2 min',total:'120–180 m · 10 min',notes:'Para que los que no jugaron tengan su exposición semanal.'}
];
export const SPRINT_RULE='Regla práctica: cada jugador debería superar el 90–95 % de su velocidad máxima al menos una vez por semana, incluidos los suplentes y los que vuelven de una lesión. Nunca con fatiga ni sin una buena entrada en calor.';

/* ---------- plan de gimnasio por período ---------- */
const x=(name,sets,reps,load,rest,notes='')=>({name,sets,reps,load,rest,notes});
const blk=(block,...rows)=>rows.map(r=>({...r,block}));
const prep=()=>blk('Preparación',x('Rodillo y movilidad de tobillo, cadera y columna torácica','1','5 min','—','—','Buscar amplitud, sin apuro'),x('Activación: puente de glúteo y caminata lateral con banda','2','10','Banda','30 s'));
export const GYM_STRUCTURE=[
 ['Preparación','Rodillo, movilidad y activación de glúteos y zona media. 8–10 minutos.'],
 ['Pliometría y potencia','Saltos, aterrizajes o lanzamientos con el cuerpo fresco. Pocas repeticiones y pausa completa.'],
 ['Fuerza principal','Un patrón básico por sesión: sentadilla, peso muerto o press. Mover la carga con la mayor velocidad posible y lejos del fallo.'],
 ['Accesorios','Uno o dos ejercicios a una pierna o a un brazo, combinando tren inferior y superior: rodilla dominante con tracción, cadera dominante con empuje.'],
 ['Core','Ejercicios que frenan el movimiento: anti-extensión, anti-rotación y anti-flexión lateral.'],
 ['Cierre','Opcional, 12 minutos: 3 a 5 rondas de un empuje, una tracción y un ejercicio de core.']];
export const GYM=[
 {period:'PG',freq:'2–3 por semana',when:'Días no consecutivos, antes del campo o en doble turno',goal:'Adaptación y fuerza base por patrones de movimiento. Cargas medias y técnica perfecta.',routines:[
  {name:'Guía · Pretemporada general A (rodilla dominante y tracción)',category:'Fuerza',duration:45,indications:'Dejar 2 repeticiones de margen en cada serie. La técnica manda sobre la carga.',exercises:[
   ...prep(),
   ...blk('Pliometría y potencia',x('Aterrizaje desde cajón bajo','3','5','Peso corporal','45 s','Caer suave y estable'),x('Rebotes de tobillo (pogos)','3','10','Peso corporal','45 s')),
   ...blk('Fuerza principal',x('Sentadilla trasera','4','8','65–75 %','2 min','Profundidad completa y control')),
   ...blk('Accesorios',x('Sentadilla búlgara','3','8 por pierna','Mancuernas','90 s'),x('Remo invertido','3','8–10','Peso corporal','60 s'),x('Nórdicos','3','5','Peso corporal','2 min','Bajar lento')),
   ...blk('Core',x('Plancha frontal','3','5 × 5 s','Peso corporal','30 s'),x('Press Pallof','3','8 por lado','Banda','30 s')),
   ...blk('Cierre',x('3 rondas: flexiones de brazos, remo a un brazo y plancha lateral','3','10 · 10 por lado · 20 s por lado','Liviana','Sin pausa entre ejercicios'))]},
  {name:'Guía · Pretemporada general B (cadera dominante y empuje)',category:'Fuerza',duration:45,indications:'Complementa la rutina A. Sin llegar al fallo.',exercises:[
   ...prep(),
   ...blk('Pliometría y potencia',x('Salto horizontal','3','4','Peso corporal','60 s','Aterrizaje firme')),
   ...blk('Fuerza principal',x('Peso muerto con barra hexagonal','4','6–8','65–75 %','2 min','Espalda neutra')),
   ...blk('Accesorios',x('Empuje de cadera (hip thrust)','3','10','Media','90 s'),x('Peso muerto rumano a una pierna','3','8 por pierna','Mancuerna','60 s'),x('Press de banca con barra','4','8','65–75 %','90 s'),x('Press de rodillas a un brazo','3','8 por lado','Mancuerna','60 s')),
   ...blk('Core',x('Plancha lateral','3','5 × 5 s por lado','Peso corporal','30 s'),x('Caminata de granjero','3','20 m','Pesada','45 s')),
   ...blk('Cierre',x('3 rondas: Copenhagen, dominadas con banda y rollout con pelota','3','20 s por lado · 6 · 8','Peso corporal','Sin pausa entre ejercicios'))]}]},
 {period:'PE',freq:'2–3 por semana',when:'MD-5 y MD-4 respecto del amistoso',goal:'Fuerza máxima y potencia. Menos repeticiones, más carga y más velocidad.',routines:[
  {name:'Guía · Pretemporada específica (fuerza máxima y potencia)',category:'Potencia',duration:45,indications:'Pausas completas. Contraste: después de cada serie pesada de sentadilla, 3 saltos máximos.',exercises:[
   ...prep(),
   ...blk('Pliometría y potencia',x('Sentadilla con salto con carga liviana','4','4','30–40 %','2 min','Saltar lo más alto posible'),x('Salto a una pierna con caída en la misma','3','4 por pierna','Peso corporal','60 s')),
   ...blk('Fuerza principal',x('Sentadilla trasera + 3 saltos (contraste)','4','4','82–88 %','3 min'),x('Empuje de cadera (hip thrust)','4','5','80–85 %','2 min')),
   ...blk('Accesorios',x('Subida al banco','3','5 por pierna','Mancuernas','90 s'),x('Dominadas con agarre neutro','3','5','Peso corporal','90 s'),x('Nórdicos','3','6','Peso corporal','2 min')),
   ...blk('Core',x('Rotación con barra anclada','3','6 por lado','Liviana','45 s'),x('Copenhagen','3','8 por lado','Peso corporal','45 s'))]}]},
 {period:'C',freq:'2 por semana',when:'Fuerza en MD-5 o MD-4 y potencia corta en MD-2',goal:'Mantener la fuerza y la potencia con el mínimo volumen, sin llegar cargado al partido.',routines:[
  {name:'Guía · Competitivo fuerza (MD-5 o MD-4)',category:'Fuerza',duration:35,indications:'Poco volumen y carga alta. Nunca al fallo. Los que jugaron 90 minutos pueden bajar una serie.',exercises:[
   ...prep(),
   ...blk('Pliometría y potencia',x('Salto con contramovimiento con carga liviana','3','4','10–20 % del peso corporal','90 s')),
   ...blk('Fuerza principal',x('Sentadilla trasera o peso muerto con barra hexagonal','3','4','80–85 %','3 min'),x('Empuje de cadera (hip thrust)','3','5','80 %','2 min')),
   ...blk('Accesorios',x('Peso muerto rumano a una pierna','2','6 por pierna','Mancuerna','90 s'),x('Remo a un brazo con mancuerna','2','8 por lado','Media','60 s'),x('Nórdicos','2','5','Peso corporal','2 min')),
   ...blk('Core',x('Copenhagen','2','8 por lado','Peso corporal','45 s'),x('Press Pallof','2','10 por lado','Banda','45 s'))]},
  {name:'Guía · Competitivo potencia (MD-2)',category:'Potencia',duration:15,indications:'Corta y explosiva. Si alguien está cargado, no la hace.',exercises:[
   ...blk('Pliometría y potencia',x('Salto con contramovimiento con carga liviana','3','4','10–20 % del peso corporal','90 s'),x('Rebotes de tobillo (pogos)','3','10','Peso corporal','60 s'),
   x('Salto horizontal','3','3','Peso corporal','90 s'),x('Lanzamiento de balón medicinal','3','5','3–5 kg','60 s'))]}]},
 {period:'T',freq:'2–3 por semana',when:'Desde la semana 3 de la transición, por cuenta de cada jugador',goal:'Mantener una base general y llegar sano a la pretemporada.',routines:[
  {name:'Guía · Transición (general)',category:'Fuerza',duration:40,indications:'Circuito general. Sumar 20–30 minutos de aeróbico suave 2 veces por semana.',exercises:[
   ...blk('Preparación',x('Movilidad general','1','10 min','—','—')),
   ...blk('Fuerza principal',x('Sentadilla goblet','3','12','Media','60 s'),x('Peso muerto rumano a una pierna','3','10 por pierna','Liviana','60 s')),
   ...blk('Accesorios',x('Zancada hacia atrás','3','10 por pierna','Mancuernas','60 s'),x('Remo a un brazo con mancuerna','3','12 por lado','Media','60 s'),x('Flexiones de brazos','3','12','Peso corporal','60 s')),
   ...blk('Core',x('Plancha frontal y lateral','3','30 s','Peso corporal','30 s'))]}]},
 {period:'X',title:'Core y prevención (todo el año)',freq:'En todas las sesiones',when:'Al inicio, como activación: se busca activar, no fatigar',goal:'La zona media transmite la fuerza entre piernas y brazos, y su trabajo principal es frenar movimientos. Progresión: en los ejercicios con carga, 3 × 8 la primera semana, 3 × 10 la segunda y 3 × 12 la tercera; en los de sostén, 3 series de 5 contracciones de 5 segundos.',routines:[
  {name:'Guía · Core (zona media)',category:'Core',duration:15,indications:'Elegir un ejercicio de cada bloque por sesión e ir rotando. Respirar normal: no aguantar el aire.',exercises:[
   ...blk('Anti-extensión',x('Plancha frontal','3','5 × 5 s','Peso corporal','30 s'),x('Rollout con pelota','3','8','Peso corporal','45 s')),
   ...blk('Anti-rotación',x('Press Pallof','3','8 por lado','Banda','30 s'),x('Plancha estirando un brazo','3','6 por lado','Peso corporal','30 s')),
   ...blk('Anti-flexión lateral',x('Plancha lateral','3','5 × 5 s por lado','Peso corporal','30 s'),x('Caminata de granjero','3','20 m','Pesada','45 s')),
   ...blk('Glúteos y estabilidad de cadera',x('Puente de glúteo a una pierna','3','8 por pierna','Peso corporal','30 s'),x('Perro de caza','3','6 por lado','Peso corporal','30 s'))]},
  {name:'Guía · Prevención diaria (10 min)',category:'Prevención',duration:10,indications:'En la entrada en calor de todos los entrenamientos.',exercises:[
   x('Puente de glúteo a una pierna','2','8 por pierna','Peso corporal','30 s'),x('Copenhagen','2','15 s por lado','Peso corporal','30 s'),x('Plancha lateral','2','20 s por lado','Peso corporal','30 s'),
   x('Caminata lateral con banda','2','10 pasos por lado','Banda','30 s'),x('Gemelo excéntrico','2','10','Peso corporal','30 s'),x('Movilidad de cadera y tobillo','1','2 min','—','—')]}]}
];
const GYM_F={PG:'Guía · Pretemporada general A (rodilla dominante y tracción)',PE:'Guía · Pretemporada específica (fuerza máxima y potencia)',C:'Guía · Competitivo fuerza (MD-5 o MD-4)'};

/* ---------- pliometría ---------- */
export const PLIO_TYPES=[
 ['Salto','Despegue con dos piernas y caída con dos.'],['Multisalto','Despegue con una pierna y caída con la otra.'],['Salto a una pierna','Despegue y caída con la misma pierna.'],
 ['Dirección','Lineal, lateral o con giro; hacia arriba o hacia adelante. El fútbol pide las tres.'],
 ['Forma de inicio','Sin contramovimiento, con contramovimiento, con doble contacto, continuos o con caída desde altura. En ese orden sube la exigencia.']];
export const PLIO_LEVELS=[
 {n:1,name:'Aterrizajes',ex:'Aterrizaje desde cajón bajo, lateral y a una pierna',need:'Sin requisito. Es el primer paso para todos.',dose:'3 × 5'},
 {n:2,name:'Rebotes y saltos simples',ex:'Rebotes de tobillo, salto con contramovimiento, salto al cajón',need:'Aterrizar estable y en silencio.',dose:'3 × 6–10'},
 {n:3,name:'Saltos repetidos',ex:'Sentadilla con salto, salto horizontal, vallas bajas',need:'Sentadilla con una carga cercana al peso corporal.',dose:'3–4 × 5–6'},
 {n:4,name:'Saltos a una pierna',ex:'Salto a una pierna hacia adelante y lateral',need:'Buen control de rodilla en el aterrizaje a una pierna.',dose:'3 × 4–5 por pierna'},
 {n:5,name:'Multisaltos',ex:'Multisaltos alternados, saltos encadenados',need:'Sentadilla cercana a 1,5 veces el peso corporal.',dose:'3 × 6–8 apoyos'},
 {n:6,name:'Saltos con caída',ex:'Salto con caída desde 30 cm, salto en profundidad',need:'Buena base de fuerza (referencia: sentadilla de 1,5 a 2 veces el peso corporal) y contactos cortos.',dose:'3 × 4–5'}];
export const PLIO_RULES=[
 'Siempre al principio de la sesión, después de la entrada en calor y con el jugador fresco.',
 'Calidad antes que cantidad: cada salto a máxima intención y con pausa completa (45–90 segundos entre series).',
 'Volumen de referencia por sesión: 40–60 contactos al empezar, 60–100 en nivel intermedio. Una o dos veces por semana.',
 'Primero se aprende a aterrizar y después a saltar. No se pasa de nivel si el aterrizaje no es estable.',
 'En semana de competencia va en el día de fuerza (MD-4 o MD-5), nunca el día previo al partido con saltos con caída.'];

/* ---------- evaluaciones ---------- */
export const TESTS=[
 {g:'Composición corporal',when:'Inicio y fin de pretemporada; después, cada 6–8 semanas',items:[
  ['Peso y talla','kg / cm','Siempre a la misma hora y con la misma balanza.'],['Suma de 6 pliegues o % de grasa','mm / %','Mismo evaluador y mismo plicómetro.']]},
 {g:'Fuerza',when:'Inicio y fin de pretemporada, y a mitad de temporada',items:[
  ['Sentadilla o trap bar: máximo estimado con 3–5 repeticiones','kg','Sirve para dosificar el gimnasio. Compararlo con el peso corporal.'],['Hip thrust: máximo estimado','kg',''],
  ['Isquiotibiales: Nordic (repeticiones o ángulo de caída) o isométrico','rep / N','Detecta déficit y diferencias entre piernas.'],['Aductores: test de apretar con esfigmomanómetro','mmHg','También sirve como control semanal de la zona inguinal.']]},
 {g:'Potencia de salto',when:'Batería completa en pretemporada; el CMJ, todas las semanas',items:[
  ['CMJ (salto con contramovimiento)','cm','Control semanal de fatiga: comparar con el promedio de cada jugador.'],['SJ (salto sin contramovimiento)','cm',''],
  ['Salto a una pierna (vertical u horizontal)','cm','Diferencia mayor al 10–15 % entre piernas: revisar.'],['Salto horizontal','cm','']]},
 {g:'Velocidad y cambio de dirección',when:'Inicio y fin de pretemporada; después, cada 6–8 semanas',items:[
  ['Sprint 10 m','s','Aceleración.'],['Sprint 30 m, con parciales a 10 y 20 m','s',''],['Velocidad máxima (20 m lanzados o GPS)','km/h','Referencia para medir la exposición semanal a sprint.'],['5-0-5 o T-test','s','Cambio de dirección, hacia los dos lados.']]},
 {g:'Resistencia',when:'Inicio y fin de pretemporada, y a mitad de temporada',items:[
  ['30-15 IFT','km/h','La velocidad final sirve para dosificar los intermitentes.'],['Yo-Yo IR1 (IR2 en planteles muy entrenados)','m','Elegir uno de los dos tests y repetir siempre el mismo.'],['RSA: 6 × 30 m con 20 s de pausa','s','Promedio y caída entre el mejor y el peor sprint.']]},
 {g:'Movilidad y prevención',when:'Inicio de pretemporada y al volver de una lesión',items:[
  ['Dorsiflexión de tobillo (rodilla a la pared)','cm','Comparar lado a lado.'],['Flexibilidad de isquiotibiales (extensión activa de rodilla)','grados',''],['Test de Thomas (flexores de cadera)','—',''],['Saltos a una pierna (hop tests)','cm','Criterio para volver al campo después de una lesión.']]}
];
export const TEST_NAMES=['Peso','Talla','Suma de 6 pliegues','% grasa','Sentadilla (máximo estimado)','Hip thrust (máximo estimado)','Nordic','Aductores (apretar)','CMJ','SJ','Salto a una pierna derecha','Salto a una pierna izquierda','Salto horizontal','Sprint 10 m','Sprint 20 m','Sprint 30 m','Velocidad máxima','5-0-5','T-test','30-15 IFT','Yo-Yo IR1','Yo-Yo IR2','RSA 6×30 m (promedio)','Tobillo: rodilla a la pared'];

/* ---------- datos a registrar ---------- */
export const DATA=[
 {g:'Todos los días, antes de entrenar',items:[['Bienestar: sueño, cansancio, dolor muscular y estrés (1 a 5)','Bienestar'],['Zona de dolor o molestia','Bienestar'],['Asistencia y motivo de la ausencia','Asistencia'],['Disponibilidad: lesionado, en readaptación o disponible','Lesiones'],['Peso corporal, 1–2 veces por semana (antes y después si hace mucho calor)','Tests']]},
 {g:'En cada entrenamiento',items:[['Duración real y contenido de la sesión','Sesiones'],['RPE de cada jugador, 15–30 min después de terminar','Bienestar'],['Carga = RPE × minutos, del grupo y de cada jugador','Sesiones y Bienestar'],['Golpes, molestias y jugadores que no terminaron','Sesiones'],['GPS, si hay: distancia total, metros a alta velocidad, sprints, aceleraciones y velocidad pico','']]},
 {g:'Una vez por semana',items:[['CMJ en MD-5 o MD-4, para controlar la fatiga','Tests'],['Aductores: test de apretar','Tests'],['Quién superó el 90 % de su velocidad máxima','Sesiones'],['Carga de la semana comparada con las anteriores','Resumen'],['Lo que hizo cada uno en el gimnasio','Gimnasio']]},
 {g:'Día de partido: antes',items:[['Bienestar del día','Bienestar'],['Peso antes de la entrada en calor','Tests'],['Convocados','Partidos']]},
 {g:'Día de partido: durante',items:[['Minutos jugados por jugador','Partidos'],['Goles, asistencias y tarjetas','Partidos'],['Cambios y su motivo: táctico, lesión o cansancio','Partidos'],['Pelota parada a favor y en contra','Partidos']]},
 {g:'Día de partido: después',items:[['RPE del partido de cada jugador (carga = RPE × minutos jugados)','Bienestar'],['Golpes y lesiones','Lesiones'],['Peso después del partido','Tests']]},
 {g:'El día siguiente (MD+1)',items:[['Bienestar y dolor: es el dato más útil de la semana','Bienestar'],['Quién jugó más de 60 min (recuperación) y quién menos (compensatorio)','Sesiones']]}
];

/* ---------- plantillas de sesión ---------- */
const X={
 w1:{part:'Entrada en calor',name:'Activación, movilidad y prevención',time:15,space:'Media cancha',org:'Todo el grupo',desc:'Movilidad dinámica 5 min\nPrevención: Copenhagen, puente de glúteo y core (2 × 8–10)\nTécnica de carrera y 3 progresiones de 30 m',mat:''},
 wm:{part:'Entrada en calor',name:'Movilidad general',time:10,space:'Media cancha',org:'Todo el grupo',desc:'Movilidad articular y activación suave',mat:''},
 cool:{part:'Vuelta a la calma',name:'Elongación y charla',time:8,space:'',org:'Todo el grupo',desc:'Elongación suave. Cada jugador carga su RPE desde su link.',mat:''},
 gymF:{part:'Parte principal',name:'Gimnasio: fuerza',time:35,space:'Gimnasio',org:'2–3 grupos por estación',desc:'',mat:'Barras, discos, mancuernas'},
 gymB:{part:'Parte principal',name:'Gimnasio: cadera dominante y empuje',time:40,space:'Gimnasio',org:'2–3 grupos por estación',desc:'Rutina: Guía · Pretemporada general B (cadera dominante y empuje)',mat:'Barras, mancuernas, bandas'},
 gymC:{part:'Parte principal',name:'Gimnasio: fuerza explosiva por contrastes',time:30,space:'Gimnasio',org:'2–3 grupos por estación',desc:'',mat:'Barras, discos, cajones'},
 plio:{part:'Parte principal',name:'Pliometría: aterrizajes y saltos',time:10,space:'10×10 m',org:'Filas de 4–5',desc:'Aterrizaje desde cajón bajo 2 × 5\nSalto con contramovimiento 3 × 5\nSaltos laterales a una pierna 2 × 4 por pierna\nPausa: 45–60 s. Máxima intención y caída estable',mat:'Cajones bajos, vallas'},
 spC:{part:'Parte principal',name:'Cambios de dirección',time:10,space:'10×10 m',org:'Filas de 4–5',desc:'4 × 3 repeticiones de 5-0-5 o zigzag de 4 conos\nPausa: 1 min entre repeticiones\nFrenar bajo y salir fuerte, a los dos lados',mat:'Conos'},
 rec:{part:'Parte principal',name:'Circuito de recuperación',time:12,space:'Gimnasio o costado de la cancha',org:'Los que jugaron más de 60 min',desc:'2–3 vueltas de 6–8 ejercicios, 20 s de trabajo y 20 s de pausa\nMovilidad, tren superior y zona media, sin impacto',mat:'Colchonetas, bandas, rodillos'},
 cardio:{part:'Parte principal',name:'Aeróbico suave',time:20,space:'Bicicleta fija o perímetro de la cancha',org:'Los que jugaron más de 60 min',desc:'15–20 min a ritmo de conversación',mat:''},
 ecc:{part:'Parte principal',name:'Excéntrico en dosis corta',time:10,space:'Gimnasio o costado de la cancha',org:'Todo el grupo',desc:'2 series de 5–6 repeticiones\nNórdicos, curl de isquiotibiales con deslizador y Copenhagen\nLejos del próximo partido para que el dolor muscular no llegue al fin de semana',mat:'Deslizadores, colchonetas'},
 comp7:{part:'Parte principal',name:'Compensatorio: 7v7 con arqueros',time:28,space:'55×40 m',org:'Suplentes y no convocados (14 + arqueros)',desc:'4 × 6 min con 1 min 30 s de pausa\nAlta intensidad con reposición rápida',mat:'Pecheras, pelotas, 2 arcos'},
 g5:{part:'Parte principal',name:'5v5 con arqueros',time:24,space:'40×30 m',org:'12 jugadores por cancha',desc:'4 × 5 min con 1 min 30 s de pausa\nMuchas aceleraciones, frenos y duelos. Presión tras pérdida',mat:'Pecheras, pelotas, 2 arcos'},
 hiit:{part:'Parte principal',name:'Intermitente de alta intensidad',time:16,space:'Cancha completa',org:'2–3 grupos por nivel',desc:'2 × 6 min de 15 s de carrera fuerte / 15 s de pausa\nPausa: 3 min entre bloques\nDistancia según la velocidad del 30-15 IFT',mat:'Conos'},
 g10:{part:'Parte principal',name:'10v10 con arqueros',time:46,space:'Cancha completa',org:'22 jugadores',desc:'4 × 10 min con 2 min de pausa\nResistencia de juego con las reglas del modelo',mat:'Pecheras, pelotas'},
 tac30:{part:'Parte principal',name:'Táctico: plan de partido',time:30,space:'Cancha completa',org:'22 jugadores',desc:'Bloques cortos a ritmo de partido con pausas para corregir\nPoco volumen: se cuida la frescura',mat:'Pecheras'},
 gymP:{part:'Parte principal',name:'Gimnasio: potencia corta',time:15,space:'Gimnasio o costado de la cancha',org:'Grupos de 4–5',desc:'Rutina: Guía · Competitivo potencia (MD-2)\nSaltos y lanzamientos, sin fatiga',mat:'Balones medicinales'},
 spT:{part:'Parte principal',name:'Sprint: técnica de carrera y progresiones',time:15,space:'40 m',org:'Filas de 4–5',desc:'Skipping, talones y zancadas: 2 × 15 m de cada uno\n4–6 progresiones de 40 m al 70–85 %\nPausa: vuelta caminando',mat:'Conos'},
 spA:{part:'Parte principal',name:'Sprint: aceleración',time:12,space:'20 m',org:'Filas de 4–5',desc:'2 × (4 × 10 m) + 1 × (4 × 20 m), con salidas variadas\nPausa: 1 min por cada 10 m, 3 min entre series',mat:'Conos'},
 spV:{part:'Parte principal',name:'Sprint: velocidad máxima',time:15,space:'40 m',org:'Filas de 3–4',desc:'3–5 × (20 m de lanzamiento + 20 m al máximo)\nPausa: 3–4 min\nObjetivo: más del 95 % de la velocidad máxima',mat:'Conos'},
 spR:{part:'Parte principal',name:'Sprint: sprints repetidos (RSA)',time:15,space:'30 m',org:'Grupos de 6',desc:'2–3 × (6 × 30 m)\nPausa: 20 s entre sprints, 4 min entre series',mat:'Conos'},
 spS:{part:'Parte principal',name:'Sprint: salidas cortas',time:8,space:'20 m',org:'Filas de 4–5',desc:'3–4 × 20 m con pausa de 1 min 30 s',mat:'Conos'},
 aer:{part:'Parte principal',name:'Resistencia intermitente por grupos de nivel',time:24,space:'Cancha completa',org:'2–3 grupos según el test',desc:'2 × 8 min de 15 s de carrera / 15 s de pausa\nPausa: 3 min entre bloques\nDistancia según la velocidad del 30-15 IFT (o 4 × 4 min a ritmo fuerte con 3 min de pausa)',mat:'Conos'},
 f11:{part:'Parte principal',name:'11v11 en bloques',time:50,space:'Cancha completa',org:'22 jugadores',desc:'3 × 15 min con 2–3 min de pausa\nCorrecciones del modelo de juego en cada pausa',mat:'Pecheras, pelotas'},
 tac:{part:'Parte principal',name:'11v11 táctico corto',time:20,space:'Cancha completa',org:'22 jugadores',desc:'2 × 8 min con 2 min de pausa\nPlan del próximo partido, a media intensidad',mat:'Pecheras'},
 pre:{part:'Parte principal',name:'Estrategia: 11v0 y 11v11 pasivo',time:12,space:'Cancha completa',org:'22 jugadores',desc:'Repaso del plan de partido sin intensidad',mat:'Pecheras'},
 ev1a:{part:'Parte principal',name:'Composición corporal',time:30,space:'Vestuario',org:'De a uno, antes de entrar en calor',desc:'Peso, talla y suma de 6 pliegues',mat:'Balanza, plicómetro'},
 ev1b:{part:'Parte principal',name:'Saltos: CMJ, SJ y a una pierna',time:25,space:'Costado de la cancha',org:'Grupos de 5–6 en estaciones',desc:'3 intentos de cada salto, se anota el mejor\nPausa: 1 min',mat:'Plataforma o app de salto'},
 ev1c:{part:'Parte principal',name:'Velocidad: 10 m, 30 m y velocidad máxima',time:25,space:'40 m',org:'Grupos de 5–6',desc:'2–3 intentos de 30 m con parciales\nPausa: 3 min',mat:'Fotocélulas o cronómetro, conos'},
 ev2a:{part:'Parte principal',name:'Resistencia: 30-15 IFT o Yo-Yo IR1',time:25,space:'40 m de ancho',org:'2 tandas',desc:'Anotar la velocidad o la distancia final de cada jugador',mat:'Audio del test, parlante, conos'},
 ev2b:{part:'Parte principal',name:'Fuerza: máximo estimado',time:35,space:'Gimnasio',org:'Grupos de 4',desc:'Sentadilla o trap bar y hip thrust: 3–5 repeticiones con la mayor carga y buena técnica',mat:'Barras y discos'}
};
const TPL={
 'MD+1':['wm','MD+1:0','MD+1:1','MD+1:2','MD+1:3','cool'],
 'MD-5':['w1','gymF','MD-5:0','MD-5:3','cool'],
 'MD-4':['w1','plio','spA','MD-4:0','MD-4:1','cool'],
 'B+2':['wm','rec','cardio','ecc','comp7','MD+1:2','cool'],
 'B-4':['w1','gymC','plio','spC','g5','cool'],
 'B-3':['w1','hiit','g10','cool'],
 'B-2':['w1','spT','spV','tac30','cool'],
 'B-1':['MD-1:0','MD-1:1','MD-1:2','MD-1:3','cool'],
 'MD-3':['w1','MD-3:2','MD-3:1','cool'],
 'MD-2':['w1','gymP','spV','MD-2:0','MD-2:4','cool'],
 'MD-2c':['w1','MD-2:2','spS','tac','MD-2:4','cool'],
 'MD-1':['MD-1:0','MD-1:1','MD-1:2','MD-1:3','cool'],
 'PG1':['w1','aer','MD-5:0','gymF','cool'],
 'PG2':['w1','spT','plio','MD-4:1','MD-4:2','cool'],
 'PG3':['w1','MD-3:2','MD-3:0','MD-3:3','cool'],
 'PG4':['w1','spA','gymB','MD-5:3','cool'],
 'PG5':['w1','MD-5:2','f11','cool'],
 'PG6':['wm','MD+1:0','MD-1:4','cool'],
 'EV1':['ev1a','w1','ev1b','ev1c','MD-5:2','cool'],
 'EV2':['w1','ev2a','ev2b','cool']
};
export const TEMPLATE_KEYS=['MD+1','MD-5','MD-4','MD-3','MD-2','MD-2c','MD-1','B+2','B-4','B-3','B-2','B-1','PG1','PG2','PG3','PG4','PG5','PG6','EV1','EV2'];
export const mdLabel=k=>k==='MD-2c'?'MD-2':/^B[+-]\d$/.test(k)?'MD'+k.slice(1):k.startsWith('PG')?'Día '+k.slice(2):k.startsWith('EV')?'Evaluación '+k.slice(2):k;

function taskOf(id,period,key){
 if(X[id]){const t={...X[id]};if(id==='gymF')t.desc='Rutina: '+(GYM_F[period]||GYM_F.C);if(id==='gymC')t.desc='Rutina: '+(GYM_F[period==='PE'?'PE':'C'])+'\nContraste: después de cada serie pesada, 3–4 saltos máximos';return t}
 const [code,i]=id.split(':');const p=OPT[code][+i];
 const part=(key==='MD-1'||key==='B-1')&&id==='MD-1:0'?'Entrada en calor':'Parte principal';
 return {part,name:p.name,time:p.min,space:p.space,org:p.players,desc:p.work+(p.rest&&p.rest!=='—'?'\nPausa: '+p.rest:'')+'\n'+p.notes,mat:''};
}
/** Arma la sesión de un día. e = {key, last, gym}; period = PG | PE | C */
export function sessionFor(e,period='C'){
 const key=e.key;let ids=[...TPL[key]];
 if(key==='MD-4'&&e.gym)ids=['w1','gymF','spA','MD-4:1','MD-4:2','cool'];
 if(period==='PE')ids=ids.map(v=>v==='spA'?'spR':v);
 if(e.last)ids.splice(ids.length-1,0,...(ids.includes('MD-2:4')?['pre']:['MD-2:4','pre']));
 const tasks=ids.map(id=>taskOf(id,period,key));const info=INFO[key];
 return {type:info.type,focus:(/^(MD|B)/.test(key)?mdLabel(key)+' · ':'')+info.t+(e.last?' + previa del partido':''),objectives:info.obj.join('\n'),materials:info.mat.join('\n'),space:info.space,
  duration:key==='MD+1'?60:key==='B+2'?75:tasks.reduce((a,t)=>a+t.time,0),tasks,gcode:key};
}

/** Distribución de la semana. matchDay y match2: 0 = domingo … 6 = sábado, -1 = sin partido. */
export function weekLayout({period='C',matchDay=0,match2=-1,trainDays=[1,2,3,4,5],gweek=2,model='A'}){
 const noMatch=period==='PG'||period==='T'||matchDay<0;
 const ms=noMatch?[]:[matchDay,...(match2>=0&&match2!==matchDay&&period==='C'?[match2]:[])];
 const start=noMatch?1:(matchDay+1)%7;const out=[];let n=0;
 for(let i=0;i<7;i++){
  const wd=(start+i)%7;const tr=trainDays.includes(wd);let code='',key=null;
  if(ms.length){
   const dn=Math.min(...ms.map(m=>(m-wd+7)%7)),dp=Math.min(...ms.map(m=>(wd-m+7)%7));
   code=dn===0?'MD':dn===1?'MD-1':dp===1?'MD+1':dp+dn<=4?'MD-2c':'MD-'+dn;
   if(model==='B'&&ms.length===1){
    // Modelo B: MD+1 libre, MD+2 recuperación y compensatorio, MD-4 fuerza explosiva, MD-3 metabólico, MD-2 velocidad
    if(dp===2)code='MD+2';
    if(tr&&code!=='MD'&&code!=='MD+1')key=code==='MD+2'?'B+2':code==='MD-1'?'B-1':'B'+code.slice(2);
    if(code==='MD+1')out.push({wd,code,key:null,train:false,rest:true});
   }else if(tr&&code!=='MD')key=code;
   if(model==='B'&&ms.length===1&&code==='MD+1')continue;
  }else if(tr&&period!=='T'){key=period==='PG'&&gweek===1&&n<2?'EV'+(n+1):'PG'+((n%6)+1);code=key;n++}
  out.push({wd,code,key,train:!!key});
 }
 if(ms.length)for(let i=0;i<7;i++)if(out[i].code==='MD')for(let j=1;j<7;j++){const e=out[(i-j+7)%7];if(e.code==='MD')break;if(e.train){if(e.code!=='MD-1'&&e.code!=='MD+1')e.last=true;break}}
 out.sort((a,b)=>((a.wd-start+7)%7)-((b.wd-start+7)%7));
 const has5=out.some(e=>e.key==='MD-5');out.forEach(e=>{if(e.key==='MD-4'&&!has5)e.gym=true});
 return out;
}

/** Arma mesociclos y microciclos de todo el año. */
export function planYear({start,preWeeks=6,seasonEnd,transWeeks=4,matchDay=0,match2=-1}){
 let end=start;while(weekday(end)!==matchDay)end=addDays(end,1);if(diff(start,end)<3)end=addDays(end,7);
 const micros=[];let s=start,e=end;const g=Math.ceil(preWeeks/2);const day=DAYS[matchDay].toLowerCase();
 const next=()=>{s=addDays(e,1);e=addDays(s,6)};
 for(let i=1;i<=preWeeks;i++){
  const gen=i<=g,w=gen?i:i-g,lastG=i===g,lastE=i===preWeeks;
  micros.push(gen?{start:s,end:e,gperiod:'PG',gweek:w,type:w===1?'Ordinario':lastG?'Impacto':'Carga',match:'',focus:w===1?'Evaluaciones iniciales y adaptación. Volumen en subida':lastG?'Semana de mayor volumen de la pretemporada':'Volumen alto: resistencia aeróbica y fuerza base'}
   :{start:s,end:e,gperiod:'PE',gweek:w,type:lastE?'Ajuste':w===1?'Carga':'Impacto',match:'Amistoso el '+day,focus:lastE?'Puesta a punto: baja el volumen y se mantiene la intensidad. Repetir evaluaciones':'Intensidad alta, modelo de juego y amistoso'});
  next();
 }
 let c=0;const md=DAYS[matchDay].toLowerCase()+(match2>=0&&match2!==matchDay?' y '+DAYS[match2].toLowerCase():'');
 while(s<=seasonEnd&&c<60){c++;micros.push({start:s,end:e,gperiod:'C',gweek:c,type:'Competitivo',match:'Partido: '+md,focus:c%6===0?'Microciclo por MD. Semana de re-evaluación: CMJ, 10 y 30 m y antropometría':'Microciclo por MD'});next()}
 for(let i=1;i<=transWeeks;i++){micros.push({start:s,end:e,gperiod:'T',gweek:i,type:'Recuperación',match:'',focus:i<=2?'Descanso activo: sin entrenamientos de club':'Plan individual: gimnasio general y aeróbico suave'});next()}
 const P=id=>PERIODS.find(p=>p.id===id);const obj=id=>P(id).goals.join('\n');
 const of=id=>micros.filter(m=>m.gperiod===id);const mesos=[];
 const add=(name,phase,list,id)=>{if(list.length)mesos.push({name,phase,start:list[0].start,end:list[list.length-1].end,objective:obj(id)})};
 add('Pretemporada general','Pretemporada',of('PG'),'PG');add('Pretemporada específica','Precompetitivo',of('PE'),'PE');
 const comp=of('C');for(let i=0;i<comp.length;i+=4)add('Competitivo '+(i/4+1),'Competitivo',comp.slice(i,i+4),'C');
 add('Transición','Transición',of('T'),'T');
 return {mesos,micros,firstMatch:comp[0]?comp[0].end:null,compWeeks:c,preEnd:micros[preWeeks-1]?micros[preWeeks-1].end:null};
}
